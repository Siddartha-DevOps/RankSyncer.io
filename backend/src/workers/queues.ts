import { Queue } from 'bullmq';
import { redisConnection } from '../config/redis';

// Configure Queues
export const articleQueue = new Queue('article-generation', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: true,
  },
});

export const keywordQueue = new Queue('keyword-analysis', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: 'fixed',
      delay: 10000,
    },
    removeOnComplete: true,
  },
});

export const publishQueue = new Queue('cms-publishing', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 60000,
    },
    removeOnComplete: true,
  },
});

export const analyticsQueue = new Queue('analytics-collection', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 2,
    removeOnComplete: true,
  },
});
