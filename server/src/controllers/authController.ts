import { Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models';
import { AuthRequest } from '../types';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '15m';
const REFRESH_TOKEN_EXPIRES_IN = '7d';

// Generate tokens
const generateTokens = (userId: string, email: string, role: string) => {
  const accessToken = jwt.sign(
    { userId, email, role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
  );

  return { accessToken, refreshToken };
};

// Register new user
export const register = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email, password, firstName, lastName, role, department, phone } = req.body;

  // Check if user exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError('User already exists with this email', 409);
  }

  // Create user
  const user = await User.create({
    email,
    password,
    firstName,
    lastName,
    role: role || 'DM_EXECUTIVE',
    department,
    phone
  });

  const { accessToken, refreshToken } = generateTokens(
    user._id.toString(),
    user.email,
    user.role
  );

  logger.info(`New user registered: ${email}`);

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        fullName: user.fullName
      },
      accessToken,
      refreshToken
    }
  });
});

// Login user
export const login = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email, password } = req.body;

  // Find user with password
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }

  // Check password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new AppError('Invalid credentials', 401);
  }

  // Check if user is active
  if (user.status !== 'ACTIVE') {
    throw new AppError('Account is inactive or suspended', 403);
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  const { accessToken, refreshToken } = generateTokens(
    user._id.toString(),
    user.email,
    user.role
  );

  logger.info(`User logged in: ${email}`);

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatar: user.avatar,
        fullName: user.fullName,
        preferences: user.preferences
      },
      accessToken,
      refreshToken
    }
  });
});

// Refresh token
export const refreshToken = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new AppError('Refresh token is required', 400);
  }

  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET) as { userId: string; type: string };
    
    if (decoded.type !== 'refresh') {
      throw new AppError('Invalid token type', 401);
    }

    const user = await User.findById(decoded.userId);
    if (!user || user.status !== 'ACTIVE') {
      throw new AppError('User not found or inactive', 401);
    }

    const tokens = generateTokens(user._id.toString(), user.email, user.role);

    res.json({
      success: true,
      data: tokens
    });
  } catch (error) {
    throw new AppError('Invalid or expired refresh token', 401);
  }
});

// Get current user
export const getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user;
  
  if (!user) {
    throw new AppError('Not authenticated', 401);
  }

  res.json({
    success: true,
    data: {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      avatar: user.avatar,
      department: user.department,
      phone: user.phone,
      timezone: user.timezone,
      preferences: user.preferences,
      fullName: user.fullName,
      lastLogin: user.lastLogin
    }
  });
});

// Update profile
export const updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user;
  
  if (!user) {
    throw new AppError('Not authenticated', 401);
  }

  const allowedUpdates = ['firstName', 'lastName', 'phone', 'department', 'timezone', 'preferences'];
  const updates: any = {};

  allowedUpdates.forEach(field => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  const updatedUser = await User.findByIdAndUpdate(
    user._id,
    updates,
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      id: updatedUser!._id,
      email: updatedUser!.email,
      firstName: updatedUser!.firstName,
      lastName: updatedUser!.lastName,
      role: updatedUser!.role,
      avatar: updatedUser!.avatar,
      department: updatedUser!.department,
      phone: updatedUser!.phone,
      timezone: updatedUser!.timezone,
      preferences: updatedUser!.preferences,
      fullName: updatedUser!.fullName
    }
  });
});

// Change password
export const changePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user;
  
  if (!user) {
    throw new AppError('Not authenticated', 401);
  }

  const { currentPassword, newPassword } = req.body;

  const userWithPassword = await User.findById(user._id).select('+password');
  const isPasswordValid = await userWithPassword!.comparePassword(currentPassword);

  if (!isPasswordValid) {
    throw new AppError('Current password is incorrect', 400);
  }

  userWithPassword!.password = newPassword;
  await userWithPassword!.save();

  logger.info(`Password changed for user: ${user.email}`);

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
});

// Logout
export const logout = asyncHandler(async (req: AuthRequest, res: Response) => {
  // In a more complex implementation, you might want to blacklist the token
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});
