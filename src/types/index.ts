// User Types
export type UserRole = 'SUPER_ADMIN' | 'MARKETING_HEAD' | 'DM_EXECUTIVE' | 'SALES_TEAM' | 'ANALYST';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
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
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

// Post Types
export type PostStatus = 'DRAFT' | 'SCHEDULED' | 'PENDING_APPROVAL' | 'PUBLISHED' | 'FAILED' | 'ARCHIVED';
export type PostPlatform = 'INSTAGRAM' | 'FACEBOOK' | 'TWITTER' | 'LINKEDIN' | 'YOUTUBE' | 'TIKTOK';

export interface Post {
  id: string;
  title: string;
  content: string;
  platform: PostPlatform;
  status: PostStatus;
  scheduledAt?: string;
  publishedAt?: string;
  createdBy: User;
  approvedBy?: User;
  mediaUrls: string[];
  hashtags: string[];
  mentions: string[];
  engagement: {
    likes: number;
    comments: number;
    shares: number;
    views: number;
  };
  campaign?: Campaign;
  metadata: {
    seoScore?: number;
    readabilityScore?: number;
    sentimentScore?: number;
  };
  createdAt: string;
  updatedAt: string;
}

// Lead Types
export type LeadStatus = 'NEW' | 'QUALIFIED' | 'CONTACTED' | 'ENGAGED' | 'OPPORTUNITY' | 'CONVERTED' | 'LOST';
export type LeadSource = 'WEBSITE' | 'SOCIAL_MEDIA' | 'EMAIL' | 'ADVERTISEMENT' | 'REFERRAL' | 'EVENT' | 'OTHER';

export interface LeadActivity {
  id: string;
  type: 'NOTE' | 'CALL' | 'EMAIL' | 'MEETING' | 'TASK';
  description: string;
  createdBy: User;
  createdAt: string;
}

export interface Lead {
  id: string;
  email: string;
  phone?: string;
  firstName: string;
  lastName: string;
  fullName: string;
  company?: string;
  jobTitle?: string;
  source: LeadSource;
  status: LeadStatus;
  score: number;
  assignedTo?: User;
  customFields: Record<string, any>;
  activities: LeadActivity[];
  tags: string[];
  notes: string;
  lastContactedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Campaign Types
export type CampaignType = 'EMAIL' | 'SOCIAL' | 'ADS' | 'SEO' | 'CONTENT';
export type CampaignStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED';

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  type: CampaignType;
  status: CampaignStatus;
  budget: number;
  spent: number;
  startDate: string;
  endDate?: string;
  createdBy: User;
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
  posts: Post[];
  leads: Lead[];
  createdAt: string;
  updatedAt: string;
}

// Analytics Types
export interface Analytics {
  id: string;
  date: string;
  platform: string;
  metrics: {
    impressions: number;
    reach: number;
    engagement: number;
    clicks: number;
    conversions: number;
    spend: number;
  };
  campaign?: Campaign;
  post?: Post;
  createdAt: string;
}

// SEO Types
export interface SEOPage {
  id: string;
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
  lastAnalyzedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Message Types
export type MessageChannel = 'WHATSAPP' | 'MESSENGER' | 'EMAIL' | 'SMS' | 'LIVE_CHAT';
export type MessageStatus = 'UNREAD' | 'READ' | 'REPLIED' | 'ARCHIVED';

export interface Message {
  id: string;
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
  assignedTo?: User;
  tags: string[];
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  createdAt: string;
  updatedAt: string;
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
  variations: string[];
  suggestedHashtags: string[];
  suggestedImages: string[];
  engagement: {
    predictedLikes: number;
    predictedComments: number;
    predictedShares: number;
    predictedReach: number;
    engagementRate: string;
  };
  platformTips: string[];
  characterLimit: number;
  brandVoice: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Navigation Types
export interface NavItem {
  label: string;
  href: string;
  icon: string;
  roles?: UserRole[];
  children?: NavItem[];
}
