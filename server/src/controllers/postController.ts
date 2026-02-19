import { Response } from 'express';
import { AuthRequest } from '../types';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { Post } from '../models';
import { logger } from '../utils/logger';

// Get all posts with filtering
export const getPosts = asyncHandler(async (req: AuthRequest, res: Response) => {
  const {
    page = 1,
    limit = 20,
    status,
    platform,
    search,
    startDate,
    endDate,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  const query: any = {};

  if (status) query.status = status;
  if (platform) query.platform = platform;
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { content: { $regex: search, $options: 'i' } }
    ];
  }
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate as string);
    if (endDate) query.createdAt.$lte = new Date(endDate as string);
  }

  const skip = (Number(page) - 1) * Number(limit);
  const sort: any = {};
  sort[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

  const [posts, total] = await Promise.all([
    Post.find(query)
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .populate('createdBy', 'firstName lastName avatar')
      .populate('approvedBy', 'firstName lastName'),
    Post.countDocuments(query)
  ]);

  res.json({
    success: true,
    data: posts,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    }
  });
});

// Get single post
export const getPost = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const post = await Post.findById(id)
    .populate('createdBy', 'firstName lastName avatar')
    .populate('approvedBy', 'firstName lastName')
    .populate('campaign', 'name');

  if (!post) {
    throw new AppError('Post not found', 404);
  }

  res.json({
    success: true,
    data: post
  });
});

// Create post
export const createPost = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user;
  
  if (!user) {
    throw new AppError('Not authenticated', 401);
  }

  const {
    title,
    content,
    platform,
    scheduledAt,
    mediaUrls,
    hashtags,
    mentions,
    campaign
  } = req.body;

  const post = await Post.create({
    title,
    content,
    platform,
    scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
    createdBy: user._id,
    mediaUrls: mediaUrls || [],
    hashtags: hashtags || [],
    mentions: mentions || [],
    campaign: campaign || null,
    status: scheduledAt ? 'SCHEDULED' : 'DRAFT'
  });

  const populatedPost = await Post.findById(post._id)
    .populate('createdBy', 'firstName lastName avatar');

  logger.info(`Post created: ${post._id} by ${user.email}`);

  res.status(201).json({
    success: true,
    message: 'Post created successfully',
    data: populatedPost
  });
});

// Update post
export const updatePost = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user;
  
  if (!user) {
    throw new AppError('Not authenticated', 401);
  }

  const { id } = req.params;
  const updateData = req.body;

  const post = await Post.findById(id);
  
  if (!post) {
    throw new AppError('Post not found', 404);
  }

  // Check if user can update this post
  if (post.createdBy.toString() !== user._id.toString() && 
      !['SUPER_ADMIN', 'MARKETING_HEAD'].includes(user.role)) {
    throw new AppError('Not authorized to update this post', 403);
  }

  // Prevent updating published posts
  if (post.status === 'PUBLISHED') {
    throw new AppError('Cannot update published posts', 400);
  }

  const allowedUpdates = ['title', 'content', 'platform', 'scheduledAt', 'mediaUrls', 'hashtags', 'mentions', 'campaign'];
  const updates: any = {};

  allowedUpdates.forEach(field => {
    if (updateData[field] !== undefined) {
      updates[field] = updateData[field];
    }
  });

  if (updateData.scheduledAt) {
    updates.scheduledAt = new Date(updateData.scheduledAt);
    updates.status = 'SCHEDULED';
  }

  const updatedPost = await Post.findByIdAndUpdate(
    id,
    updates,
    { new: true, runValidators: true }
  )
    .populate('createdBy', 'firstName lastName avatar')
    .populate('approvedBy', 'firstName lastName');

  logger.info(`Post updated: ${id} by ${user.email}`);

  res.json({
    success: true,
    message: 'Post updated successfully',
    data: updatedPost
  });
});

