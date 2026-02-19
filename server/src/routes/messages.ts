import { Router } from 'express';
import { body } from 'express-validator';
import { messageController } from '../controllers';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all messages
router.get('/', messageController.getMessages);

// Get message stats
router.get('/stats', messageController.getMessageStats);

// Get single message
router.get('/:id', messageController.getMessage);

// Create message
router.post(
  '/',
  [
    body('channel').isIn(['WHATSAPP', 'MESSENGER', 'EMAIL', 'SMS', 'LIVE_CHAT']),
    body('sender').isObject(),
    body('content').trim().notEmpty()
  ],
  messageController.createMessage
);

// Update message
router.put('/:id', messageController.updateMessage);

// Delete message
router.delete('/:id', messageController.deleteMessage);

// Mark as read
router.patch('/:id/read', messageController.markAsRead);

// Reply to message
router.post('/:id/reply', messageController.replyToMessage);

// Assign message
router.post('/:id/assign', messageController.assignMessage);

export default router;
