import { Response } from 'express';
import { AuthRequest } from '../types';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { SEOPage } from '../models';
import { logger } from '../utils/logger';

// Get all SEO pages
export const getPages = asyncHandler(async (req: AuthRequest, res: Response) => {
  const {
    page = 1,
    limit = 20,
    search,
    minSeoScore,
    maxSeoScore,
    sortBy = 'updatedAt',
    sortOrder = 'desc'
  } = req.query;

  const query: any = {};

  if (search) {
    query.$or = [
      { url: { $regex: search, $options: 'i' } },
      { title: { $regex: search, $options: 'i' } },
      { metaDescription: { $regex: search, $options: 'i' } }
    ];
  }

  if (minSeoScore !== undefined || maxSeoScore !== undefined) {
    query.seoScore = {};
    if (minSeoScore !== undefined) query.seoScore.$gte = Number(minSeoScore);
    if (maxSeoScore !== undefined) query.seoScore.$lte = Number(maxSeoScore);
  }

  const skip = (Number(page) - 1) * Number(limit);
  const sort: any = {};
  sort[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

  const [pages, total] = await Promise.all([
    SEOPage.find(query)
      .sort(sort)
      .skip(skip)
      .limit(Number(limit)),
    SEOPage.countDocuments(query)
  ]);

  res.json({
    success: true,
    data: pages,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    }
  });
});

// Get single SEO page
export const getPage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const page = await SEOPage.findById(id);

  if (!page) {
    throw new AppError('Page not found', 404);
  }

  res.json({
    success: true,
    data: page
  });
});

// Create SEO page
export const createPage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user;
  
  if (!user) {
    throw new AppError('Not authenticated', 401);
  }

  const {
    url,
    title,
    metaDescription,
    metaKeywords,
    ogTitle,
    ogDescription,
    ogImage,
    schemaMarkup
  } = req.body;

  // Check if page with URL already exists
  const existingPage = await SEOPage.findOne({ url });
  if (existingPage) {
    throw new AppError('Page with this URL already exists', 409);
  }

  // Calculate initial scores
  const seoScore = calculateSEOScore(title, metaDescription, metaKeywords);
  const readabilityScore = calculateReadabilityScore(metaDescription);

  const page = await SEOPage.create({
    url,
    title,
    metaDescription,
    metaKeywords: metaKeywords || [],
    ogTitle: ogTitle || title,
    ogDescription: ogDescription || metaDescription,
    ogImage,
    schemaMarkup: schemaMarkup || {},
    seoScore,
    readabilityScore,
    contentScore: Math.floor((seoScore + readabilityScore) / 2),
    lastAnalyzedAt: new Date()
  });

  logger.info(`SEO page created: ${url} by ${user.email}`);

  res.status(201).json({
    success: true,
    message: 'SEO page created successfully',
    data: page
  });
});

// Update SEO page
export const updatePage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user;
  
  if (!user) {
    throw new AppError('Not authenticated', 401);
  }

  const { id } = req.params;
  const updateData = req.body;

  const page = await SEOPage.findById(id);
  
  if (!page) {
    throw new AppError('Page not found', 404);
  }

  const allowedUpdates = ['title', 'metaDescription', 'metaKeywords', 'ogTitle', 'ogDescription', 'ogImage', 'schemaMarkup'];
  const updates: any = {};

  allowedUpdates.forEach(field => {
    if (updateData[field] !== undefined) {
      updates[field] = updateData[field];
    }
  });

  // Recalculate scores if relevant fields changed
  if (updates.title || updates.metaDescription || updates.metaKeywords) {
    updates.seoScore = calculateSEOScore(
      updates.title || page.title,
      updates.metaDescription || page.metaDescription,
      updates.metaKeywords || page.metaKeywords
    );
    updates.readabilityScore = calculateReadabilityScore(
      updates.metaDescription || page.metaDescription
    );
    updates.contentScore = Math.floor((updates.seoScore + updates.readabilityScore) / 2);
    updates.lastAnalyzedAt = new Date();
  }

  const updatedPage = await SEOPage.findByIdAndUpdate(
    id,
    updates,
    { new: true, runValidators: true }
  );

  logger.info(`SEO page updated: ${id} by ${user.email}`);

  res.json({
    success: true,
    message: 'SEO page updated successfully',
    data: updatedPage
  });
});

// Delete SEO page
export const deletePage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user;
  
  if (!user) {
    throw new AppError('Not authenticated', 401);
  }

  const { id } = req.params;

  const page = await SEOPage.findById(id);
  
  if (!page) {
    throw new AppError('Page not found', 404);
  }

  // Only admin or marketing head can delete pages
  if (!['SUPER_ADMIN', 'MARKETING_HEAD'].includes(user.role)) {
    throw new AppError('Not authorized to delete SEO pages', 403);
  }

  await SEOPage.findByIdAndDelete(id);

  logger.info(`SEO page deleted: ${id} by ${user.email}`);

  res.json({
    success: true,
    message: 'SEO page deleted successfully'
  });
});

// Analyze page
export const analyzePage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user;
  
  if (!user) {
    throw new AppError('Not authenticated', 401);
  }

  const { id } = req.params;

  const page = await SEOPage.findById(id);
  
  if (!page) {
    throw new AppError('Page not found', 404);
  }

  // Recalculate scores
  const seoScore = calculateSEOScore(page.title, page.metaDescription, page.metaKeywords);
  const readabilityScore = calculateReadabilityScore(page.metaDescription);
  const contentScore = Math.floor((seoScore + readabilityScore) / 2);

  // Generate suggestions
  const suggestions = generateSEOSuggestions(page);

  // Update page with new scores
  page.seoScore = seoScore;
  page.readabilityScore = readabilityScore;
  page.contentScore = contentScore;
  page.lastAnalyzedAt = new Date();
  await page.save();

  res.json({
    success: true,
    data: {
      page,
      analysis: {
        seoScore,
        readabilityScore,
        contentScore,
        suggestions
      }
    }
  });
});

