import express from "express";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import UserModel from "../models/User.js";
import generateTokenAndSetCookies from "../utils/generateTokenAndSetCookies.js";
import { generateOTP } from "../utils/verifiacitonCode.js";
import { sendVerificationEmail, sendResetPasswordEmail, sendPasswordChangeSuccessEmail, sendResetPasswordOTP } from "../utils/Email.js";
import crypto from "crypto";
import fs from "fs";
import path from "path";

const router = express.Router();

// Test routes
router.get("/", (req, res) => {
  res.send("This is the auth");
});

router.get("/signup", (req, res) => {
  res.send("this is signup");
});

// ====================== SIGNUP =======================
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // DB Down Fallback for Signup
    if (mongoose.connection.readyState !== 1) {
      console.log("[DB] MongoDB unreachable during signup. Granting temporary access.");
      const demoId = new mongoose.Types.ObjectId().toString();
      const token = generateTokenAndSetCookies(res, demoId, email, name);
      return res.status(201).json({
        id: demoId,
        name: name || "Demo User",
        email: email,
        message: "Demo Mode: Verification bypassed due to DB status",
        token: token,
      });
    }

    // Check user exists
    const existingUser = await UserModel.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ error: "User Already Exists With This Email" });
    }

    // Password Validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        error: "Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character."
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const verificationCode = generateOTP();

    // Create user
    const newUser = await UserModel.create({
      name,
      email,
      password: hashedPassword,
      verificationCode,
      notificationsInbox: [
        {
          id: `welcome_${Date.now()}_1`,
          title: 'Welcome to AISA!',
          desc: 'Start your journey with your Artificial Intelligence Super Assistant. Need help? Ask us anything!',
          type: 'promo',
          time: new Date()
        },
        {
          id: `welcome_${Date.now()}_2`,
          title: 'AISA v2.4.0 is here!',
          desc: 'New features: Dynamic Accent Colors and improved Voice Synthesis are now live. Check them out in General settings.',
          type: 'update',
          time: new Date(Date.now() - 7200000)
        },
        {
          id: `welcome_${Date.now()}_3`,
          title: 'Plan Expiring Soon',
          desc: 'Your "Pro" plan will end in 3 days. Renew now to keep enjoying unlimited AI access.',
          type: 'alert',
          time: new Date(Date.now() - 3600000)
        },
      ]
    });

    // Generate token cookie
    const token = generateTokenAndSetCookies(res, newUser._id, newUser.email, newUser.name);


    // Send OTP email
    await sendVerificationEmail(newUser.email, newUser.name, newUser.verificationCode);

    res.status(201).json({
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      message: "Verification code sent successfully",
      token: token,
    });
  } catch (err) {
    console.error("Signup Error:", err);
    res.status(500).json({ error: "Server error during signup" });
  }
});

// ====================== LOGIN =======================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // DB Down Fallback for Login
    if (mongoose.connection.readyState !== 1) {
      console.log("[DB] MongoDB unreachable during login. Granting temporary access.");
      const demoId = new mongoose.Types.ObjectId().toString();
      const token = generateTokenAndSetCookies(res, demoId, email, "Demo User");
      return res.status(201).json({
        id: demoId,
        name: "Demo User",
        email: email,
        message: "LogIn Successfully (Demo Mode)",
        token: token,
        role: "user"
      });
    }

    // Find user
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Account not found with this email" });
    }

    // Compare hashed password
    const isCorrect = await bcrypt.compare(password, user.password);
    if (!isCorrect) {
      return res.status(401).json({ error: "Incorrect password" });
    }

    // Generate token
    const token = generateTokenAndSetCookies(res, user._id, user.email, user.name);

    // Add welcome notifications if inbox is empty
    if (!user.notificationsInbox || user.notificationsInbox.length === 0) {
      user.notificationsInbox = [
        {
          id: `welcome_${Date.now()}_1`,
          title: 'Welcome to AISA!',
          desc: 'Start your journey with your Artificial Intelligence Super Assistant. Need help? Ask us anything!',
          type: 'promo',
          time: new Date()
        },
        {
          id: `welcome_${Date.now()}_2`,
          title: 'AISA v2.4.0 is here!',
          desc: 'New features: Dynamic Accent Colors and improved Voice Synthesis are now live. Check them out in General settings.',
          type: 'update',
          time: new Date(Date.now() - 7200000)
        },
        {
          id: `welcome_${Date.now()}_3`,
          title: 'Plan Expiring Soon',
          desc: 'Your "Pro" plan will end in 3 days. Renew now to keep enjoying unlimited AI access.',
          type: 'alert',
          time: new Date(Date.now() - 3600000)
        },
      ];
    }

    // Add "New Login" notification
    user.notificationsInbox.unshift({
      id: `login_${Date.now()}`,
      title: 'New Login Detected',
      desc: `Successfully logged in at ${new Date().toLocaleTimeString()}`,
      type: 'alert', // efficient check icon
      time: new Date(),
      isRead: false
    });

    // Limit inbox size
    if (user.notificationsInbox.length > 50) {
      user.notificationsInbox = user.notificationsInbox.slice(0, 50);
    }

    await user.save();

    res.status(201).json({
      id: user._id,
      name: user.name,
      email: user.email,
      message: "LogIn Successfully",
      token: token,
      role: user.role,
      notifications: user.notificationsInbox
    });

  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ error: "Server error during login" });
  }
});


