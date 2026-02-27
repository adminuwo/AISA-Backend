import mongoose from 'mongoose';

const monthlyUsageSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    month: {
        type: String, // format "YYYY-MM"
        required: true
    },
    imageCount: { type: Number, default: 0 },
    videoCount: { type: Number, default: 0 },
    deepSearchCount: { type: Number, default: 0 },
    audioConvertCount: { type: Number, default: 0 },
    documentConvertCount: { type: Number, default: 0 },
    codeWriterCount: { type: Number, default: 0 },
    chatCount: { type: Number, default: 0 }
}, { timestamps: true });

// Ensure one record per user per month
monthlyUsageSchema.index({ userId: 1, month: 1 }, { unique: true });

export default mongoose.model('MonthlyUsage', monthlyUsageSchema);