// Get keyword suggestions
export const getKeywordSuggestions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user;
  
  if (!user) {
    throw new AppError('Not authenticated', 401);
  }

  const { topic, count = 10 } = req.query;

  if (!topic) {
    throw new AppError('Topic is required', 400);
  }

  // Simulate AI-powered keyword suggestions
  const suggestions = generateKeywordSuggestions(topic as string, Number(count));

  res.json({
    success: true,
    data: suggestions
  });
});

// Bulk analyze pages
export const bulkAnalyze = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user;
  
  if (!user) {
    throw new AppError('Not authenticated', 401);
  }

  const pages = await SEOPage.find();
  const results = {
    analyzed: 0,
    improved: 0,
    errors: [] as any[]
  };

  for (const page of pages) {
    try {
      const oldScore = page.seoScore;
      
      page.seoScore = calculateSEOScore(page.title, page.metaDescription, page.metaKeywords);
      page.readabilityScore = calculateReadabilityScore(page.metaDescription);
      page.contentScore = Math.floor((page.seoScore + page.readabilityScore) / 2);
      page.lastAnalyzedAt = new Date();
      
      await page.save();
      
      results.analyzed++;
      if (page.seoScore > oldScore) {
        results.improved++;
      }
    } catch (error: any) {
      results.errors.push({ pageId: page._id, error: error.message });
    }
  }

  logger.info(`Bulk SEO analysis completed by ${user.email}`);

  res.json({
    success: true,
    message: `Analyzed ${results.analyzed} pages, ${results.improved} improved`,
    data: results
  });
});

// Helper functions
function calculateSEOScore(title: string, metaDescription: string, keywords: string[]): number {
  let score = 50; // Base score

  // Title optimization (max 25 points)
  if (title) {
    if (title.length >= 30 && title.length <= 60) score += 15;
    else if (title.length > 0) score += 10;
  }

  // Meta description optimization (max 25 points)
  if (metaDescription) {
    if (metaDescription.length >= 120 && metaDescription.length <= 160) score += 15;
    else if (metaDescription.length > 0) score += 10;
  }

  // Keywords (max 20 points)
  if (keywords && keywords.length > 0) {
    score += Math.min(keywords.length * 4, 20);
  }

  return Math.min(score, 100);
}

function calculateReadabilityScore(text: string): number {
  if (!text) return 0;

  // Simple readability calculation
  const words = text.split(/\s+/).length;
  const sentences = text.split(/[.!?]+/).length;
  const avgWordsPerSentence = words / Math.max(sentences, 1);

  // Ideal: 15-20 words per sentence
  if (avgWordsPerSentence >= 15 && avgWordsPerSentence <= 20) return 90;
  if (avgWordsPerSentence >= 10 && avgWordsPerSentence <= 25) return 75;
  return 60;
}

function generateSEOSuggestions(page: any): string[] {
  const suggestions = [];

  if (!page.title || page.title.length < 30) {
    suggestions.push('Title is too short. Aim for 30-60 characters.');
  }
  if (page.title && page.title.length > 60) {
    suggestions.push('Title is too long. Keep it under 60 characters.');
  }

  if (!page.metaDescription || page.metaDescription.length < 120) {
    suggestions.push('Meta description is too short. Aim for 120-160 characters.');
  }
  if (page.metaDescription && page.metaDescription.length > 160) {
    suggestions.push('Meta description is too long. Keep it under 160 characters.');
  }

  if (!page.metaKeywords || page.metaKeywords.length === 0) {
    suggestions.push('Add relevant meta keywords to improve search visibility.');
  }

  if (!page.ogImage) {
    suggestions.push('Add an Open Graph image for better social sharing.');
  }

  if (!page.schemaMarkup || Object.keys(page.schemaMarkup).length === 0) {
    suggestions.push('Consider adding structured data (Schema.org) for rich snippets.');
  }

  return suggestions;
}

function generateKeywordSuggestions(topic: string, count: number): any[] {
  const baseKeywords = [
    { keyword: `${topic} guide`, volume: 1200, difficulty: 45, cpc: 2.5 },
    { keyword: `${topic} tips`, volume: 800, difficulty: 35, cpc: 1.8 },
    { keyword: `best ${topic}`, volume: 2400, difficulty: 55, cpc: 3.2 },
    { keyword: `${topic} tutorial`, volume: 600, difficulty: 30, cpc: 1.5 },
    { keyword: `${topic} strategy`, volume: 1000, difficulty: 40, cpc: 2.8 },
    { keyword: `${topic} examples`, volume: 700, difficulty: 25, cpc: 1.2 },
    { keyword: `how to ${topic}`, volume: 1800, difficulty: 50, cpc: 2.9 },
    { keyword: `${topic} tools`, volume: 900, difficulty: 38, cpc: 2.1 },
    { keyword: `${topic} trends`, volume: 500, difficulty: 28, cpc: 1.6 },
    { keyword: `${topic} case study`, volume: 400, difficulty: 32, cpc: 1.9 }
  ];

  return baseKeywords.slice(0, count).map(k => ({
    ...k,
    volume: k.volume + Math.floor(Math.random() * 200 - 100),
    difficulty: Math.min(100, Math.max(0, k.difficulty + Math.floor(Math.random() * 10 - 5)))
  }));
}
