import { Router } from 'express';
import { body } from 'express-validator';
import { userController } from '../controllers';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all users
router.get('/', userController.getUsers);

// Get user stats
router.get('/stats', authorize('SUPER_ADMIN', 'MARKETING_HEAD'), userController.getUserStats);

// Get single user
router.get('/:id', userController.getUser);

// Create user (admin only)
router.post(
  '/',
  authorize('SUPER_ADMIN', 'MARKETING_HEAD'),
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('firstName').trim().notEmpty(),
    body('lastName').trim().notEmpty()
  ],
  userController.createUser
);

// Update user
router.put('/:id', userController.updateUser);

// Delete user (admin only)
router.delete('/:id', authorize('SUPER_ADMIN'), userController.deleteUser);

// Update user status
router.patch('/:id/status', authorize('SUPER_ADMIN', 'MARKETING_HEAD'), userController.updateUserStatus);

export default router;
