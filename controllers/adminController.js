import User from '../models/User.js';
import Subscription from '../models/Subscription.js';
import Plan from '../models/Plan.js';
import CreditPackage from '../models/CreditPackage.js';

const Payment = {
  find: async () => []
};
const CreditUsageLog = {
  find: async () => [],
  aggregate: async () => []
};

export const getAdminStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const activeSubscriptions = await Subscription.countDocuments({ status: 'active' });
        
        const payments = await Payment.find({ status: 'success' });
        const totalRevenue = payments.reduce((acc, p) => acc + p.amount, 0);

        const creditLogs = await CreditUsageLog.find();
        const totalCreditsUsed = creditLogs.reduce((acc, log) => acc + log.credits_used, 0);

        // Tool usage analytics
        const toolUsage = await CreditUsageLog.aggregate([
            { $group: { _id: "$tool_name", count: { $sum: 1 }, totalCredits: { $sum: "$credits_used" } } },
            { $sort: { count: -1 } }
        ]);

        res.status(200).json({
            success: true,
            stats: {
                totalUsers,
                activeSubscriptions,
                totalRevenue,
                totalCreditsUsed,
                toolUsage
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const searchUserByEmail = async (req, res) => {
    try {
        const { email } = req.query;
        const user = await User.findOne({ email }).select('name email');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const subscription = await Subscription.findOne({ user_id: user._id });
        
        res.status(200).json({
            success: true,
            user,
            subscription
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const adjustCredits = async (req, res) => {
    try {
        const { userId, credits } = req.body;
        const subscription = await Subscription.findOneAndUpdate(
            { user_id: userId },
            { $set: { remaining_credits: credits } },
            { new: true }
        );

        res.status(200).json({
            success: true,
            message: 'Credits adjusted successfully.',
            subscription
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const manualPlanUpgrade = async (req, res) => {
    try {
        const { userId, planName, expiryDate } = req.body;
        const subscription = await Subscription.findOneAndUpdate(
            { user_id: userId },
            { 
                plan_name: planName, 
                expiry_date: expiryDate ? new Date(expiryDate) : undefined,
                status: 'active'
            },
            { new: true, upsert: true }
        );

        res.status(200).json({
            success: true,
            message: 'Plan updated successfully.',
            subscription
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createPlan = async (req, res) => {
    try {
        const plan = await Plan.create(req.body);
        res.status(201).json({ success: true, plan });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updatePlan = async (req, res) => {
    try {
        const { planId } = req.params;
        const plan = await Plan.findByIdAndUpdate(planId, req.body, { new: true });
        if (!plan) return res.status(404).json({ success: false, message: "Plan not found" });
        res.status(200).json({ success: true, plan });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deletePlan = async (req, res) => {
    try {
        const { planId } = req.params;
        await Plan.findByIdAndDelete(planId);
        res.status(200).json({ success: true, message: "Plan deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createCreditPackage = async (req, res) => {
    try {
        const packageData = await CreditPackage.create(req.body);
        res.status(201).json({ success: true, packageData });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateCreditPackage = async (req, res) => {
    try {
        const { packageId } = req.params;
        const packageData = await CreditPackage.findByIdAndUpdate(packageId, req.body, { new: true });
        if (!packageData) return res.status(404).json({ success: false, message: "Package not found" });
        res.status(200).json({ success: true, packageData });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteCreditPackage = async (req, res) => {
    try {
        const { packageId } = req.params;
        await CreditPackage.findByIdAndDelete(packageId);
        res.status(200).json({ success: true, message: "Package deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
