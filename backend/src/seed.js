// src/seed.js
// Seeds AuraGram with 20 users, 50 posts, 200 events
// Run with: node src/seed.js

import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import Post from './models/Post.js';
import Event from './models/Event.js';
import AuraLog from './models/AuraLog.js';
import redisClient from './config/redis.js';
import env from './config/env.js';
import { assignTier } from './utils/tierMap.js';
import { EVENT_WEIGHTS } from './utils/constants.js';

const SEED_PASSWORD_HASH = await bcrypt.hash('password123', 10);

// Seed Users: 20 across all 7 tiers with realistic auraScores
const USERS_DATA = [
  // Apex (>=10000)
  { username: 'apex_nova', email: 'apex_nova@auragram.dev', auraScore: 15420, category: 'tech' },
  { username: 'luminary_kai', email: 'kai@auragram.dev', auraScore: 12800, category: 'science' },
  // Luminary (5000-9999)
  { username: 'luminary_aria', email: 'aria@auragram.dev', auraScore: 8750, category: 'art' },
  { username: 'luminary_rex', email: 'rex@auragram.dev', auraScore: 6300, category: 'gaming' },
  // Influential (2000-4999)
  { username: 'influential_maya', email: 'maya@auragram.dev', auraScore: 4200, category: 'culture' },
  { username: 'influential_leo', email: 'leo@auragram.dev', auraScore: 3100, category: 'tech' },
  { username: 'influential_zara', email: 'zara@auragram.dev', auraScore: 2500, category: 'art' },
  // Resonant (800-1999)
  { username: 'resonant_finn', email: 'finn@auragram.dev', auraScore: 1650, category: 'science' },
  { username: 'resonant_nora', email: 'nora@auragram.dev', auraScore: 1200, category: 'gaming' },
  { username: 'resonant_blake', email: 'blake@auragram.dev', auraScore: 900, category: 'culture' },
  // Rising (250-799)
  { username: 'rising_sky', email: 'sky@auragram.dev', auraScore: 650, category: 'tech' },
  { username: 'rising_ember', email: 'ember@auragram.dev', auraScore: 480, category: 'art' },
  { username: 'rising_pax', email: 'pax@auragram.dev', auraScore: 310, category: 'science' },
  // Spark (50-249)
  { username: 'spark_june', email: 'june@auragram.dev', auraScore: 180, category: 'gaming' },
  { username: 'spark_orion', email: 'orion@auragram.dev', auraScore: 120, category: 'culture' },
  { username: 'spark_wren', email: 'wren@auragram.dev', auraScore: 75, category: 'tech' },
  // Dormant (0-49)
  { username: 'dormant_echo', email: 'echo@auragram.dev', auraScore: 20, category: 'art' },
  { username: 'dormant_sol', email: 'sol@auragram.dev', auraScore: 10, category: 'science' },
  { username: 'dormant_ash', email: 'ash@auragram.dev', auraScore: 5, category: 'gaming' },
  { username: 'dormant_mist', email: 'mist@auragram.dev', auraScore: 0, category: 'culture' },
];

