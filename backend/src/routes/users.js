// src/routes/users.js
import { Router } from 'express';
import { body } from 'express-validator';
import authenticate from '../middlewares/auth.js';
import { getUserById, getUserPosts, updateMe, getUserAuraLog } from '../controllers/usersController.js';

const router = Router();

router.get('/:id', getUserById);
router.get('/:id/posts', getUserPosts);
router.get('/:id/aura-log', authenticate, getUserAuraLog);
router.patch(
  '/me',
  authenticate,
  [
    body('username').optional().trim().isLength({ min: 3, max: 30 }),
    body('category').optional().isIn(['tech', 'art', 'science', 'gaming', 'culture']),
  ],
  updateMe
);

export default router;
