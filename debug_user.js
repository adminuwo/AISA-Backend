
import mongoose from 'mongoose';
import User from './models/User.js';
import 'dotenv/config';

async function checkUser() {
    try {
        await mongoose.connect(process.env.MONGODB_ATLAS_URI);
        console.log("DB Connected");

        const allUsers = await User.find().select('email name plan').sort({ createdAt: -1 });
        console.log("All users in DB:");
        allUsers.forEach(u => console.log(`- ${u.email} (${u.name}) Plan: ${u.plan}`));

        process.exit(0);
    } catch (err) {
        console.error("DEBUG SCRIPT FAILED:", err);
        process.exit(1);
    }
}

checkUser();
