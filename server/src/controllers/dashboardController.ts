import { Response } from 'express';
import { AuthRequest } from '../types';
import { asyncHandler } from '../middleware/errorHandler';
import { Post, Lead, Campaign, Analytics } from '../models';

// Get CEO Dashboard metrics
export const getCEODashboard = asyncHandler(async (req: AuthRequest, res: Response) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  // Aggregate metrics
  const [
    totalLeads,
    newLeadsThisMonth,
    totalCampaigns,
    activeCampaigns,
    totalPosts,
    scheduledPosts,
    analyticsData
  ] = await Promise.all([
    Lead.countDocuments(),
    Lead.countDocuments({ createdAt: { $gte: startOfMonth } }),
    Campaign.countDocuments(),
    Campaign.countDocuments({ status: 'ACTIVE' }),
    Post.countDocuments(),
    Post.countDocuments({ status: 'SCHEDULED' }),
    Analytics.aggregate([
      {
        $group: {
          _id: null,
          totalImpressions: { $sum: '$metrics.impressions' },
          totalClicks: { $sum: '$metrics.clicks' },
          totalConversions: { $sum: '$metrics.conversions' },
          totalSpend: { $sum: '$metrics.spend' },
          totalEngagement: { $sum: '$metrics.engagement' }
        }
      }
    ])
  ]);

  // Calculate conversion rate
  const convertedLeads = await Lead.countDocuments({ status: 'CONVERTED' });
  const leadConversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

  // Calculate ROI
  const totalRevenue = convertedLeads * 1000; // Estimated revenue per conversion
  const totalSpend = analyticsData[0]?.totalSpend || 0;
  const roi = totalSpend > 0 ? ((totalRevenue - totalSpend) / totalSpend) * 100 : 0;

  // Calculate engagement rate
  const totalImpressions = analyticsData[0]?.totalImpressions || 0;
  const totalEngagement = analyticsData[0]?.totalEngagement || 0;
  const engagementRate = totalImpressions > 0 ? (totalEngagement / totalImpressions) * 100 : 0;

  // Get monthly trend data
  const monthlyTrend = await Analytics.aggregate([
    {
      $match: {
        date: { $gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$date' },
          month: { $month: '$date' }
        },
        impressions: { $sum: '$metrics.impressions' },
        clicks: { $sum: '$metrics.clicks' },
        conversions: { $sum: '$metrics.conversions' },
        spend: { $sum: '$metrics.spend' }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  // Get platform performance
  const platformPerformance = await Analytics.aggregate([
    {
      $group: {
        _id: '$platform',
        impressions: { $sum: '$metrics.impressions' },
        clicks: { $sum: '$metrics.clicks' },
        engagement: { $sum: '$metrics.engagement' }
      }
    }
  ]);

  // Get recent activities
  const recentPosts = await Post.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('createdBy', 'firstName lastName');

  const recentLeads = await Lead.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('assignedTo', 'firstName lastName');

  res.json({
    success: true,
    data: {
      metrics: {
        totalLeads,
        newLeadsThisMonth,
        leadConversionRate: Math.round(leadConversionRate * 100) / 100,
        totalCampaigns,
        activeCampaigns,
        totalPosts,
        scheduledPosts,
        totalEngagement: totalEngagement || 0,
        engagementRate: Math.round(engagementRate * 100) / 100,
        totalSpend: totalSpend || 0,
        roi: Math.round(roi * 100) / 100
      },
      charts: {
        monthlyTrend: monthlyTrend.map(item => ({
          month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
          impressions: item.impressions,
          clicks: item.clicks,
          conversions: item.conversions,
          spend: item.spend
        })),
        platformPerformance: platformPerformance.map(item => ({
          platform: item._id,
          impressions: item.impressions,
          clicks: item.clicks,
          engagement: item.engagement
        }))
      },
      recentActivity: {
        posts: recentPosts,
        leads: recentLeads
      }
    }
  });
});

// Get Marketing Dashboard
export const getMarketingDashboard = asyncHandler(async (req: AuthRequest, res: Response) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    postsByStatus,
    postsByPlatform,
    upcomingPosts,
    campaignPerformance
  ] = await Promise.all([
    Post.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),
    Post.aggregate([
      { $group: { _id: '$platform', count: { $sum: 1 } } }
    ]),
    Post.find({
      status: 'SCHEDULED',
      scheduledAt: { $gte: now }
    })
      .sort({ scheduledAt: 1 })
      .limit(10)
      .populate('createdBy', 'firstName lastName'),
    Campaign.find({ status: 'ACTIVE' })
      .select('name type performanceMetrics')
      .limit(5)
  ]);

  // Get content calendar data for current month
  const calendarData = await Post.find({
    $or: [
      { scheduledAt: { $gte: startOfMonth, $lte: now } },
      { createdAt: { $gte: startOfMonth, $lte: now } }
    ]
  })
    .select('title platform status scheduledAt')
    .sort({ scheduledAt: 1 });

  res.json({
    success: true,
    data: {
      postsOverview: {
        byStatus: postsByStatus,
        byPlatform: postsByPlatform
      },
      upcomingPosts,
      campaignPerformance,
      calendarData
    }
  });
});

