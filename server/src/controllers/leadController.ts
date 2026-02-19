import { Response } from 'express';
import { AuthRequest } from '../types';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { Lead } from '../models';
import { logger } from '../utils/logger';

// Get all leads with filtering
export const getLeads = asyncHandler(async (req: AuthRequest, res: Response) => {
  const {
    page = 1,
    limit = 20,
    status,
    source,
    assignedTo,
    search,
    minScore,
    maxScore,
    tags,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  const query: any = {};

  if (status) query.status = status;
  if (source) query.source = source;
  if (assignedTo) query.assignedTo = assignedTo;
  if (minScore !== undefined || maxScore !== undefined) {
    query.score = {};
    if (minScore !== undefined) query.score.$gte = Number(minScore);
    if (maxScore !== undefined) query.score.$lte = Number(maxScore);
  }
  if (tags) {
    const tagArray = Array.isArray(tags) ? tags : [tags];
    query.tags = { $in: tagArray };
  }
  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { company: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const sort: any = {};
  sort[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

  const [leads, total] = await Promise.all([
    Lead.find(query)
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .populate('assignedTo', 'firstName lastName avatar'),
    Lead.countDocuments(query)
  ]);

  res.json({
    success: true,
    data: leads,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    }
  });
});

// Get single lead
export const getLead = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const lead = await Lead.findById(id)
    .populate('assignedTo', 'firstName lastName avatar email phone')
    .populate('activities.createdBy', 'firstName lastName avatar');

  if (!lead) {
    throw new AppError('Lead not found', 404);
  }

  res.json({
    success: true,
    data: lead
  });
});

// Create lead
export const createLead = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user;
  
  if (!user) {
    throw new AppError('Not authenticated', 401);
  }

  const {
    email,
    phone,
    firstName,
    lastName,
    company,
    jobTitle,
    source,
    customFields,
    tags,
    notes
  } = req.body;

  // Check if lead with email already exists
  const existingLead = await Lead.findOne({ email });
  if (existingLead) {
    throw new AppError('Lead with this email already exists', 409);
  }

  const lead = await Lead.create({
    email,
    phone,
    firstName,
    lastName,
    company,
    jobTitle,
    source: source || 'OTHER',
    customFields: customFields || {},
    tags: tags || [],
    notes: notes || ''
  });

  // Emit real-time notification
  const io = req.app.get('io');
  io.to('SALES_TEAM').emit('lead:new', {
    leadId: lead._id,
    name: lead.fullName,
    email: lead.email,
    source: lead.source
  });

  logger.info(`Lead created: ${lead._id} by ${user.email}`);

  res.status(201).json({
    success: true,
    message: 'Lead created successfully',
    data: lead
  });
});

// Update lead
export const updateLead = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user;
  
  if (!user) {
    throw new AppError('Not authenticated', 401);
  }

  const { id } = req.params;
  const updateData = req.body;

  const lead = await Lead.findById(id);
  
  if (!lead) {
    throw new AppError('Lead not found', 404);
  }

  const allowedUpdates = ['firstName', 'lastName', 'phone', 'company', 'jobTitle', 'source', 'status', 'customFields', 'tags', 'notes'];
  const updates: any = {};

  allowedUpdates.forEach(field => {
    if (updateData[field] !== undefined) {
      updates[field] = updateData[field];
    }
  });

  const updatedLead = await Lead.findByIdAndUpdate(
    id,
    updates,
    { new: true, runValidators: true }
  ).populate('assignedTo', 'firstName lastName avatar');

  logger.info(`Lead updated: ${id} by ${user.email}`);

  res.json({
    success: true,
    message: 'Lead updated successfully',
    data: updatedLead
  });
});

// Delete lead
export const deleteLead = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user;
  
  if (!user) {
    throw new AppError('Not authenticated', 401);
  }

  const { id } = req.params;

  const lead = await Lead.findById(id);
  
  if (!lead) {
    throw new AppError('Lead not found', 404);
  }

  // Only admin or marketing head can delete leads
  if (!['SUPER_ADMIN', 'MARKETING_HEAD'].includes(user.role)) {
    throw new AppError('Not authorized to delete leads', 403);
  }

  await Lead.findByIdAndDelete(id);

  logger.info(`Lead deleted: ${id} by ${user.email}`);

  res.json({
    success: true,
    message: 'Lead deleted successfully'
  });
});

