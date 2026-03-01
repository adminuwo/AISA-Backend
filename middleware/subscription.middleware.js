/**
 * ════════════════════════════════════════════════════════
 *  SECURE SUBSCRIPTION MIDDLEWARE
 *  All plan logic is enforced SERVER-SIDE only.
 *  Frontend cannot override limits.
 *  Usage is counted per EMAIL (not per device).
 * ════════════════════════════════════════════════════════
 */

import MonthlyUsage from '../models/MonthlyUsage.js';
import User from '../models/User.js';
import { PLAN_LIMITS, getUsageKey, normalisePlan } from '../config/planLimits.js';

// ─────────────────────────────────────────────────────────
//  HELPER: Check & handle plan expiry
//  Returns the final normalised plan string (may downgrade)
// ─────────────────────────────────────────────────────────
const handlePlanExpiry = async (user) => {
    const plan = normalisePlan(user.plan);

    if (plan !== 'basic' && user.planEndDate) {
        const now = new Date();
        if (now > new Date(user.planEndDate)) {
            // ── Plan has expired → downgrade to basic ──
            user.plan = 'basic';
            user.isExpired = true;
            user.planExpiredAt = now;
            await user.save();
            return { plan: 'basic', expired: true };
        }
    }

    return { plan, expired: false };
};

// ─────────────────────────────────────────────────────────
//  MAIN MIDDLEWARE FACTORY
//  Usage: checkSubscriptionLimit('image')
// ─────────────────────────────────────────────────────────
export const checkSubscriptionLimit = (feature) => {
    return async (req, res, next) => {
        try {
            // ── 1. Identity comes ONLY from the verified JWT ──
            const userId = req.user?.id || req.user?._id;
            const jwtEmail = req.user?.email;

            if (!userId || !jwtEmail) {
                return res.status(401).json({
                    success: false,
                    code: 'UNAUTHORIZED',
                    message: 'Authentication required'
                });
            }

            // ── 2. Always fetch fresh user data from DB ──
            //    Never trust frontend-sent plan / usage values
            const user = await User.findById(userId).select(
                'email plan planEndDate planStartDate isExpired isBlocked isActive'
            );

            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }

            // ── 3. Security: email in token must match DB record ──
            if (user.email.toLowerCase() !== jwtEmail.toLowerCase()) {
                console.error(`[SECURITY] Token email mismatch! Token: ${jwtEmail}, DB: ${user.email}`);
                return res.status(403).json({
                    success: false,
                    code: 'TOKEN_EMAIL_MISMATCH',
                    message: 'Security violation detected'
                });
            }

            // ── 4. Check if account is blocked ──
            if (user.isBlocked) {
                return res.status(403).json({
                    success: false,
                    code: 'ACCOUNT_BLOCKED',
                    message: 'Your account has been suspended. Please contact support.'
                });
            }

            // ── 5. Handle plan expiry (auto-downgrade to basic) ──
            const { plan, expired } = await handlePlanExpiry(user);

            if (expired) {
                return res.status(403).json({
                    success: false,
                    code: 'PLAN_EXPIRED',
                    message: 'Your plan has expired. You have been moved to the Basic plan.',
                    currentPlan: 'basic'
                });
            }

            // ── 6. Resolve limits for this plan ──
            const limits = PLAN_LIMITS[plan] || PLAN_LIMITS['basic'];
            const usageKey = getUsageKey(feature);
            const limit = limits[usageKey];

            // ── 7. If unlimited — skip counting, just proceed ──
            if (limit === Infinity) {
                req.subscriptionMeta = { userId, userEmail: user.email, plan, usageKey, unlimited: true };
                return next();
            }

            // ── 8. Fetch/create this month's usage record (keyed by userId, NOT device) ──
            const currentMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"
            let usage = await MonthlyUsage.findOne({ userId, month: currentMonth });

            if (!usage) {
                usage = await MonthlyUsage.create({ userId, month: currentMonth });
            }

            const currentCount = usage[usageKey] || 0;

            // ── 9. Enforce the limit ──
            if (currentCount >= limit) {
                return res.status(403).json({
                    success: false,
                    code: 'PLAN_LIMIT_REACHED',
                    message: `You've used all ${limit} ${feature}s on your ${plan} plan this month.`,
                    feature,
                    currentPlan: plan,
                    currentUsage: currentCount,
                    limit,
                    upgradeRequired: true
                });
            }

            // ── 10. Attach meta — usage is incremented AFTER success ──
            req.subscriptionMeta = {
                userId,
                userEmail: user.email,
                plan,
                usageKey,
                usage,        // MonthlyUsage document
                unlimited: false
            };

            next();

        } catch (error) {
            console.error(`[SUBSCRIPTION] checkSubscriptionLimit error for feature "${feature}":`, error.message);
            res.status(500).json({ success: false, message: 'Internal server error during subscription check' });
        }
    };
};

// ─────────────────────────────────────────────────────────
//  INCREMENT USAGE  (call after the feature executes OK)
//  Place at end of your controller: await incrementUsage(req)
// ─────────────────────────────────────────────────────────
export const incrementUsage = async (req) => {
    try {
        const meta = req.subscriptionMeta;
        if (!meta || meta.unlimited) return; // Unlimited plans — nothing to track

        const { usage, usageKey } = meta;
        if (!usage || !usageKey) return;

        usage[usageKey] = (usage[usageKey] || 0) + 1;
        await usage.save();

    } catch (error) {
        // Non-blocking: log but don't crash the response
        console.error('[SUBSCRIPTION] incrementUsage error:', error.message);
    }
};

// ─────────────────────────────────────────────────────────
//  EXPIRY GUARD  (standalone middleware — no feature check)
//  Use on any route that needs a valid non-expired plan
// ─────────────────────────────────────────────────────────
export const requireActivePlan = async (req, res, next) => {
    try {
        const userId = req.user?.id || req.user?._id;
        if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

        const user = await User.findById(userId).select('plan planEndDate isExpired isBlocked');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        if (user.isBlocked) return res.status(403).json({ success: false, code: 'ACCOUNT_BLOCKED', message: 'Account suspended' });

        const { plan, expired } = await handlePlanExpiry(user);
        req.userPlan = plan;
        req.planExpired = expired;

        next();
    } catch (err) {
        console.error('[SUBSCRIPTION] requireActivePlan error:', err.message);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export { handlePlanExpiry };