// 50 posts across categories
const POST_TEMPLATES = [
  { content: 'Just shipped a new open-source CLI tool for managing dotfiles across machines. Works on Mac, Linux, and WSL!', category: 'tech' },
  { content: 'The future of AI is not about replacing developers -- it is about amplifying human creativity. Hot take?', category: 'tech' },
  { content: 'Rust just made me rethink everything I knew about memory management. Zero-cost abstractions are a game changer.', category: 'tech' },
  { content: 'WebGPU is finally stable across browsers. The era of GPU-powered web apps has begun.', category: 'tech' },
  { content: 'Built a full-stack app in 4 hours using AI tooling. The developer experience has never been this good.', category: 'tech' },
  { content: 'Why I stopped using ORM and went back to raw SQL for my high-traffic microservices. A thread.', category: 'tech' },
  { content: 'TypeScript 5.4 mapped types are pure wizardry. A pattern for type-safe event emitters that changed how I code.', category: 'tech' },
  { content: 'Redis as a primary database: controversial but valid for the right use cases. Here is when it works.', category: 'tech' },
  { content: 'Containerization changed deployment, but WASM might change everything else. The edge computing revolution is real.', category: 'tech' },
  { content: 'My monolith handles 50k req/s on $20/mo. Microservices are for org problems, not tech problems.', category: 'tech' },
  { content: 'Finished my largest digital painting yet -- 200+ hours, painted entirely on iPad with Procreate.', category: 'art' },
  { content: 'Generative art tools do not kill creativity. Blank canvas anxiety is real and AI helps me start.', category: 'art' },
  { content: 'My exhibition at the community gallery was a success! Minimalism resonates more than I expected.', category: 'art' },
  { content: 'Color theory is the most underrated skill for both designers and developers. Changed how I see everything.', category: 'art' },
  { content: 'Ceramic sculpting after years of digital work feels like cheating in the best possible way.', category: 'art' },
  { content: 'The golden ratio principles, once understood, make you a significantly better visual thinker.', category: 'art' },
  { content: 'Architectural photography taught me more about light and shadow than any art class ever did.', category: 'art' },
  { content: 'Street art is the most democratic art form. No gallery, no gatekeepers, just walls and weather.', category: 'art' },
  { content: 'My Figma components library just hit 1000 downloads. Building in public is worth it.', category: 'art' },
  { content: 'Typography is the art we interact with most in the digital age and the one we take most for granted.', category: 'art' },
  { content: 'CRISPR has now been used to edit T-cells for three different cancers with remarkable efficacy. We are in a new era.', category: 'science' },
  { content: 'The James Webb Telescope images continue to break every cosmological model we had before 2022.', category: 'science' },
  { content: 'Peptide folding predictions are now accurate enough to design new proteins from scratch. AlphaFold changed everything.', category: 'science' },
  { content: 'The science of sleep deprivation is more disturbing the deeper you look. 6 hours is not enough.', category: 'science' },
  { content: 'Quantum computing will not break RSA this decade, but lattice-based cryptography should be adopted now.', category: 'science' },
  { content: 'Neuroplasticity research suggests we drastically underestimate the brain ability to rewire at any age.', category: 'science' },
  { content: 'Climate tipping points are not linear -- cascade effects make the next 10 years more critical than models show.', category: 'science' },
  { content: 'The new GLP-1 receptor agonists are redefining obesity medicine, but access equity remains a massive issue.', category: 'science' },
  { content: 'Fusion energy is no longer a joke. Ignition has been achieved. The question is cost per Watt.', category: 'science' },
  { content: 'Microbiome research of the last decade invalidates decades of dietary guidelines. We barely know anything.', category: 'science' },
  { content: 'Elden Ring open world design is a masterclass in player agency without handholding. Best game of the decade.', category: 'gaming' },
  { content: 'The indie game scene in 2025 is outperforming AAA studios on creativity, story, and originality.', category: 'gaming' },
  { content: 'Baldurs Gate 3 redefined what RPGs can be. GOTY forever in my heart and on my shelf.', category: 'gaming' },
  { content: 'Speedrunning is an art form. Watching someone exploit a game to perfection is as impressive as any sport.', category: 'gaming' },
  { content: 'The Switch 2 changes everything for portable gaming. Nintendo played the long game beautifully.', category: 'gaming' },
  { content: 'Competitive VALORANT is more strategic than any FPS I have played. The meta shifts every patch.', category: 'gaming' },
  { content: 'Game developers deserve better. Crunch culture is still endemic and it is destroying creative talent.', category: 'gaming' },
  { content: 'Fighting games have the steepest learning curve of any genre but the most rewarding skill ceiling.', category: 'gaming' },
  { content: 'Hollow Knight is proof that a two-person team with vision beats a 500-person studio without one.', category: 'gaming' },
  { content: 'The nostalgia economy is killing gaming innovation. We need more original IP, not remakes.', category: 'gaming' },
  { content: 'Social media has compressed cultural cycles. Trends peak and die in weeks. Is that bad or just different?', category: 'culture' },
  { content: 'Vinyl record sales are outselling CDs again. Physical media is not dead, it is niche and thriving.', category: 'culture' },
  { content: 'The return of long-form journalism and newsletters signals people are exhausted by hot takes.', category: 'culture' },
  { content: 'Fashion is the fastest moving art form and the least respected. That is changing rapidly.', category: 'culture' },
  { content: 'Coffee culture went from commodity to identity. Third-wave coffee is class signaling dressed as connoisseurship.', category: 'culture' },
  { content: 'Memes are modern myths. They encode cultural anxieties in a form that can spread at machine speed.', category: 'culture' },
  { content: 'The library renaissance is real. Communities are rediscovering libraries as inclusive public spaces.', category: 'culture' },
  { content: 'Book clubs and reading communities online are among the most wholesome corners of the internet.', category: 'culture' },
  { content: 'Language shapes thought. The Sapir-Whorf hypothesis deserves more serious attention than it gets.', category: 'culture' },
  { content: 'Documentary filmmaking is having a renaissance because streaming platforms fund what theaters never would.', category: 'culture' },
];

