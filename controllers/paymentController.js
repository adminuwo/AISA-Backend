import Razorpay from 'razorpay';
import crypto from 'crypto';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import dotenv from 'dotenv';

dotenv.config();

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const createOrder = async (req, res) => {
    try {
        const { plan, amount } = req.body;
        const userId = req.user.id;

        if (!plan || !amount) {
            return res.status(400).json({ error: "Plan and amount are required" });
        }

        const options = {
            amount: amount * 100, // razorpay expects amount in paise
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
            notes: {
                userId,
                plan
            }
        };

        const order = await razorpay.orders.create(options);
        res.status(200).json({ ...order, keyId: process.env.RAZORPAY_KEY_ID });
    } catch (error) {
        console.error("Razorpay Order Error:", error);
        res.status(500).json({ error: "Failed to create payment order" });
    }
};

export const verifyPayment = async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            plan,
            amount
        } = req.body;

        const userId = req.user.id;

        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(sign.toString())
            .digest("hex");

        if (razorpay_signature === expectedSign) {
            // Update User Plan
            const updatedUser = await User.findByIdAndUpdate(
                userId,
                {
                    plan: plan,
                    subscription: {
                        razorpay_payment_id,
                        razorpay_order_id,
                        razorpay_signature,
                        status: 'active',
                        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
                    }
                },
                { new: true }
            );

            // Create Transaction Record
            await Transaction.create({
                buyerId: userId,
                transactionId: razorpay_payment_id,
                amount,
                plan,
                paymentId: razorpay_payment_id,
                orderId: razorpay_order_id,
                status: 'success'
            });

            res.status(200).json({
                message: "Payment verified successfully",
                user: updatedUser
            });
        } else {
            res.status(400).json({ error: "Invalid signature" });
        }
    } catch (error) {
        console.error("Payment Verification Error:", error);
        res.status(500).json({ error: "Failed to verify payment" });
    }
};
