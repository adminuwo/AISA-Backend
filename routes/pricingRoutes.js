import express from 'express';
import { getPlans, getCreditPackages, getFounderCount } from '../controllers/pricingController.js';

const router = express.Router();

router.get('/plans', getPlans);
router.get('/packages', getCreditPackages);
router.get('/founder-count', getFounderCount);

export default router;