// Assign lead to user
export const assignLead = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user;
  
  if (!user) {
    throw new AppError('Not authenticated', 401);
  }

  const { id } = req.params;
  const { userId } = req.body;

  const lead = await Lead.findById(id);
  
  if (!lead) {
    throw new AppError('Lead not found', 404);
  }

  lead.assignedTo = userId;
  await lead.save();

  const populatedLead = await Lead.findById(id)
    .populate('assignedTo', 'firstName lastName avatar email');

  logger.info(`Lead ${id} assigned to ${userId} by ${user.email}`);

  res.json({
    success: true,
    message: 'Lead assigned successfully',
    data: populatedLead
  });
});

// Update lead status
export const updateLeadStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user;
  
  if (!user) {
    throw new AppError('Not authenticated', 401);
  }

  const { id } = req.params;
  const { status } = req.body;

  const lead = await Lead.findById(id);
  
  if (!lead) {
    throw new AppError('Lead not found', 404);
  }

  lead.status = status;
  
  if (status === 'CONTACTED' || status === 'ENGAGED') {
    lead.lastContactedAt = new Date();
  }
  
  await lead.save();

  logger.info(`Lead ${id} status updated to ${status} by ${user.email}`);

  res.json({
    success: true,
    message: 'Lead status updated successfully',
    data: lead
  });
});

// Update lead score
export const updateLeadScore = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user;
  
  if (!user) {
    throw new AppError('Not authenticated', 401);
  }

  const { id } = req.params;
  const { score } = req.body;

  if (score < 0 || score > 100) {
    throw new AppError('Score must be between 0 and 100', 400);
  }

  const lead = await Lead.findByIdAndUpdate(
    id,
    { score },
    { new: true, runValidators: true }
  );

  if (!lead) {
    throw new AppError('Lead not found', 404);
  }

  logger.info(`Lead ${id} score updated to ${score} by ${user.email}`);

  res.json({
    success: true,
    message: 'Lead score updated successfully',
    data: lead
  });
});

// Add activity to lead
export const addActivity = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user;
  
  if (!user) {
    throw new AppError('Not authenticated', 401);
  }

  const { id } = req.params;
  const { type, description } = req.body;

  const lead = await Lead.findById(id);
  
  if (!lead) {
    throw new AppError('Lead not found', 404);
  }

  lead.activities.push({
    type,
    description,
    createdBy: user._id,
    createdAt: new Date()
  } as any);

  if (type === 'CALL' || type === 'EMAIL' || type === 'MEETING') {
    lead.lastContactedAt = new Date();
  }

  await lead.save();

  const populatedLead = await Lead.findById(id)
    .populate('activities.createdBy', 'firstName lastName avatar');

  logger.info(`Activity added to lead ${id} by ${user.email}`);

  res.json({
    success: true,
    message: 'Activity added successfully',
    data: populatedLead
  });
});

// Bulk import leads
export const bulkImportLeads = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user;
  
  if (!user) {
    throw new AppError('Not authenticated', 401);
  }

  const { leads } = req.body;

  if (!Array.isArray(leads) || leads.length === 0) {
    throw new AppError('Leads array is required', 400);
  }

  const results = {
    success: 0,
    failed: 0,
    errors: [] as any[]
  };

  for (const leadData of leads) {
    try {
      // Check for existing lead
      const existing = await Lead.findOne({ email: leadData.email });
      if (existing) {
        results.failed++;
        results.errors.push({ email: leadData.email, error: 'Lead already exists' });
        continue;
      }

      await Lead.create({
        ...leadData,
        source: leadData.source || 'OTHER'
      });
      results.success++;
    } catch (error: any) {
      results.failed++;
      results.errors.push({ email: leadData.email, error: error.message });
    }
  }

  logger.info(`Bulk import completed: ${results.success} success, ${results.failed} failed by ${user.email}`);

  res.json({
    success: true,
    message: `Imported ${results.success} leads successfully`,
    data: results
  });
});
