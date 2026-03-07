import mongoose from 'mongoose';
import dotenv from 'dotenv';
import 'dotenv/config';
import Plan from '../models/Plan.js';
import CreditPackage from '../models/CreditPackage.js';

dotenv.config();

const plans = [
    {
        planId: "FREE",
        planName: "FREE",
        priceMonthly: 0,
        priceYearly: 0,
        credits: 100,
        features: ["AI Chat", "Image Generation"],
        badge: "",
        isPopular: false,
        isActive: true
    },
    {
        planId: "STARTER",
        planName: "STARTER",
        priceMonthly: 499,
        priceYearly: 349,
        credits: 600,
        features: ["AI Chat", "Image Generation", "Real-Time Web Search"],
        badge: "",
        isPopular: false,
        isActive: true
    },
    {
        planId: "PRO",
        planName: "PRO",
        priceMonthly: 999,
        priceYearly: 699,
        credits: 1600,
        features: ["AI Chat", "Image Generation", "Video Generation", "Real-Time Web Search"],
        badge: "⭐ Most Popular – Best Value",
        isPopular: true,
        isActive: true
    },
    {
        planId: "BUSINESS",
        planName: "BUSINESS",
        priceMonthly: 2499,
        priceYearly: 1749, // Assumed (~30% less than 2499 is 1749)
        credits: 4000,
        features: ["AI Chat", "Image Generation", "Video Generation", "Real-Time Web Search", "Team Workspace"],
        badge: "",
        isPopular: false,
        isActive: true
    },
    {
        planId: "FOUNDER",
        planName: "Founder Plan",
        priceMonthly: 699,
        priceYearly: 699, // lifetime locked
        credits: 1600,
        features: ["AI Chat", "Image Generation", "Video Generation", "Real-Time Web Search", "Lifetime locked price"],
        badge: "🚀 Launch Offer",
        isPopular: false,
        isActive: true
    }
];

const packages = [
    {
        packageId: "EXTRA_200",
        packageName: "200 credits",
        price: 99,
        credits: 200,
        isActive: true
    },
    {
        packageId: "EXTRA_500",
        packageName: "500 credits",
        price: 199,
        credits: 500,
        isActive: true
    },
    {
        packageId: "EXTRA_1000",
        packageName: "1000 credits",
        price: 349,
        credits: 1000,
        isActive: true
    }
];

import connectDB from '../config/db.js';

const seed = async () => {
    try {
        await connectDB();
        console.log("Connected to DB");
        
        await Plan.deleteMany({});
        await CreditPackage.deleteMany({});
        
        await Plan.insertMany(plans);
        await CreditPackage.insertMany(packages);
        
        console.log("Seed successful");
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seed();
