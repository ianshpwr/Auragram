// src/routes/feed.js
import { Router } from 'express';
import { optionalAuth } from '../middlewares/auth.js';
import { getFeed } from '../controllers/feedController.js';

const router = Router();

router.get('/', optionalAuth, getFeed);

export default router;
