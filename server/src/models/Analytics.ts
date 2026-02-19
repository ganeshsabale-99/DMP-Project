import mongoose, { Schema } from 'mongoose';
import { IAnalytics } from '../types';

const analyticsSchema = new Schema<IAnalytics>({
  date: {
    type: Date,
    required: [true, 'Date is required'],
    index: true
  },
  platform: {
    type: String,
    required: [true, 'Platform is required'],
    index: true
  },
  metrics: {
    impressions: { type: Number, default: 0 },
    reach: { type: Number, default: 0 },
    engagement: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 },
    spend: { type: Number, default: 0 }
  },
  campaign: {
    type: Schema.Types.ObjectId,
    ref: 'Campaign',
    default: null,
    index: true
  },
  post: {
    type: Schema.Types.ObjectId,
    ref: 'Post',
    default: null,
    index: true
  }
}, {
  timestamps: true
});

// Compound indexes for efficient querying
analyticsSchema.index({ date: -1, platform: 1 });
analyticsSchema.index({ date: -1, campaign: 1 });
analyticsSchema.index({ date: -1, post: 1 });

export const Analytics = mongoose.model<IAnalytics>('Analytics', analyticsSchema);
