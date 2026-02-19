import { Response } from 'express';
import { AuthRequest } from '../types';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { Campaign } from '../models';
import { logger } from '../utils/logger';

// Get all campaigns
export const getCampaigns = asyncHandler(async (req: AuthRequest, res: Response) => {
  const {
    page = 1,
    limit = 20,
    status,
    type,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  const query: any = {};

  if (status) query.status = status;
  if (type) query.type = type;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const sort: any = {};
  sort[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

  const [campaigns, total] = await Promise.all([
    Campaign.find(query)
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .populate('createdBy', 'firstName lastName avatar')
      .populate('posts', 'title platform status')
      .populate('leads', 'firstName lastName email status'),
    Campaign.countDocuments(query)
  ]);

  res.json({
    success: true,
    data: campaigns,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    }
  });
});

// Get single campaign
export const getCampaign = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const campaign = await Campaign.findById(id)
    .populate('createdBy', 'firstName lastName avatar')
    .populate('posts')
    .populate('leads', 'firstName lastName email status score');

  if (!campaign) {
    throw new AppError('Campaign not found', 404);
  }

  res.json({
    success: true,
    data: campaign
  });
});

// Create campaign
export const createCampaign = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user;
  
  if (!user) {
    throw new AppError('Not authenticated', 401);
  }

  const {
    name,
    description,
    type,
    budget,
    startDate,
    endDate,
    targetAudience
  } = req.body;

  const campaign = await Campaign.create({
    name,
    description,
    type,
    budget: budget || 0,
    startDate: new Date(startDate),
    endDate: endDate ? new Date(endDate) : null,
    createdBy: user._id,
    targetAudience: targetAudience || {},
    posts: [],
    leads: []
  });

  const populatedCampaign = await Campaign.findById(campaign._id)
    .populate('createdBy', 'firstName lastName avatar');

  logger.info(`Campaign created: ${campaign._id} by ${user.email}`);

  res.status(201).json({
    success: true,
    message: 'Campaign created successfully',
    data: populatedCampaign
  });
});

// Update campaign
export const updateCampaign = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user;
  
  if (!user) {
    throw new AppError('Not authenticated', 401);
  }

  const { id } = req.params;
  const updateData = req.body;

  const campaign = await Campaign.findById(id);
  
  if (!campaign) {
    throw new AppError('Campaign not found', 404);
  }

  // Check if user can update this campaign
  if (campaign.createdBy.toString() !== user._id.toString() && 
      !['SUPER_ADMIN', 'MARKETING_HEAD'].includes(user.role)) {
    throw new AppError('Not authorized to update this campaign', 403);
  }

  const allowedUpdates = ['name', 'description', 'type', 'budget', 'startDate', 'endDate', 'targetAudience', 'status'];
  const updates: any = {};

  allowedUpdates.forEach(field => {
    if (updateData[field] !== undefined) {
      if (field === 'startDate' || field === 'endDate') {
        updates[field] = new Date(updateData[field]);
      } else {
        updates[field] = updateData[field];
      }
    }
  });

  const updatedCampaign = await Campaign.findByIdAndUpdate(
    id,
    updates,
    { new: true, runValidators: true }
  )
    .populate('createdBy', 'firstName lastName avatar')
    .populate('posts')
    .populate('leads', 'firstName lastName email status');

  logger.info(`Campaign updated: ${id} by ${user.email}`);

  res.json({
    success: true,
    message: 'Campaign updated successfully',
    data: updatedCampaign
  });
});

// Delete campaign
export const deleteCampaign = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user;
  
  if (!user) {
    throw new AppError('Not authenticated', 401);
  }

  const { id } = req.params;

  const campaign = await Campaign.findById(id);
  
  if (!campaign) {
    throw new AppError('Campaign not found', 404);
  }

  // Only admin or marketing head can delete campaigns
  if (!['SUPER_ADMIN', 'MARKETING_HEAD'].includes(user.role)) {
    throw new AppError('Not authorized to delete campaigns', 403);
  }

  await Campaign.findByIdAndDelete(id);

  logger.info(`Campaign deleted: ${id} by ${user.email}`);

  res.json({
    success: true,
    message: 'Campaign deleted successfully'
  });
});

// Add post to campaign
export const addPostToCampaign = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user;
  
  if (!user) {
    throw new AppError('Not authenticated', 401);
  }

  const { id } = req.params;
  const { postId } = req.body;

  const campaign = await Campaign.findById(id);
  
  if (!campaign) {
    throw new AppError('Campaign not found', 404);
  }

  if (campaign.posts.includes(postId as any)) {
    throw new AppError('Post already in campaign', 400);
  }

  campaign.posts.push(postId);
  await campaign.save();

  const updatedCampaign = await Campaign.findById(id)
    .populate('posts', 'title platform status');

  logger.info(`Post ${postId} added to campaign ${id} by ${user.email}`);

  res.json({
    success: true,
    message: 'Post added to campaign successfully',
    data: updatedCampaign
  });
});

// Add lead to campaign
export const addLeadToCampaign = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user;
  
  if (!user) {
    throw new AppError('Not authenticated', 401);
  }

  const { id } = req.params;
  const { leadId } = req.body;

  const campaign = await Campaign.findById(id);
  
  if (!campaign) {
    throw new AppError('Campaign not found', 404);
  }

  if (campaign.leads.includes(leadId as any)) {
    throw new AppError('Lead already in campaign', 400);
  }

  campaign.leads.push(leadId);
  await campaign.save();

  const updatedCampaign = await Campaign.findById(id)
    .populate('leads', 'firstName lastName email status');

  logger.info(`Lead ${leadId} added to campaign ${id} by ${user.email}`);

  res.json({
    success: true,
    message: 'Lead added to campaign successfully',
    data: updatedCampaign
  });
});

// Update campaign status
export const updateCampaignStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user;
  
  if (!user) {
    throw new AppError('Not authenticated', 401);
  }

  const { id } = req.params;
  const { status } = req.body;

  const campaign = await Campaign.findByIdAndUpdate(
    id,
    { status },
    { new: true, runValidators: true }
  );

  if (!campaign) {
    throw new AppError('Campaign not found', 404);
  }

  logger.info(`Campaign ${id} status updated to ${status} by ${user.email}`);

  res.json({
    success: true,
    message: 'Campaign status updated successfully',
    data: campaign
  });
});

// Update campaign metrics
export const updateCampaignMetrics = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user;
  
  if (!user) {
    throw new AppError('Not authenticated', 401);
  }

  const { id } = req.params;
  const { metrics } = req.body;

  const campaign = await Campaign.findById(id);
  
  if (!campaign) {
    throw new AppError('Campaign not found', 404);
  }

  // Update metrics
  if (metrics) {
    Object.keys(metrics).forEach(key => {
      if (campaign.performanceMetrics[key] !== undefined) {
        campaign.performanceMetrics[key] = metrics[key];
      }
    });
  }

  await campaign.save();

  logger.info(`Campaign ${id} metrics updated by ${user.email}`);

  res.json({
    success: true,
    message: 'Campaign metrics updated successfully',
    data: campaign
  });
});
