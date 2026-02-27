import express from 'express';
import { verifyToken } from '../middleware/authorization.js';
import { checkSubscriptionLimit } from '../middleware/subscription.middleware.js';
import { generateImage, editImage } from '../controllers/image.controller.js';

const router = express.Router();

router.post('/generate', verifyToken, checkSubscriptionLimit('image'), generateImage);
router.post('/edit', verifyToken, checkSubscriptionLimit('image'), editImage);

export default router;
