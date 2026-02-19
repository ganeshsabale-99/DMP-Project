import mongoose, { Schema } from 'mongoose';
import { ICampaign } from '../types';

const campaignSchema = new Schema<ICampaign>({
  name: {
    type: String,
    required: [true, 'Campaign name is required'],
    trim: true,
    maxlength: [255, 'Name cannot exceed 255 characters']
  },
  description: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['EMAIL', 'SOCIAL', 'ADS', 'SEO', 'CONTENT'],
    required: [true, 'Campaign type is required']
  },
  status: {
    type: String,
    enum: ['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED'],
    default: 'DRAFT'
  },
  budget: {
    type: Number,
    default: 0,
    min: 0
  },
  spent: {
    type: Number,
    default: 0,
    min: 0
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    default: null
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required']
  },
  targetAudience: {
    demographics: {
      ageRange: {
        min: { type: Number, min: 0, max: 120 },
        max: { type: Number, min: 0, max: 120 }
      },
      gender: [{ type: String }],
      locations: [{ type: String }]
    },
    interests: [{ type: String }],
    behaviors: [{ type: String }]
  },
  performanceMetrics: {
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 },
    ctr: { type: Number, default: 0 },
    cpc: { type: Number, default: 0 },
    roas: { type: Number, default: 0 }
  },
  posts: [{
    type: Schema.Types.ObjectId,
    ref: 'Post'
  }],
  leads: [{
    type: Schema.Types.ObjectId,
    ref: 'Lead'
  }]
}, {
  timestamps: true
});

// Indexes
campaignSchema.index({ status: 1 });
campaignSchema.index({ type: 1 });
campaignSchema.index({ createdBy: 1 });
campaignSchema.index({ startDate: -1 });
campaignSchema.index({ endDate: 1 });

export const Campaign = mongoose.model<ICampaign>('Campaign', campaignSchema);
