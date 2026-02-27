import express from 'express';
import { generateVideo, getVideoStatus, downloadVideo } from '../controllers/videoController.js';
import { verifyToken } from '../middleware/authorization.js';

import { checkSubscriptionLimit } from '../middleware/subscription.middleware.js';
const router = express.Router();

// Generate video from text prompt
router.post('/generate', verifyToken, checkSubscriptionLimit('video'), generateVideo);

// Get video generation status
router.get('/status/:videoId', verifyToken, getVideoStatus);

// Download video
router.post('/download', verifyToken, downloadVideo);

export default router;
