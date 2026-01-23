import mongoose from "mongoose";

const transactionSchema = mongoose.Schema({
    transactionId: {
        type: String,
        required: true,
        unique: true
    },
    agentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Agent'
    },
    vendorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    buyerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    platformFee: {
        type: Number,
        default: 0
    },
    netAmount: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['Success', 'Pending', 'Failed', 'success'],
        default: 'Success'
    },
    plan: String,
    orderId: String,
    paymentId: String
}, { timestamps: true });

export default mongoose.model("Transaction", transactionSchema);
