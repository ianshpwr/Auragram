// src/routes/posts.js
// Post management API routes
//
// Endpoints:
// - GET / — Get paginated feed with cursor pagination
// - GET /:id — Get single post by ID
// - POST / — Create new post (authenticated)
// - DELETE /:id — Delete post (authenticated)
// - POST /:id/like — Like a post (authenticated)
// - POST /:id/comment — Add comment to post (authenticated)
// - POST /:id/share — Share a post (authenticated)
// - POST /:id/bookmark — Bookmark a post (authenticated)
// - POST /:id/report — Report post for abuse (authenticated)

import { Router } from 'express';
import { body } from 'express-validator';
import authenticate from '../middlewares/auth.js';
import {
  createPost, getFeed, getPostById, deletePost,
  likePost, commentPost, getComments, sharePost, bookmarkPost, reportPost
} from '../controllers/postsController.js';

const router = Router();

// Public feed browsing with cursor pagination
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
