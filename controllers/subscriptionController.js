import Subscription from '../models/Subscription.js';
import Plan from '../models/Plan.js';
import CreditPackage from '../models/CreditPackage.js';
import User from '../models/User.js';
import Razorpay from 'razorpay';
import crypto from 'crypto';

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret'
});

export const getSubscriptionDetails = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id; // assumes protectAuth middleware sets req.user
        const subscription = await Subscription.findOne({ userId, subscriptionStatus: 'active' }).populate('planId');
        const user = await User.findById(userId).select('credits founderStatus');

        res.status(200).json({
            success: true,
            subscription,
            credits: user?.credits || 0,
            founderStatus: user?.founderStatus || false
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createOrder = async (req, res) => {
    try {
        const { planId, packageId, billingCycle } = req.body;
        let amount = 0;

        if (planId) {
            const plan = await Plan.findById(planId);
            if (!plan) return res.status(404).json({ success: false, message: "Plan not found" });
            amount = billingCycle === 'yearly' ? plan.priceYearly : plan.priceMonthly;
        } else if (packageId) {
            const creditPackage = await CreditPackage.findById(packageId);
            if (!creditPackage) return res.status(404).json({ success: false, message: "Package not found" });
            amount = creditPackage.price;
        } else {
            return res.status(400).json({ success: false, message: "Invalid request" });
        }

        if (amount === 0) {
            return res.status(200).json({ success: true, isFree: true });
        }

        const options = {
            amount: amount * 100, // INR in paise
            currency: "INR",
            receipt: `order_rcptid_${Date.now()}`
        };

        const order = await razorpay.orders.create(options);
        res.status(200).json({ 
            success: true, 
            order, 
            key: process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const purchasePlan = async (req, res) => {
    try {
        const { planId, billingCycle } = req.body;
        const userId = req.user.id || req.user._id;

        const plan = await Plan.findById(planId);
        if (!plan) return res.status(404).json({ success: false, message: "Plan not found" });

        const user = await User.findById(userId);

        if (plan.planName === 'Founder Plan') {
            const founderCount = await User.countDocuments({ founderStatus: true });
            if (founderCount >= 500 && !user.founderStatus) {
                return res.status(400).json({ success: false, message: "Founder plan limit reached." });
            }
            user.founderStatus = true;
        }

        // Deactivate old active subscriptions
        await Subscription.updateMany({ userId, subscriptionStatus: 'active' }, { subscriptionStatus: 'cancelled' });

        // Calculate credits adding existing remaining? Or replacing.
        // SaaS usually replaces monthly credits or keeps rollover. For now, replace.
        const addCredits = plan.planName === 'Founder Plan' ? plan.credits : plan.credits; // if launch offer, maybe give 50% extra?
        // Wait, "Launch Offer: Get 50% extra credits on first purchase"
        const isFirstPurchase = await Subscription.countDocuments({ userId }) === 0;
        let finalCredits = addCredits;
        if (isFirstPurchase && plan.planName !== 'Founder Plan') {
            finalCredits += finalCredits * 0.5;
        }

        // Just add to user's remaining credits or replace? "Credits must automatically deduct"
        // Usually, monthly plan resets credits or adds to balance. Let's Set to plan Credits + existing.
        user.credits = finalCredits; 
        
        const newSubscription = await Subscription.create({
            userId,
            planId: plan._id,
            creditsRemaining: finalCredits,
            billingCycle,
            subscriptionStart: new Date(),
            renewalDate: new Date(new Date().setMonth(new Date().getMonth() + (billingCycle === 'yearly' ? 12 : 1))),
            subscriptionStatus: 'active',
            paymentId: "mock_payment_id_for_now"
        });

        await user.save();

        res.status(200).json({
            success: true,
            subscription: newSubscription,
            credits: user.credits,
            message: "Plan upgraded successfully."
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const purchaseCredits = async (req, res) => {
    try {
        const { packageId } = req.body;
        const userId = req.user.id || req.user._id;

        const creditPackage = await CreditPackage.findById(packageId);
        if (!creditPackage) return res.status(404).json({ success: false, message: "Package not found" });

        const user = await User.findById(userId);
        user.credits += creditPackage.credits;
        await user.save();

        res.status(200).json({
            success: true,
            credits: user.credits,
            message: "Credits purchased successfully."
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
