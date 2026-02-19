import mongoose, { Schema } from 'mongoose';
import { IPost } from '../types';

const postSchema = new Schema<IPost>({
  title: {
    type: String,
    required: [true, 'Post title is required'],
    trim: true,
    maxlength: [500, 'Title cannot exceed 500 characters']
  },
  content: {
    type: String,
    required: [true, 'Post content is required'],
    maxlength: [10000, 'Content cannot exceed 10000 characters']
  },
  platform: {
    type: String,
    enum: ['INSTAGRAM', 'FACEBOOK', 'TWITTER', 'LINKEDIN', 'YOUTUBE', 'TIKTOK'],
    required: [true, 'Platform is required']
  },
  status: {
    type: String,
    enum: ['DRAFT', 'SCHEDULED', 'PENDING_APPROVAL', 'PUBLISHED', 'FAILED', 'ARCHIVED'],
    default: 'DRAFT'
  },
  scheduledAt: {
    type: Date,
    default: null
  },
  publishedAt: {
    type: Date,
    default: null
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required']
  },
  approvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  mediaUrls: [{
    type: String
  }],
  hashtags: [{
    type: String,
    trim: true
  }],
  mentions: [{
    type: String,
    trim: true
  }],
  engagement: {
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    views: { type: Number, default: 0 }
  },
  campaign: {
    type: Schema.Types.ObjectId,
    ref: 'Campaign',
    default: null
  },
  metadata: {
    seoScore: { type: Number, default: 0, min: 0, max: 100 },
    readabilityScore: { type: Number, default: 0, min: 0, max: 100 },
    sentimentScore: { type: Number, default: 0, min: -1, max: 1 }
  }
}, {
  timestamps: true
});

// Indexes
postSchema.index({ status: 1 });
postSchema.index({ platform: 1 });
postSchema.index({ createdBy: 1 });
postSchema.index({ scheduledAt: 1 });
postSchema.index({ campaign: 1 });
postSchema.index({ createdAt: -1 });

export const Post = mongoose.model<IPost>('Post', postSchema);
