import express from 'express';
import { synthesizeSpeech, synthesizeFile } from '../controllers/voiceController.js';
import { verifyToken } from '../middleware/authorization.js';
import { checkPremiumAccess } from '../services/subscriptionService.js';

const router = express.Router();

// Middleware to guard voice routes for premium users only
const requirePremium = async (req, res, next) => {
    try {
        const hasAccess = await checkPremiumAccess(req.user?.id || req.user?._id);
        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                code: 'PREMIUM_ONLY',
                message: 'Convert to Audio is not available on the free plan. Please upgrade to access this feature.'
            });
        }
        next();
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Authorization check failed.' });
    }
};

router.post('/synthesize', verifyToken, requirePremium, synthesizeSpeech);
router.post('/synthesize-file', verifyToken, requirePremium, synthesizeFile);

export default router;
