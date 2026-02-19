import { Router } from 'express';
import { body } from 'express-validator';
import { postController } from '../controllers';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all posts
router.get('/', postController.getPosts);

// Get content calendar
router.get('/calendar', postController.getCalendar);

// Get single post
router.get('/:id', postController.getPost);

// Create post
router.post(
  '/',
  [
    body('title').trim().notEmpty(),
    body('content').trim().notEmpty(),
    body('platform').isIn(['INSTAGRAM', 'FACEBOOK', 'TWITTER', 'LINKEDIN', 'YOUTUBE', 'TIKTOK'])
  ],
  postController.createPost
);

// Update post
router.put('/:id', postController.updatePost);

// Delete post
router.delete('/:id', postController.deletePost);

// Submit for approval
router.post('/:id/submit', postController.submitForApproval);

// Approve post
router.post('/:id/approve', postController.approvePost);

// Publish post
router.post('/:id/publish', postController.publishPost);

export default router;
