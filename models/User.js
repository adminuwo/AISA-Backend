import mongoose from 'mongoose';


const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    avatar: {
        type: String,
        default: '/User.jpeg'
    },
    agents: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Agent"
    }],
    role: {
        type: String,
        default: "user"
    },
    chatSessions: [{ type: mongoose.Schema.Types.ObjectId, ref: "ChatSession" }],
    verificationCode: Number,
    isBlocked: {
        type: Boolean,
        default: false
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    settings: {
        emailNotif: { type: Boolean, default: true },
        pushNotif: { type: Boolean, default: false },
        publicProfile: { type: Boolean, default: true },
        twoFactor: { type: Boolean, default: false }
    },
    personalizations: {
        // General Settings
        general: {
            language: { type: String, default: 'English' },
            theme: { type: String, enum: ['Light', 'Dark', 'System'], default: 'System' },
            fontSize: { type: String, enum: ['Small', 'Medium', 'Large'], default: 'Medium' },
            responseSpeed: { type: String, enum: ['Fast', 'Balanced', 'Detailed'], default: 'Balanced' },
            accessibility: {
                screenReader: { type: Boolean, default: false },
                highContrast: { type: Boolean, default: false }
            }
        },

        // Notifications
        notifications: {
            newMessage: { type: Boolean, default: true },
            aiTips: { type: Boolean, default: true },
            productUpdates: { type: Boolean, default: true },
            emailNotifications: { type: String, default: '' },
            soundAlerts: { type: Boolean, default: true }
        },

        // Personalization (Core Feature)
        personalization: {
            baseStyle: {
                type: String,
                enum: ['Default', 'Professional', 'Friendly', 'Casual', 'Technical', 'Mentor-like'],
                default: 'Default'
            },
            characteristics: {
                warmth: { type: Number, min: 1, max: 3, default: 2 }, // 1=Low, 2=Medium, 3=High
                enthusiasm: { type: Number, min: 1, max: 3, default: 2 },
                formality: { type: Number, min: 1, max: 3, default: 2 },
                creativity: { type: Number, min: 1, max: 3, default: 2 },
                directness: { type: Number, min: 1, max: 3, default: 2 }
            },
            headers: {
                structuredResponses: { type: Boolean, default: true },
                bulletPoints: { type: Boolean, default: true },
                stepByStep: { type: Boolean, default: true }
            },
            emojiUsage: {
                type: String,
                enum: ['None', 'Minimal', 'Moderate', 'Expressive'],
                default: 'Minimal'
            },
            customInstructions: { type: String, default: '', maxlength: 1500 }
        },

        // Apps & Integrations
        apps: [{
            name: String,
            enabled: { type: Boolean, default: true },
            permissions: { type: String, enum: ['Read', 'Write', 'ReadWrite'], default: 'Read' },
            connectedAt: { type: Date, default: Date.now }
        }],

        // Data Controls
        dataControls: {
            chatHistory: { type: String, enum: ['On', 'Auto-delete', 'Off'], default: 'On' },
            trainingDataUsage: { type: Boolean, default: true },
            autoDeleteDays: { type: Number, default: 30 }
        },

        // Parental Controls
        parentalControls: {
            enabled: { type: Boolean, default: false },
            ageCategory: { type: String, enum: ['Child', 'Teen', 'Adult'], default: 'Adult' },
            contentFiltering: { type: String, enum: ['Strict', 'Moderate', 'Off'], default: 'Off' },
            disableSensitiveTopics: { type: Boolean, default: false },
            timeUsageLimits: { type: Number, default: 0 } // minutes per day, 0 = unlimited
        },

        // Account
        account: {
            nickname: { type: String, default: '' },
            subscriptionPlan: { type: String, default: 'Free' }
        }
    },
    modePreferences: {
        defaultMode: { type: String, default: 'NORMAL_CHAT' },
        autoDetect: { type: Boolean, default: true }
    },
    plan: {
        type: String,
        enum: ['Basic', 'Pro', 'King'],
        default: 'Basic'
    },
    subscription: {
        id: String,
        status: String,
        currentPeriodEnd: Date,
        razorpay_payment_id: String,
        razorpay_order_id: String,
        razorpay_signature: String
    }

}, { timestamps: true });

export default mongoose.model('User', userSchema);