
import mongoose from 'mongoose';
import User from './models/User.js';
import Transaction from './models/Transaction.js';
import 'dotenv/config';

async function checkTransactions() {
    try {
        await mongoose.connect(process.env.MONGODB_ATLAS_URI);
        console.log("DB Connected");

        const transactions = await Transaction.find({ amount: { $gt: 2000 } }).sort({ createdAt: -1 });
        console.log("High value transactions:");
        for (const tx of transactions) {
            const user = await User.findById(tx.buyerId);
            console.log(`- Amt: ${tx.amount} User: ${user?.email} Plan: ${tx.plan} Date: ${tx.createdAt}`);
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkTransactions();
