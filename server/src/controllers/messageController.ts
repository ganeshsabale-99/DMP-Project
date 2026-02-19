import { Response } from 'express';
import { AuthRequest } from '../types';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { Message } from '../models';
import { logger } from '../utils/logger';

// Get all messages
export const getMessages = asyncHandler(async (req: AuthRequest, res: Response) => {
  const {
    page = 1,
    limit = 20,
    channel,
    status,
    assignedTo,
    sentiment,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  const query: any = {};

  if (channel) query.channel = channel;
  if (status) query.status = status;
  if (assignedTo) query.assignedTo = assignedTo;
  if (sentiment) query.sentiment = sentiment;
  if (search) {
    query.$or = [
      { 'sender.name': { $regex: search, $options: 'i' } },
      { 'sender.email': { $regex: search, $options: 'i' } },
      { content: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const sort: any = {};
  sort[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

  const [messages, total] = await Promise.all([
    Message.find(query)
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .populate('assignedTo', 'firstName lastName avatar'),
    Message.countDocuments(query)
  ]);

  res.json({
    success: true,
    data: messages,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    }
  });
});

// Get single message
export const getMessage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const message = await Message.findById(id)
    .populate('assignedTo', 'firstName lastName avatar email');

  if (!message) {
    throw new AppError('Message not found', 404);
  }

  res.json({
    success: true,
    data: message
  });
});

// Create message
export const createMessage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user;
  
  if (!user) {
    throw new AppError('Not authenticated', 401);
  }

  const {
    channel,
    sender,
    content,
    attachments,
    tags
  } = req.body;

  // Analyze sentiment (simulated)
  const sentiment = analyzeSentiment(content);

  const message = await Message.create({
    channel,
    sender,
    content,
    attachments: attachments || [],
    tags: tags || [],
    sentiment,
    status: 'UNREAD'
  });

  // Emit real-time notification
  const io = req.app.get('io');
  io.to('SALES_TEAM').emit('message:received', {
    messageId: message._id,
    channel: message.channel,
    sender: message.sender.name,
    preview: content.substring(0, 100)
  });

  logger.info(`Message created via ${channel} by ${user.email}`);

  res.status(201).json({
    success: true,
    message: 'Message created successfully',
    data: message
  });
});

// Update message
export const updateMessage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user;
  
  if (!user) {
    throw new AppError('Not authenticated', 401);
  }

  const { id } = req.params;
  const updateData = req.body;

  const message = await Message.findById(id);
  
  if (!message) {
    throw new AppError('Message not found', 404);
  }

  const allowedUpdates = ['status', 'assignedTo', 'tags'];
  const updates: any = {};

  allowedUpdates.forEach(field => {
    if (updateData[field] !== undefined) {
      updates[field] = updateData[field];
    }
  });

  const updatedMessage = await Message.findByIdAndUpdate(
    id,
    updates,
    { new: true, runValidators: true }
  ).populate('assignedTo', 'firstName lastName avatar');

  logger.info(`Message updated: ${id} by ${user.email}`);

  res.json({
    success: true,
    message: 'Message updated successfully',
    data: updatedMessage
  });
});

// Delete message
export const deleteMessage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user;
  
  if (!user) {
    throw new AppError('Not authenticated', 401);
  }

  const { id } = req.params;

  const message = await Message.findById(id);
  
  if (!message) {
    throw new AppError('Message not found', 404);
  }

  // Only admin can delete messages
  if (!['SUPER_ADMIN', 'MARKETING_HEAD'].includes(user.role)) {
    throw new AppError('Not authorized to delete messages', 403);
  }

  await Message.findByIdAndDelete(id);

  logger.info(`Message deleted: ${id} by ${user.email}`);

  res.json({
    success: true,
    message: 'Message deleted successfully'
  });
});

// Mark as read
export const markAsRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user;
  
  if (!user) {
    throw new AppError('Not authenticated', 401);
  }

  const { id } = req.params;

  const message = await Message.findByIdAndUpdate(
    id,
    { status: 'READ' },
    { new: true }
  );

  if (!message) {
    throw new AppError('Message not found', 404);
  }

  res.json({
    success: true,
    message: 'Message marked as read',
    data: message
  });
});

// Reply to message
export const replyToMessage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user;
  
  if (!user) {
    throw new AppError('Not authenticated', 401);
  }

  const { id } = req.params;
  const { reply } = req.body;

  const message = await Message.findById(id);
  
  if (!message) {
    throw new AppError('Message not found', 404);
  }

  message.status = 'REPLIED';
  await message.save();

  // In production, this would send the reply via the appropriate channel
  logger.info(`Reply sent to message ${id} by ${user.email}`);

  res.json({
    success: true,
    message: 'Reply sent successfully',
    data: {
      message,
      reply
    }
  });
});

// Assign message
export const assignMessage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user;
  
  if (!user) {
    throw new AppError('Not authenticated', 401);
  }

  const { id } = req.params;
  const { userId } = req.body;

  const message = await Message.findByIdAndUpdate(
    id,
    { assignedTo: userId },
    { new: true }
  ).populate('assignedTo', 'firstName lastName avatar email');

  if (!message) {
    throw new AppError('Message not found', 404);
  }

  logger.info(`Message ${id} assigned to ${userId} by ${user.email}`);

  res.json({
    success: true,
    message: 'Message assigned successfully',
    data: message
  });
});

// Get message stats
export const getMessageStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user;
  
  if (!user) {
    throw new AppError('Not authenticated', 401);
  }

  const [
    totalMessages,
    unreadMessages,
    byChannel,
    bySentiment,
    byStatus
  ] = await Promise.all([
    Message.countDocuments(),
    Message.countDocuments({ status: 'UNREAD' }),
    Message.aggregate([{ $group: { _id: '$channel', count: { $sum: 1 } } }]),
    Message.aggregate([{ $group: { _id: '$sentiment', count: { $sum: 1 } } }]),
    Message.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }])
  ]);

  res.json({
    success: true,
    data: {
      totalMessages,
      unreadMessages,
      byChannel,
      bySentiment,
      byStatus
    }
  });
});

// Helper function to analyze sentiment
function analyzeSentiment(text: string): 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' {
  const positiveWords = ['good', 'great', 'excellent', 'amazing', 'love', 'best', 'happy', 'thanks', 'awesome', 'fantastic'];
  const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'worst', 'angry', 'disappointed', 'problem', 'issue', 'error'];
  
  const lowerText = text.toLowerCase();
  let positiveCount = 0;
  let negativeCount = 0;
  
  positiveWords.forEach(word => {
    if (lowerText.includes(word)) positiveCount++;
  });
  
  negativeWords.forEach(word => {
    if (lowerText.includes(word)) negativeCount++;
  });
  
  if (positiveCount > negativeCount) return 'POSITIVE';
  if (negativeCount > positiveCount) return 'NEGATIVE';
  return 'NEUTRAL';
}
