import mongoose, { Schema } from 'mongoose';
import { ISEOPage } from '../types';

const seoPageSchema = new Schema<ISEOPage>({
  url: {
    type: String,
    required: [true, 'URL is required'],
    unique: true,
    trim: true
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [70, 'Title should not exceed 70 characters']
  },
  metaDescription: {
    type: String,
    required: [true, 'Meta description is required'],
    trim: true,
    maxlength: [160, 'Meta description should not exceed 160 characters']
  },
  metaKeywords: [{
    type: String,
    trim: true
  }],
  ogTitle: {
    type: String,
    trim: true
  },
  ogDescription: {
    type: String,
    trim: true
  },
  ogImage: {
    type: String
  },
  schemaMarkup: {
    type: Schema.Types.Mixed,
    default: {}
  },
  contentScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  seoScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  readabilityScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  lastAnalyzedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes
seoPageSchema.index({ url: 1 });
seoPageSchema.index({ seoScore: -1 });
seoPageSchema.index({ contentScore: -1 });
seoPageSchema.index({ lastAnalyzedAt: -1 });

export const SEOPage = mongoose.model<ISEOPage>('SEOPage', seoPageSchema);
