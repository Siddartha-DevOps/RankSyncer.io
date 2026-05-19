import Redis from 'ioredis';
import { config } from './env';
import { logger } from '../utils/logger';

export const redisConnection = new Redis(config.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redisConnection.on('connect', () => {
  logger.info('✅ Redis connected');
});

redisConnection.on('error', (err) => {
  logger.error('Redis error:', err);
});

export const createRedisConnection = () =>
  new Redis(config.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
