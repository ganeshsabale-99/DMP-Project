import { Response } from 'express';
import { AuthRequest } from '../types';
import { asyncHandler } from '../middleware/errorHandler';
import { Analytics, Post, Campaign } from '../models';

// Get analytics overview
export const getOverview = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { startDate, endDate, platform } = req.query;

  const matchStage: any = {};
  
  if (startDate && endDate) {
    matchStage.date = {
      $gte: new Date(startDate as string),
      $lte: new Date(endDate as string)
    };
  }
  
  if (platform) {
    matchStage.platform = platform;
  }

  const overview = await Analytics.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalImpressions: { $sum: '$metrics.impressions' },
        totalReach: { $sum: '$metrics.reach' },
        totalEngagement: { $sum: '$metrics.engagement' },
        totalClicks: { $sum: '$metrics.clicks' },
        totalConversions: { $sum: '$metrics.conversions' },
        totalSpend: { $sum: '$metrics.spend' }
      }
    }
  ]);

  // Calculate rates
  const data = overview[0] || {
    totalImpressions: 0,
    totalReach: 0,
    totalEngagement: 0,
    totalClicks: 0,
    totalConversions: 0,
    totalSpend: 0
  };

  const ctr = data.totalImpressions > 0 
    ? ((data.totalClicks / data.totalImpressions) * 100).toFixed(2) 
    : '0.00';
  
  const engagementRate = data.totalReach > 0 
    ? ((data.totalEngagement / data.totalReach) * 100).toFixed(2) 
    : '0.00';
  
  const conversionRate = data.totalClicks > 0 
    ? ((data.totalConversions / data.totalClicks) * 100).toFixed(2) 
    : '0.00';

  const cpc = data.totalClicks > 0 
    ? (data.totalSpend / data.totalClicks).toFixed(2) 
    : '0.00';

  res.json({
    success: true,
    data: {
      ...data,
      ctr: `${ctr}%`,
      engagementRate: `${engagementRate}%`,
      conversionRate: `${conversionRate}%`,
      cpc: `$${cpc}`
    }
  });
});

// Get time series data
export const getTimeSeries = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { startDate, endDate, platform, granularity = 'daily' } = req.query;

  const matchStage: any = {};
  
  if (startDate && endDate) {
    matchStage.date = {
      $gte: new Date(startDate as string),
      $lte: new Date(endDate as string)
    };
  }
  
  if (platform) {
    matchStage.platform = platform;
  }

  let dateFormat: string;
  let groupBy: any;

  switch (granularity) {
    case 'hourly':
      dateFormat = '%Y-%m-%d %H:00';
      groupBy = {
        year: { $year: '$date' },
        month: { $month: '$date' },
        day: { $dayOfMonth: '$date' },
        hour: { $hour: '$date' }
      };
      break;
    case 'weekly':
      dateFormat = '%Y-W%U';
      groupBy = {
        year: { $year: '$date' },
        week: { $week: '$date' }
      };
      break;
    case 'monthly':
      dateFormat = '%Y-%m';
      groupBy = {
        year: { $year: '$date' },
        month: { $month: '$date' }
      };
      break;
    default: // daily
      dateFormat = '%Y-%m-%d';
      groupBy = {
        year: { $year: '$date' },
        month: { $month: '$date' },
        day: { $dayOfMonth: '$date' }
      };
  }

  const timeSeries = await Analytics.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: groupBy,
        impressions: { $sum: '$metrics.impressions' },
        reach: { $sum: '$metrics.reach' },
        engagement: { $sum: '$metrics.engagement' },
        clicks: { $sum: '$metrics.clicks' },
        conversions: { $sum: '$metrics.conversions' },
        spend: { $sum: '$metrics.spend' }
      }
    },
    { $sort: { '_id': 1 } }
  ]);

  res.json({
    success: true,
    data: timeSeries.map(item => ({
      date: formatDate(item._id, granularity as string),
      ...item,
      _id: undefined
    }))
  });
});

// Get platform breakdown
export const getPlatformBreakdown = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { startDate, endDate } = req.query;

  const matchStage: any = {};
  
  if (startDate && endDate) {
    matchStage.date = {
      $gte: new Date(startDate as string),
      $lte: new Date(endDate as string)
    };
  }

  const breakdown = await Analytics.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$platform',
        impressions: { $sum: '$metrics.impressions' },
        reach: { $sum: '$metrics.reach' },
        engagement: { $sum: '$metrics.engagement' },
        clicks: { $sum: '$metrics.clicks' },
        conversions: { $sum: '$metrics.conversions' },
        spend: { $sum: '$metrics.spend' }
      }
    },
    { $sort: { engagement: -1 } }
  ]);

  res.json({
    success: true,
    data: breakdown.map(item => ({
      platform: item._id,
      ...item,
      _id: undefined
    }))
  });
});

// Get top performing content
export const getTopContent = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { limit = 10, platform } = req.query;

  const query: any = {};
  if (platform) query.platform = platform;

  const topContent = await Post.find(query)
    .sort({
      'engagement.likes': -1,
      'engagement.comments': -1,
      'engagement.shares': -1
    })
    .limit(Number(limit))
    .populate('createdBy', 'firstName lastName')
    .select('title platform engagement metadata createdAt');

  res.json({
    success: true,
    data: topContent
  });
});

// Get campaign performance
export const getCampaignPerformance = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { campaignId } = req.params;

  const campaign = await Campaign.findById(campaignId)
    .select('name performanceMetrics posts leads');

  if (!campaign) {
    return res.status(404).json({
      success: false,
      message: 'Campaign not found'
    });
  }

  // Get post performance
  const postPerformance = await Post.find({
    _id: { $in: campaign.posts }
  }).select('title platform engagement');

  res.json({
    success: true,
    data: {
      campaign: {
        name: campaign.name,
        metrics: campaign.performanceMetrics
      },
      postPerformance
    }
  });
});

// Create analytics entry
export const createAnalytics = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user;
  
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated'
    });
  }

  const {
    date,
    platform,
    metrics,
    campaign,
    post
  } = req.body;

  const analytics = await Analytics.create({
    date: new Date(date),
    platform,
    metrics,
    campaign: campaign || null,
    post: post || null
  });

  res.status(201).json({
    success: true,
    message: 'Analytics entry created',
    data: analytics
  });
});

// Helper function to format date
function formatDate(dateObj: any, granularity: string): string {
  const { year, month, day, hour, week } = dateObj;
  
  switch (granularity) {
    case 'hourly':
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} ${String(hour).padStart(2, '0')}:00`;
    case 'weekly':
      return `${year}-W${String(week).padStart(2, '0')}`;
    case 'monthly':
      return `${year}-${String(month).padStart(2, '0')}`;
    default:
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
}
