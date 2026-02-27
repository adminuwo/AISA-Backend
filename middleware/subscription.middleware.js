import MonthlyUsage from '../models/MonthlyUsage.js';
import User from '../models/User.js';
import { PLAN_LIMITS, getUsageKey } from '../config/planLimits.js';

/**
 * Middleware to check if user has reached their subscription plan limit
 * Usage: checkLimit('image')
 */
export const checkSubscriptionLimit = (feature) => {
    return async (req, res, next) => {
        try {
            const userId = req.user.id; // Assumes auth middleware has already run
            const user = await User.findById(userId);

            if (!user) {
                return res.status(404).json({ success: false, message: "User not found" });
            }

            // 1. Check if plan is expired
            if (user.plan !== 'basic' && user.planEndDate && new Date() > user.planEndDate) {
                user.plan = 'basic';
                user.isActive = true; // Still active but basic
                await user.save();
            }

            // 2. Get/Create current month usage
            const currentMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"
            let usage = await MonthlyUsage.findOne({ userId, month: currentMonth });

            if (!usage) {
                usage = await MonthlyUsage.create({ userId, month: currentMonth });
            }

            // 3. Compare current usage with limits
            let planRaw = (user.plan || 'basic').toLowerCase();
            // Handle plan names that might be "free" instead of "basic"
            if (planRaw === 'free') planRaw = 'basic';
            
            const limits = PLAN_LIMITS[planRaw] || PLAN_LIMITS['basic'];
            const usageKey = getUsageKey(feature);
            
            const currentCount = usage[usageKey] || 0;
            const limit = limits[usageKey];

            if (limit !== Infinity && currentCount >= limit) {
                return res.status(403).json({
                    success: false,
                    code: "PLAN_LIMIT_REACHED",
                    message: `Monthly ${feature} limit exceeded for your ${planRaw} plan. Please upgrade to continue.`,
                    currentUsage: currentCount,
                    limit: limit
                });
            }

            // Attach usage object to req so we can increment it after success
            req.monthlyUsage = usage;
            req.usageKey = usageKey;
            
            next();
        } catch (error) {
            console.error("Subscription check error in feature:", feature);
            console.error("User ID:", req.user?.id || req.user?._id || "Unknown");
            console.error(error.stack || error);
            res.status(500).json({ success: false, message: "Internal server error during limit check" });
        }
    };
};

/**
 * Utility to increment usage after successful tool execution
 */
export const incrementUsage = async (usageRecord, key) => {
    try {
        if (!usageRecord || !key) return;
        usageRecord[key] += 1;
        await usageRecord.save();
    } catch (error) {
        console.error("Error incrementing usage:", error);
    }
};
