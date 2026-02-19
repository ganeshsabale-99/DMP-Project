import { Response } from 'express';
import { AuthRequest } from '../types';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { User } from '../models';
import { logger } from '../utils/logger';

// Get all users
export const getUsers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const {
    page = 1,
    limit = 20,
    role,
    status,
    search,
    department,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  const query: any = {};

  if (role) query.role = role;
  if (status) query.status = status;
  if (department) query.department = department;
  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const sort: any = {};
  sort[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

  const [users, total] = await Promise.all([
    User.find(query)
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .select('-password'),
    User.countDocuments(query)
  ]);

  res.json({
    success: true,
    data: users,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    }
  });
});

// Get single user
export const getUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const user = await User.findById(id).select('-password');

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json({
    success: true,
    data: user
  });
});

// Create user (admin only)
export const createUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const currentUser = req.user;
  
  if (!currentUser) {
    throw new AppError('Not authenticated', 401);
  }

  // Only admin can create users
  if (!['SUPER_ADMIN', 'MARKETING_HEAD'].includes(currentUser.role)) {
    throw new AppError('Not authorized to create users', 403);
  }

  const {
    email,
    password,
    firstName,
    lastName,
    role,
    department,
    phone,
    timezone
  } = req.body;

  // Check if user exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError('User already exists with this email', 409);
  }

  const user = await User.create({
    email,
    password,
    firstName,
    lastName,
    role: role || 'DM_EXECUTIVE',
    department,
    phone,
    timezone: timezone || 'UTC'
  });

  logger.info(`User created: ${email} by ${currentUser.email}`);

  res.status(201).json({
    success: true,
    message: 'User created successfully',
    data: {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      fullName: user.fullName
    }
  });
});

// Update user
export const updateUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const currentUser = req.user;
  
  if (!currentUser) {
    throw new AppError('Not authenticated', 401);
  }

  const { id } = req.params;
  const updateData = req.body;

  // Users can only update themselves unless they're admin
  if (currentUser._id.toString() !== id && 
      !['SUPER_ADMIN', 'MARKETING_HEAD'].includes(currentUser.role)) {
    throw new AppError('Not authorized to update this user', 403);
  }

  const user = await User.findById(id);
  
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Only admin can update role and status
  const allowedUpdates = ['firstName', 'lastName', 'phone', 'department', 'timezone', 'preferences'];
  
  if (['SUPER_ADMIN', 'MARKETING_HEAD'].includes(currentUser.role)) {
    allowedUpdates.push('role', 'status');
  }

  const updates: any = {};

  allowedUpdates.forEach(field => {
    if (updateData[field] !== undefined) {
      updates[field] = updateData[field];
    }
  });

  const updatedUser = await User.findByIdAndUpdate(
    id,
    updates,
    { new: true, runValidators: true }
  ).select('-password');

  logger.info(`User updated: ${id} by ${currentUser.email}`);

  res.json({
    success: true,
    message: 'User updated successfully',
    data: updatedUser
  });
});

// Delete user
export const deleteUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const currentUser = req.user;
  
  if (!currentUser) {
    throw new AppError('Not authenticated', 401);
  }

  // Only admin can delete users
  if (!['SUPER_ADMIN'].includes(currentUser.role)) {
    throw new AppError('Not authorized to delete users', 403);
  }

  const { id } = req.params;

  // Prevent self-deletion
  if (currentUser._id.toString() === id) {
    throw new AppError('Cannot delete your own account', 400);
  }

  const user = await User.findById(id);
  
  if (!user) {
    throw new AppError('User not found', 404);
  }

  await User.findByIdAndDelete(id);

  logger.info(`User deleted: ${id} by ${currentUser.email}`);

  res.json({
    success: true,
    message: 'User deleted successfully'
  });
});

// Update user status
export const updateUserStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const currentUser = req.user;
  
  if (!currentUser) {
    throw new AppError('Not authenticated', 401);
  }

  // Only admin can update status
  if (!['SUPER_ADMIN', 'MARKETING_HEAD'].includes(currentUser.role)) {
    throw new AppError('Not authorized to update user status', 403);
  }

  const { id } = req.params;
  const { status } = req.body;

  const user = await User.findByIdAndUpdate(
    id,
    { status },
    { new: true, runValidators: true }
  ).select('-password');

  if (!user) {
    throw new AppError('User not found', 404);
  }

  logger.info(`User ${id} status updated to ${status} by ${currentUser.email}`);

  res.json({
    success: true,
    message: 'User status updated successfully',
    data: user
  });
});

// Get user stats
export const getUserStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const currentUser = req.user;
  
  if (!currentUser) {
    throw new AppError('Not authenticated', 401);
  }

  const [
    totalUsers,
    byRole,
    byStatus,
    recentUsers
  ] = await Promise.all([
    User.countDocuments(),
    User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
    User.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('firstName lastName email role createdAt')
  ]);

  res.json({
    success: true,
    data: {
      totalUsers,
      byRole,
      byStatus,
      recentUsers
    }
  });
});
