import MonthlyUsage from '../models/MonthlyUsage.js';
import User from '../models/User.js';
import { PLAN_LIMITS, getUsageKey } from '../config/planLimits.js';

class SubscriptionService {
    /**
     * Check if a user can use a feature and returns the usage record
     */
    async checkLimit(userId, feature) {
        const user = await User.findById(userId);
        if (!user) throw new Error("User not found");

        // 1. Plan Expiry Check
        if (user.plan !== 'basic' && user.planEndDate && new Date() > user.planEndDate) {
            user.plan = 'basic';
            user.isActive = true;
            await user.save();
        }

        const currentMonth = new Date().toISOString().slice(0, 7);
        let usage = await MonthlyUsage.findOne({ userId, month: currentMonth });
        if (!usage) {
            usage = await MonthlyUsage.create({ userId, month: currentMonth });
        }

        const plan = (user.plan || 'basic').toLowerCase();
        const limits = PLAN_LIMITS[plan] || PLAN_LIMITS['basic'];
        const usageKey = getUsageKey(feature);
        
        const currentCount = usage[usageKey] || 0;
        const limit = limits[usageKey];

        if (limit !== Infinity && currentCount >= limit) {
            const error = new Error("Monthly limit reached");
            error.code = "PLAN_LIMIT_REACHED";
            error.status = 403;
            error.plan = plan;
            error.feature = feature;
            error.limit = limit;
            throw error;
        }

        return { usage, usageKey, plan, limits };
    }

    /**
     * Increment usage after successful execution
     */
    async incrementUsage(usageRecord, key) {
        if (!usageRecord || !key) return;
        usageRecord[key] += 1;
        await usageRecord.save();
    }

    /**
     * Get user usage and plan info for dashboard
     */
    async getUsageStatus(userId) {
        const user = await User.findById(userId).select('plan planStartDate planEndDate isActive');
        if (!user) throw new Error("User not found");

        const currentMonth = new Date().toISOString().slice(0, 7);
        let usage = await MonthlyUsage.findOne({ userId, month: currentMonth });
        if (!usage) {
            usage = await MonthlyUsage.create({ userId, month: currentMonth });
        }

        const plan = (user.plan || 'basic').toLowerCase();
        const planLimits = PLAN_LIMITS[plan] || PLAN_LIMITS['basic'];

        return {
            plan: user.plan,
            planStartDate: user.planStartDate,
            planEndDate: user.planEndDate,
            isActive: user.isActive,
            usage,
            planLimits
        };
    }
}

export default new SubscriptionService();
