import mongoose, { Schema } from 'mongoose';
import { ILead, ILeadActivity } from '../types';

const leadActivitySchema = new Schema<ILeadActivity>({
  type: {
    type: String,
    enum: ['NOTE', 'CALL', 'EMAIL', 'MEETING', 'TASK'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const leadSchema = new Schema<ILead>({
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    trim: true
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  company: {
    type: String,
    trim: true
  },
  jobTitle: {
    type: String,
    trim: true
  },
  source: {
    type: String,
    enum: ['WEBSITE', 'SOCIAL_MEDIA', 'EMAIL', 'ADVERTISEMENT', 'REFERRAL', 'EVENT', 'OTHER'],
    default: 'OTHER'
  },
  status: {
    type: String,
    enum: ['NEW', 'QUALIFIED', 'CONTACTED', 'ENGAGED', 'OPPORTUNITY', 'CONVERTED', 'LOST'],
    default: 'NEW'
  },
  score: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  customFields: {
    type: Map,
    of: Schema.Types.Mixed,
    default: {}
  },
  activities: [leadActivitySchema],
  tags: [{
    type: String,
    trim: true
  }],
  notes: {
    type: String,
    default: ''
  },
  lastContactedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Virtual for full name
leadSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Indexes
leadSchema.index({ email: 1 });
leadSchema.index({ status: 1 });
leadSchema.index({ source: 1 });
leadSchema.index({ assignedTo: 1 });
leadSchema.index({ score: -1 });
leadSchema.index({ createdAt: -1 });
leadSchema.index({ tags: 1 });

export const Lead = mongoose.model<ILead>('Lead', leadSchema);
