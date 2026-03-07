import User from '../models/User.js';
import { verifyToken } from './authorization.js';
import { checkPremiumAccess } from '../services/subscriptionService.js';

export const creditMiddleware = async (req, res, next) => {
    // Need user
    if (!req.user) {
        return res.status(401).json({ error: "Unauthorized access" });
    }

    // Determine cost based on URL (simple matching)
    let cost = 0;
    const url = req.originalUrl || req.url;
    let isPremiumEndpoint = false;

    if (url.includes('/api/chat/realtime')) { cost = 15; isPremiumEndpoint = true; }
    else if (url.includes('/api/aibase/chat') || url.includes('/api/aibase/knowledge')) { cost = 10; isPremiumEndpoint = true; }
    else if (url.includes('/api/video')) { cost = 25; isPremiumEndpoint = true; }
    else if (url.includes('/api/image')) { cost = 20; isPremiumEndpoint = true; }
    else if (url.includes('/api/chat')) cost = 0; // Normal chat is FREE

    // Fast pass if no cost
    if (cost === 0) return next();

    try {
        if (isPremiumEndpoint) {
            const hasAccess = await checkPremiumAccess(req.user.id || req.user._id);
            if (!hasAccess) {
                return res.status(403).json({
                    success: false,
                    code: "PREMIUM_ONLY",
                    error: "This feature is not available in the free plan. Please upgrade your plan to access premium magic tools.",
                    message: "This feature is not available in the free plan. Please upgrade your plan to access premium magic tools."
                });
            }
        }

        const user = await User.findById(req.user.id || req.user._id);
        if (!user) return res.status(404).json({ error: "User not found" });

        // Admin override or bypass? Could add here.

        if (user.credits < cost) {
            return res.status(403).json({
                error: "Insufficient credits",
                code: "OUT_OF_CREDITS",
                required: cost,
                available: user.credits
            });
        }

        user.credits -= cost;
        await user.save();

        // Pass updated credits to req
        req.user.credits = user.credits;

        next();
    } catch (error) {
        console.error("Credit deduction failed:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
