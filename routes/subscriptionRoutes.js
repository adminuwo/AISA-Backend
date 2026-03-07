import express from 'express';
import { getSubscriptionDetails, purchasePlan, purchaseCredits, createOrder } from '../controllers/subscriptionController.js';
import { verifyToken } from '../middleware/authorization.js'; 

const router = express.Router();

router.get('/', verifyToken, getSubscriptionDetails);
router.post('/create-order', verifyToken, createOrder);
router.post('/purchase', verifyToken, purchasePlan);
router.post('/buy-credits', verifyToken, purchaseCredits);

export default router;
