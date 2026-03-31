// src/routes/posts.js
import { Router } from 'express';
import { body } from 'express-validator';
import authenticate from '../middlewares/auth.js';
import {
  createPost, getFeed, getPostById, deletePost,
  likePost, commentPost, getComments, sharePost, bookmarkPost, reportPost
} from '../controllers/postsController.js';

const router = Router();

router.get('/', getFeed);
router.get('/:id', getPostById);
router.get('/:id/comments', getComments);

router.post(
  '/',
  authenticate,
  [
    body('content').trim().isLength({ min: 1, max: 1000 }).withMessage('Content must be 1-1000 characters'),
    body('category').isIn(['tech', 'art', 'science', 'gaming', 'culture']).withMessage('Invalid category'),
  ],
  createPost
);

router.delete('/:id', authenticate, deletePost);
router.post('/:id/like', authenticate, likePost);

router.post(
  '/:id/comment',
  authenticate,
  [body('content').trim().isLength({ min: 1, max: 500 }).withMessage('Comment must be 1-500 characters')],
  commentPost
);

router.post('/:id/share', authenticate, sharePost);
router.post('/:id/bookmark', authenticate, bookmarkPost);

router.post(
  '/:id/report',
  authenticate,
  [body('reason').optional().trim().isLength({ max: 500 })],
  reportPost
);

export default router;