async function seed() {
  try {
    console.log('[Seed] Connecting to MongoDB...');
    await mongoose.connect(env.MONGO_URI);
    console.log('[Seed] Connected.');

    console.log('[Seed] Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Post.deleteMany({}),
      Event.deleteMany({}),
      AuraLog.deleteMany({}),
    ]);

    const keys = await redisClient.keys('leaderboard:*');
    if (keys.length > 0) await redisClient.del(...keys);

    // Create Users
    console.log('[Seed] Creating 20 users...');
    const users = await User.insertMany(
      USERS_DATA.map((u) => ({
        ...u,
        passwordHash: SEED_PASSWORD_HASH,
        tier: assignTier(u.auraScore),
        lastActiveAt: new Date(Date.now() - Math.floor(Math.random() * 5 * 86400000)),
        scoreHistory: Array.from({ length: 15 }, (_, i) => ({
          score: Math.max(0, u.auraScore - (15 - i) * Math.floor(u.auraScore * 0.02)),
          timestamp: new Date(Date.now() - (15 - i) * 2 * 86400000),
        })),
      }))
    );
    console.log(`[Seed] Created ${users.length} users`);

    // Populate Redis leaderboards
    console.log('[Seed] Populating Redis leaderboards...');
    const pipeline = redisClient.pipeline();
    for (const user of users) {
      pipeline.zadd('leaderboard:global', user.auraScore, user._id.toString());
      if (user.category) {
        pipeline.zadd(`leaderboard:${user.category}`, user.auraScore, user._id.toString());
      }
    }
    await pipeline.exec();
    console.log('[Seed] Redis leaderboards populated');

    // Create Posts
    console.log('[Seed] Creating 50 posts...');
    const posts = await Post.insertMany(
      POST_TEMPLATES.map((template, i) => {
        const author = users[i % users.length];
        const engagements = {
          likes: Math.floor(Math.random() * 500) + 10,
          comments: Math.floor(Math.random() * 100) + 2,
          shares: Math.floor(Math.random() * 80) + 1,
          bookmarks: Math.floor(Math.random() * 60),
        };
        return {
          authorId: author._id,
          content: template.content,
          category: template.category,
          engagements,
          qualityScore: engagements.likes * 0.4 + engagements.comments * 0.8 + engagements.shares * 1.2,
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 30 * 86400000)),
        };
      })
    );
    console.log(`[Seed] Created ${posts.length} posts`);

    // Create Events
    console.log('[Seed] Creating 200 events...');
    const eventTypes = ['post_liked', 'post_commented', 'post_shared', 'post_bookmarked', 'profile_followed'];
    const eventDocs = [];

    for (let i = 0; i < 200; i++) {
      const actor = users[Math.floor(Math.random() * users.length)];
      const post = posts[Math.floor(Math.random() * posts.length)];
      const type = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      const targetUserId = type === 'profile_followed'
        ? users[Math.floor(Math.random() * users.length)]._id
        : post.authorId;

      if (actor._id.toString() === targetUserId.toString()) continue;

      eventDocs.push({
        actorId: actor._id,
        targetUserId,
        postId: type !== 'profile_followed' ? post._id : undefined,
        type,
        weight: EVENT_WEIGHTS[type],
        processed: true,
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 7 * 86400000)),
      });
    }

    await Event.insertMany(eventDocs, { ordered: false });
    console.log(`[Seed] Created ${eventDocs.length} events`);

    // Create AuraLogs
    console.log('[Seed] Creating aura logs...');
    const auraLogs = users.map((user) => ({
      userId: user._id,
      delta: user.auraScore,
      reason: 'seed_initialization',
      scoreBefore: 0,
      scoreAfter: user.auraScore,
      timestamp: new Date(Date.now() - 30 * 86400000),
    }));
    await AuraLog.insertMany(auraLogs);
    console.log(`[Seed] Created ${auraLogs.length} aura logs`);

    console.log('\n[Seed] Seed complete!');
    console.log(`   Users: ${users.length}`);
    console.log(`   Posts: ${posts.length}`);
    console.log(`   Events: ${eventDocs.length}`);
    console.log(`   AuraLogs: ${auraLogs.length}`);
    console.log('\n   Test login: any seed user email, password: password123');
  } catch (err) {
    console.error('[Seed] Error:', err.message);
    throw err;
  } finally {
    await mongoose.disconnect();
    await redisClient.quit();
    console.log('[Seed] Disconnected from MongoDB and Redis');
  }
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
