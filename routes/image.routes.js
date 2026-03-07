import express from 'express';
import { verifyToken } from '../middleware/authorization.js';
import { creditMiddleware } from '../middleware/creditSystem.js';
import { generateImage, editImage } from '../controllers/image.controller.js';

const router = express.Router();

router.post('/generate', verifyToken, creditMiddleware, generateImage);
router.post('/edit', verifyToken, creditMiddleware, editImage);

export default router;
