import express from 'express';
import { generateVideo, getVideoStatus, downloadVideo } from '../controllers/videoController.js';
import { verifyToken } from '../middleware/authorization.js';

import { creditMiddleware } from '../middleware/creditSystem.js';
const router = express.Router();

// Generate video from text prompt
router.post('/generate', verifyToken, creditMiddleware, generateVideo);

// Get video generation status
router.get('/status/:videoId', verifyToken, getVideoStatus);

// Download video
router.post('/download', verifyToken, downloadVideo);

export default router;
