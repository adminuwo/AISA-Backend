/**
 * ════════════════════════════════════════════════════════
 *  SUBSCRIPTION ROUTES
 *  GET /api/subscription/status   → user's plan + usage
 *  GET /api/subscription/limits   → plan limits table
 * ════════════════════════════════════════════════════════
 */

import express from 'express';
import { verifyToken } from '../middleware/authorization.js';
import { requireActivePlan, handlePlanExpiry } from '../middleware/subscription.middleware.js';
import { PLAN_LIMITS, normalisePlan } from '../config/planLimits.js';
import User from '../models/User.js';
import MonthlyUsage from '../models/MonthlyUsage.js';

const router = express.Router();

// ─────────────────────────────────────────────────────────
//  GET /api/subscription/status
//  Returns the authenticated user's plan + live usage data
//  All data is fetched server-side from DB — frontend cannot
//  manipulate these values.
// ─────────────────────────────────────────────────────────
router.get('/status', verifyToken, async (req, res) => {
    try {
        const userId = req.user?.id || req.user?._id;
        const jwtEmail = req.user?.email;

        // 1. Fetch fresh user record
        const user = await User.findById(userId).select(
            'email name plan planStartDate planEndDate isExpired planExpiredAt isBlocked'
        );

        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        // 2. Security: verify token email matches DB email
        if (user.email.toLowerCase() !== jwtEmail.toLowerCase()) {
            return res.status(403).json({ success: false, code: 'TOKEN_EMAIL_MISMATCH' });
        }

        if (user.isBlocked) {
            return res.status(403).json({ success: false, code: 'ACCOUNT_BLOCKED', message: 'Account suspended' });
        }

        // 3. Handle expiry (auto-downgrade if needed)
        const { plan, expired } = await handlePlanExpiry(user);

        // 4. Fetch this month's usage
        const currentMonth = new Date().toISOString().slice(0, 7);
        const usage = await MonthlyUsage.findOne({ userId, month: currentMonth }) || {};

        // 5. Build response with limits comparison
        const limits = PLAN_LIMITS[plan] || PLAN_LIMITS['basic'];

        const features = {
            image: { used: usage.imageCount || 0, limit: limits.imageCount, unlimited: limits.imageCount === Infinity },
            video: { used: usage.videoCount || 0, limit: limits.videoCount, unlimited: limits.videoCount === Infinity },
            deepSearch: { used: usage.deepSearchCount || 0, limit: limits.deepSearchCount, unlimited: limits.deepSearchCount === Infinity },
            audio: { used: usage.audioConvertCount || 0, limit: limits.audioConvertCount, unlimited: limits.audioConvertCount === Infinity },
            document: { used: usage.documentConvertCount || 0, limit: limits.documentConvertCount, unlimited: limits.documentConvertCount === Infinity },
            codeWriter: { used: usage.codeWriterCount || 0, limit: limits.codeWriterCount, unlimited: limits.codeWriterCount === Infinity },
            chat: { used: usage.chatCount || 0, limit: limits.chatCount, unlimited: limits.chatCount === Infinity }
        };

        return res.status(200).json({
            success: true,
            email: user.email,
            name: user.name,
            plan,
            planExpired: expired,
            planStartDate: user.planStartDate,
            planEndDate: user.planEndDate,
            month: currentMonth,
            features
        });

    } catch (err) {
        console.error('[SUBSCRIPTION] /status error:', err.message);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// ─────────────────────────────────────────────────────────
//  GET /api/subscription/limits
//  Returns the public plan limits table (no auth needed)
// ─────────────────────────────────────────────────────────
router.get('/limits', (req, res) => {
    // Replace Infinity with the string "unlimited" for JSON serialisability
    const sanitise = (limits) => {
        const out = {};
        for (const [k, v] of Object.entries(limits)) {
            out[k] = v === Infinity ? 'unlimited' : v;
        }
        return out;
    };

    res.status(200).json({
        success: true,
        plans: {
            basic: sanitise(PLAN_LIMITS.basic),
            pro: sanitise(PLAN_LIMITS.pro),
            king: sanitise(PLAN_LIMITS.king)
        }
    });
});

export default router;