// Delete post
export const deletePost = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user;
  
  if (!user) {
    throw new AppError('Not authenticated', 401);
  }

  const { id } = req.params;

  const post = await Post.findById(id);
  
  if (!post) {
    throw new AppError('Post not found', 404);
  }

  // Check if user can delete this post
  if (post.createdBy.toString() !== user._id.toString() && 
      !['SUPER_ADMIN', 'MARKETING_HEAD'].includes(user.role)) {
    throw new AppError('Not authorized to delete this post', 403);
  }

  await Post.findByIdAndDelete(id);

  logger.info(`Post deleted: ${id} by ${user.email}`);

  res.json({
    success: true,
    message: 'Post deleted successfully'
  });
});

// Submit for approval
export const submitForApproval = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user;
  
  if (!user) {
    throw new AppError('Not authenticated', 401);
  }

  const { id } = req.params;

  const post = await Post.findById(id);
  
  if (!post) {
    throw new AppError('Post not found', 404);
  }

  if (post.status !== 'DRAFT') {
    throw new AppError('Only draft posts can be submitted for approval', 400);
  }

  post.status = 'PENDING_APPROVAL';
  await post.save();

  // Emit real-time notification
  const io = req.app.get('io');
  io.to('MARKETING_HEAD').emit('post:pending_approval', {
    postId: post._id,
    title: post.title,
    submittedBy: user.fullName
  });

  logger.info(`Post submitted for approval: ${id}`);

  res.json({
    success: true,
    message: 'Post submitted for approval',
    data: post
  });
});

// Approve post
export const approvePost = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user;
  
  if (!user) {
    throw new AppError('Not authenticated', 401);
  }

  const { id } = req.params;

  const post = await Post.findById(id);
  
  if (!post) {
    throw new AppError('Post not found', 404);
  }

  if (post.status !== 'PENDING_APPROVAL') {
    throw new AppError('Post is not pending approval', 400);
  }

  post.status = 'SCHEDULED';
  post.approvedBy = user._id;
  await post.save();

  logger.info(`Post approved: ${id} by ${user.email}`);

  res.json({
    success: true,
    message: 'Post approved successfully',
    data: post
  });
});

// Publish post (simulated)
export const publishPost = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user;
  
  if (!user) {
    throw new AppError('Not authenticated', 401);
  }

  const { id } = req.params;

  const post = await Post.findById(id);
  
  if (!post) {
    throw new AppError('Post not found', 404);
  }

  if (post.status !== 'SCHEDULED') {
    throw new AppError('Only scheduled posts can be published', 400);
  }

  // Simulate publishing to platform
  post.status = 'PUBLISHED';
  post.publishedAt = new Date();
  await post.save();

  // Emit real-time notification
  const io = req.app.get('io');
  io.to(post.createdBy.toString()).emit('post:published', {
    postId: post._id,
    title: post.title,
    platform: post.platform
  });

  logger.info(`Post published: ${id} to ${post.platform}`);

  res.json({
    success: true,
    message: `Post published to ${post.platform}`,
    data: post
  });
});

// Get content calendar
export const getCalendar = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { year, month } = req.query;
  
  const now = new Date();
  const targetYear = year ? Number(year) : now.getFullYear();
  const targetMonth = month ? Number(month) - 1 : now.getMonth();
  
  const startOfMonth = new Date(targetYear, targetMonth, 1);
  const endOfMonth = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);

  const posts = await Post.find({
    $or: [
      { scheduledAt: { $gte: startOfMonth, $lte: endOfMonth } },
      { createdAt: { $gte: startOfMonth, $lte: endOfMonth } }
    ]
  })
    .select('title platform status scheduledAt createdAt')
    .populate('createdBy', 'firstName lastName')
    .sort({ scheduledAt: 1 });

  // Group by date
  const calendarData: Record<string, any[]> = {};
  
  posts.forEach(post => {
    const date = post.scheduledAt || post.createdAt;
    const dateKey = date.toISOString().split('T')[0];
    
    if (!calendarData[dateKey]) {
      calendarData[dateKey] = [];
    }
    
    calendarData[dateKey].push(post);
  });

  res.json({
    success: true,
    data: {
      month: targetMonth + 1,
      year: targetYear,
      calendar: calendarData
    }
  });
});
