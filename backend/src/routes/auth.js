// src/routes/auth.js
import { Router } from 'express';
import { body } from 'express-validator';
import { register, login, logout, refresh, getMe } from '../controllers/authController.js';
import authenticate from '../middlewares/auth.js';

const router = Router();

router.post(
  '/register',
  [
    body('username').trim().isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('category').optional().isIn(['tech', 'art', 'science', 'gaming', 'culture']),
  ],
  register
);

router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty().withMessage('Password required'),
  ],
  login
);

router.post('/logout', authenticate, logout);
router.post('/refresh', refresh);
router.get('/me', authenticate, getMe);

export default router;