// ====================== FORGOT PASSWORD (OTP) =======================
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    // DB Down Fallback
    if (mongoose.connection.readyState !== 1) {
      const logMsg = `[${new Date().toISOString()}] [DB DOWN] Attempting OTP send anyway for ${email}\n`;
      fs.appendFileSync("auth_debug.log", logMsg);
      console.log("[DB] MongoDB unreachable. Attempting to send OTP anyway for demo purposes.");

      // We skip DB saving, but we can still try to send the email
      try {
        const otpCode = generateOTP();
        await sendResetPasswordOTP(email, "User", otpCode);
        return res.status(200).json({ message: `OTP Sent Successfully (Demo Mode - OTP is ${otpCode})` });
      } catch (err) {
        return res.status(200).json({ message: "DB Down & Email Failed" });
      }
    }

    const user = await UserModel.findOne({ email });

    if (!user) {
      fs.appendFileSync("auth_debug.log", `[${new Date().toISOString()}] User not found: ${email}\n`);
      return res.status(404).json({ error: "User not found with this email" });
    }

    // Generate 6-digit OTP
    const otpCode = generateOTP();

    // Store OTP (as is for simple verification)
    user.resetPasswordToken = otpCode;
    // Set expire time (15 minutes)
    user.resetPasswordExpires = Date.now() + 900000;

    await user.save();

    fs.appendFileSync("auth_debug.log", `[${new Date().toISOString()}] Sending OTP ${otpCode} to ${email}\n`);

    try {
      await sendResetPasswordOTP(user.email, user.name, otpCode);
      res.status(200).json({ message: "OTP Sent Successfully to your email. Check your inbox." });
    } catch (err) {
      fs.appendFileSync("auth_debug.log", `[${new Date().toISOString()}] Email Error: ${err.message}\n`);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      console.error("Email Error:", err);
      res.status(500).json({ error: "Email could not be sent" });
    }
  } catch (err) {
    console.error("Forgot Password Error:", err);
    res.status(500).json({ error: "Server error during forgot password" });
  }
});

// ====================== RESET PASSWORD WITH OTP =======================
router.post("/reset-password-otp", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    fs.appendFileSync("auth_debug.log", `[${new Date().toISOString()}] Reset attempt: ${email}, OTP: ${otp}\n`);

    // DB Down Fallback
    if (mongoose.connection.readyState !== 1) {
      fs.appendFileSync("auth_debug.log", `[${new Date().toISOString()}] Reset Demo Success: ${email}\n`);
      console.log("[DB] MongoDB unreachable. Simulating password reset for demo mode.");
      return res.status(200).json({ message: "Password updated successfully (Demo Mode)" });
    }

    const user = await UserModel.findOne({
      email,
      resetPasswordToken: otp,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      fs.appendFileSync("auth_debug.log", `[${new Date().toISOString()}] Reset Failed: Invalid/Expired OTP for ${email}\n`);
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    // Clear reset token fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();
    fs.appendFileSync("auth_debug.log", `[${new Date().toISOString()}] Reset Success: ${email}\n`);

    await sendPasswordChangeSuccessEmail(user.email, user.name);

    res.status(200).json({ message: "Password updated successfully" });
  } catch (err) {
    fs.appendFileSync("auth_debug.log", `[${new Date().toISOString()}] Reset Crash: ${err.message}\n`);
    console.error("Reset Password Error:", err);
    res.status(500).json({ error: "Server error during password reset" });
  }
});

// ====================== CHANGE PASSWORD (LOGGED IN) =======================
router.post("/reset-password-email", async (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body;

    // DB Down Fallback
    if (mongoose.connection.readyState !== 1) {
      console.log("[DB] MongoDB unreachable. Simulating password change success for demo mode.");
      return res.status(200).json({ message: "Password updated successfully (Demo Mode)" });
    }

    // Find user
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verify current password
    const isCorrect = await bcrypt.compare(currentPassword, user.password);
    if (!isCorrect) {
      return res.status(401).json({ error: "Incorrect current password" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    await user.save();

    // Send notification email
    await sendPasswordChangeSuccessEmail(user.email, user.name);

    res.status(200).json({ message: "Password updated successfully" });

  } catch (err) {
    console.error("Change Password Error:", err);
    res.status(500).json({ error: "Server error during password update" });
  }
});

// ====================== RESET PASSWORD =======================
router.post("/reset-password/:token", async (req, res) => {
  try {
    const { password, confirmPassword } = req.body;
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await UserModel.findOne({
      resetPasswordToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    // Check if passwords match (optional, can be done in frontend too but good to verify)
    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" });
    }


    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // Clear reset token fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.status(200).json({ message: "Password Updated Successfully" });

  } catch (err) {
    console.error("Reset Password Error:", err);
    res.status(500).json({ error: "Server error during reset password" });
  }
});

// ====================== RESEND VERIFICATION CODE =======================
router.post("/resend-code", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "User is already verified" });
    }

    const verificationCode = generateOTP();
    user.verificationCode = verificationCode;
    await user.save();

    await sendVerificationEmail(user.email, user.name, verificationCode);

    res.status(200).json({ message: "Verification code resent successfully" });

  } catch (err) {
    console.error("Resend Code Error:", err);
    res.status(500).json({ error: "Server error during resend code" });
  }
});

export default router;