// Get Lead Dashboard
export const getLeadDashboard = asyncHandler(async (req: AuthRequest, res: Response) => {
  const [
    leadsByStatus,
    leadsBySource,
    recentLeads,
    topScoringLeads
  ] = await Promise.all([
    Lead.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),
    Lead.aggregate([
      { $group: { _id: '$source', count: { $sum: 1 } } }
    ]),
    Lead.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('assignedTo', 'firstName lastName'),
    Lead.find({ score: { $gte: 70 } })
      .sort({ score: -1 })
      .limit(10)
      .populate('assignedTo', 'firstName lastName')
  ]);

  // Calculate conversion funnel
  const totalLeads = await Lead.countDocuments();
  const conversionFunnel = [
    { stage: 'NEW', count: await Lead.countDocuments({ status: 'NEW' }) },
    { stage: 'QUALIFIED', count: await Lead.countDocuments({ status: 'QUALIFIED' }) },
    { stage: 'CONTACTED', count: await Lead.countDocuments({ status: 'CONTACTED' }) },
    { stage: 'ENGAGED', count: await Lead.countDocuments({ status: 'ENGAGED' }) },
    { stage: 'OPPORTUNITY', count: await Lead.countDocuments({ status: 'OPPORTUNITY' }) },
    { stage: 'CONVERTED', count: await Lead.countDocuments({ status: 'CONVERTED' }) }
  ];

  res.json({
    success: true,
    data: {
      leadsByStatus,
      leadsBySource,
      recentLeads,
      topScoringLeads,
      conversionFunnel,
      totalLeads
    }
  });
});

// Get Analytics Dashboard
export const getAnalyticsDashboard = asyncHandler(async (req: AuthRequest, res: Response) => {
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

  const analytics = await Analytics.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          platform: '$platform'
        },
        impressions: { $sum: '$metrics.impressions' },
        reach: { $sum: '$metrics.reach' },
        engagement: { $sum: '$metrics.engagement' },
        clicks: { $sum: '$metrics.clicks' },
        conversions: { $sum: '$metrics.conversions' },
        spend: { $sum: '$metrics.spend' }
      }
    },
    { $sort: { '_id.date': 1 } }
  ]);

  // Get top performing content
  const topContent = await Post.find()
    .sort({ 'engagement.likes': -1 })
    .limit(10)
    .select('title platform engagement metadata');

  res.json({
    success: true,
    data: {
      timeSeriesData: analytics,
      topContent,
      summary: analytics.reduce((acc, curr) => ({
        impressions: acc.impressions + curr.impressions,
        reach: acc.reach + curr.reach,
        engagement: acc.engagement + curr.engagement,
        clicks: acc.clicks + curr.clicks,
        conversions: acc.conversions + curr.conversions,
        spend: acc.spend + curr.spend
      }), { impressions: 0, reach: 0, engagement: 0, clicks: 0, conversions: 0, spend: 0 })
    }
  });
});
