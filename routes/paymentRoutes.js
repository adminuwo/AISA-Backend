import express from 'express';
import { createOrder, verifyPayment } from '../controllers/paymentController.js';
import { verifyToken } from '../middleware/authorization.js';
import Transaction from '../models/Transaction.js';

const router = express.Router();

router.post('/create-order', verifyToken, createOrder);
router.post('/verify-payment', verifyToken, verifyPayment);
router.get('/history', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const transactions = await Transaction.find({ buyerId: userId }).sort({ createdAt: -1 });
        res.status(200).json(transactions);
    } catch (error) {
        console.error("Fetch Transactions Error:", error);
        res.status(500).json({ error: "Failed to fetch transaction history" });
    }
});

export default router;
