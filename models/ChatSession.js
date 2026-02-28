import mongoose from 'mongoose';


const messageSchema = new mongoose.Schema({
  id: String,
  role: {
    type: String,
    enum: ['user', 'model'],
    required: true
  },
  content: { type: String, required: true },
  timestamp: {
    type: mongoose.Schema.Types.Mixed,
    default: Date.now,
    set: (v) => {
      if (typeof v === 'string') return new Date(v).getTime() || Date.now();
      if (v instanceof Date) return v.getTime();
      return v;
    }
  },
  attachments: [{
    type: { type: String, enum: ['image', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'] },
    url: String,
    name: String
  }],
  imageUrl: String,
  videoUrl: String
});

const chatSessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  guestId: {
    type: String,
    index: true,
    required: false
  },
  title: { type: String, default: 'New Chat' },
  messages: [messageSchema],
  lastModified: { type: Number, default: Date.now },
  detectedMode: { type: String, default: 'NORMAL_CHAT' }
}, { timestamps: true });
const ChatSession = mongoose.model('ChatSession', chatSessionSchema);
export default ChatSession