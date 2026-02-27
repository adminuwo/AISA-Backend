import express from 'express';
import { synthesizeSpeech, synthesizeFile } from '../controllers/voiceController.js';
import { verifyToken } from '../middleware/authorization.js';
import { checkSubscriptionLimit } from '../middleware/subscription.middleware.js';

const router = express.Router();

router.post('/synthesize', verifyToken, checkSubscriptionLimit('audio'), synthesizeSpeech);
router.post('/synthesize-file', verifyToken, checkSubscriptionLimit('audio'), synthesizeFile);

export default router;
