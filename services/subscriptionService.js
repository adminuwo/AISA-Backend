import User from '../models/User.js';
import Subscription from '../models/Subscription.js';

const getToolCost = (toolName) => {
    switch (toolName) {
        case 'chat': return 10;       // Free plan: 100 credits = 10 chats
        case 'deep_search': return 10;
        case 'web_search': return 15;
        case 'generate_image': return 20;
        case 'generate_video': return 25;
        case 'convert_document': return 10;
        case 'convert_audio': return 10;
        case 'code_writer': return 5;
        default: return 0;
    }
};

const premiumTools = [
    'generate_video',
    'generate_image',
    'web_search',
    'deep_search',
    'convert_audio',
    'convert_document',
    'code_writer'
];

export const checkPremiumAccess = async (userId) => {
    const user = await User.findById(userId);
    if (!user) return false;

    // Founders get everything
    if (user.founderStatus) return true;

    // Check if they have an active paid subscription
    const sub = await Subscription.findOne({
        userId,
        subscriptionStatus: 'active'
    }).populate('planId');

    if (sub && sub.planId && (sub.planId.priceMonthly > 0 || sub.planId.priceYearly > 0)) {
        return true;
    }

    return false;
};

export const subscriptionService = {
    checkCredits: async (userId, toolsRequested = []) => {
        const user = await User.findById(userId);
        if (!user) throw new Error("User not found");

        const hasPremiumTool = toolsRequested.some(tool => premiumTools.includes(tool));
        if (hasPremiumTool) {
            const hasAccess = await checkPremiumAccess(userId);
            if (!hasAccess) {
                throw new Error("PREMIUM_RESTRICTED");
            }
        }

        const totalCost = toolsRequested.reduce((acc, tool) => acc + getToolCost(tool), 0);

        if ((user.credits || 0) < totalCost) {
            throw new Error("Insufficient credits");
        }
        return true;
    },

    deductCredits: async (userId, toolsUsed = [], sessionId) => {
        const user = await User.findById(userId);
        if (!user) throw new Error("User not found");

        const totalCost = toolsUsed.reduce((acc, tool) => acc + getToolCost(tool), 0);
        if (totalCost === 0) return true;

        if ((user.credits || 0) < totalCost) {
            throw new Error("Insufficient credits");
        }

        user.credits -= totalCost;
        await user.save();
        return true;
    },

    checkLimit: async () => ({ usage: 0, usageKey: 'mock' }),
    incrementUsage: () => { }
};
