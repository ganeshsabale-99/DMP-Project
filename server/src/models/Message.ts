import mongoose, { Schema } from 'mongoose';
import { IMessage } from '../types';

const messageSchema = new Schema<IMessage>({
  channel: {
    type: String,
    enum: ['WHATSAPP', 'MESSENGER', 'EMAIL', 'SMS', 'LIVE_CHAT'],
    required: [true, 'Channel is required']
  },
  sender: {
    name: { type: String, required: true },
    email: { type: String },
    phone: { type: String },
    avatar: { type: String }
  },
  content: {
    type: String,
    required: [true, 'Message content is required']
  },
  attachments: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['UNREAD', 'READ', 'REPLIED', 'ARCHIVED'],
    default: 'UNREAD'
  },
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  tags: [{
    type: String,
    trim: true
  }],
  sentiment: {
    type: String,
    enum: ['POSITIVE', 'NEUTRAL', 'NEGATIVE'],
    default: 'NEUTRAL'
  }
}, {
  timestamps: true
});

// Indexes
messageSchema.index({ channel: 1 });
messageSchema.index({ status: 1 });
messageSchema.index({ assignedTo: 1 });
messageSchema.index({ sentiment: 1 });
messageSchema.index({ createdAt: -1 });
messageSchema.index({ tags: 1 });

export const Message = mongoose.model<IMessage>('Message', messageSchema);
