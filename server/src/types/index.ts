import { Request } from 'express';
import { Document, Types } from 'mongoose';

// User Types
export type UserRole = 'SUPER_ADMIN' | 'MARKETING_HEAD' | 'DM_EXECUTIVE' | 'SALES_TEAM' | 'ANALYST';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface IUser extends Document {
  _id: Types.ObjectId;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
  department?: string;
  phone?: string;
  timezone: string;
  preferences: {
    notifications: boolean;
    emailDigest: boolean;
    theme: 'light' | 'dark' | 'system';
  };
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Post/Content Types
export type PostStatus = 'DRAFT' | 'SCHEDULED' | 'PENDING_APPROVAL' | 'PUBLISHED' | 'FAILED' | 'ARCHIVED';
export type PostPlatform = 'INSTAGRAM' | 'FACEBOOK' | 'TWITTER' | 'LINKEDIN' | 'YOUTUBE' | 'TIKTOK';

export interface IPost extends Document {
  _id: Types.ObjectId;
  title: string;
  content: string;
  platform: PostPlatform;
  status: PostStatus;
  scheduledAt?: Date;
  publishedAt?: Date;
  createdBy: Types.ObjectId;
  approvedBy?: Types.ObjectId;
  mediaUrls: string[];
  hashtags: string[];
  mentions: string[];
  engagement: {
    likes: number;
    comments: number;
    shares: number;
    views: number;
  };
  campaign?: Types.ObjectId;
  metadata: {
    seoScore?: number;
    readabilityScore?: number;
    sentimentScore?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Lead Types
export type LeadStatus = 'NEW' | 'QUALIFIED' | 'CONTACTED' | 'ENGAGED' | 'OPPORTUNITY' | 'CONVERTED' | 'LOST';
export type LeadSource = 'WEBSITE' | 'SOCIAL_MEDIA' | 'EMAIL' | 'ADVERTISEMENT' | 'REFERRAL' | 'EVENT' | 'OTHER';

export interface ILead extends Document {
  _id: Types.ObjectId;
  email: string;
  phone?: string;
  firstName: string;
  lastName: string;
  company?: string;
  jobTitle?: string;
  source: LeadSource;
  status: LeadStatus;
  score: number;
  assignedTo?: Types.ObjectId;
  customFields: Record<string, any>;
  activities: ILeadActivity[];
  tags: string[];
  notes: string;
  lastContactedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ILeadActivity {
  _id: Types.ObjectId;
  type: 'NOTE' | 'CALL' | 'EMAIL' | 'MEETING' | 'TASK';
  description: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
}

// Campaign Types
export type CampaignType = 'EMAIL' | 'SOCIAL' | 'ADS' | 'SEO' | 'CONTENT';
export type CampaignStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED';

export interface ICampaign extends Document {
  _id: Types.ObjectId;
  name: string;
  description?: string;
  type: CampaignType;
  status: CampaignStatus;
  budget: number;
  spent: number;
  startDate: Date;
  endDate?: Date;
  createdBy: Types.ObjectId;
  targetAudience: {
    demographics?: {
      ageRange?: { min: number; max: number };
      gender?: string[];
      locations?: string[];
    };
    interests?: string[];
    behaviors?: string[];
  };
  performanceMetrics: {
    impressions: number;
    clicks: number;
    conversions: number;
    ctr: number;
    cpc: number;
    roas: number;
  };
  posts: Types.ObjectId[];
  leads: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

// Analytics Types
export interface IAnalytics extends Document {
  _id: Types.ObjectId;
  date: Date;
  platform: string;
  metrics: {
    impressions: number;
    reach: number;
    engagement: number;
    clicks: number;
    conversions: number;
    spend: number;
  };
  campaign?: Types.ObjectId;
  post?: Types.ObjectId;
  createdAt: Date;
}

// SEO Types
export interface ISEOPage extends Document {
  _id: Types.ObjectId;
  url: string;
  title: string;
  metaDescription: string;
  metaKeywords: string[];
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  schemaMarkup?: Record<string, any>;
  contentScore: number;
  seoScore: number;
  readabilityScore: number;
  lastAnalyzedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Message Types
export type MessageChannel = 'WHATSAPP' | 'MESSENGER' | 'EMAIL' | 'SMS' | 'LIVE_CHAT';
export type MessageStatus = 'UNREAD' | 'READ' | 'REPLIED' | 'ARCHIVED';

export interface IMessage extends Document {
  _id: Types.ObjectId;
  channel: MessageChannel;
  sender: {
    name: string;
    email?: string;
    phone?: string;
    avatar?: string;
  };
  content: string;
  attachments?: string[];
  status: MessageStatus;
  assignedTo?: Types.ObjectId;
  tags: string[];
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  createdAt: Date;
  updatedAt: Date;
}

// Auth Types
export interface AuthRequest extends Request {
  user?: IUser;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
}

// AI Types
export interface AIContentRequest {
  prompt: string;
  brandVoice: string;
  platform: PostPlatform;
  maxLength?: number;
  includeHashtags?: boolean;
  includeEmojis?: boolean;
}

export interface AIContentResponse {
  content: string;
  hashtags: string[];
  suggestedImages: string[];
  engagement: string;
}

// Dashboard Types
export interface DashboardMetrics {
  totalLeads: number;
  newLeadsThisMonth: number;
  leadConversionRate: number;
  totalCampaigns: number;
  activeCampaigns: number;
  totalPosts: number;
  scheduledPosts: number;
  totalEngagement: number;
  engagementRate: number;
  totalSpend: number;
  roi: number;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    color?: string;
  }[];
}
