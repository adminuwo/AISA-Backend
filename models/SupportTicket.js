import mongoose from 'mongoose';

const supportTicketSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    issueType: {
        type: String,
        required: true,
        enum: ["General Inquiry", "Payment Issue", "Refund Request", "Technical Support", "Account Access", "Other"],
    },
    message: {
        type: String,
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    status: {
        type: String,
        enum: ['pending', 'resolved', 'open', 'in_progress', 'closed'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('SupportTicket', supportTicketSchema);
