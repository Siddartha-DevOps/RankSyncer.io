import * as dotenv from 'dotenv';
dotenv.config();

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value && process.env.NODE_ENV === 'production') {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value || '';
}

export const config = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3000', 10), // AI Studio requires port 3000
  
  // Database
  DATABASE_URL: requireEnv('DATABASE_URL'),
  
  // Redis
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  
  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  
  // OpenAI
  OPENAI_API_KEY: requireEnv('OPENAI_API_KEY'),
  OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
  OPENAI_EMBEDDING_MODEL: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
  
  // Frontend
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  
  // Encryption
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || 'dev-encryption-key-32chars-change!',
  
  // Paddle
  PADDLE_API_KEY: process.env.PADDLE_API_KEY || '',
  PADDLE_WEBHOOK_SECRET: process.env.PADDLE_WEBHOOK_SECRET || '',
  PADDLE_STARTER_PRICE_ID: process.env.PADDLE_STARTER_PRICE_ID || '',
  PADDLE_GROWTH_PRICE_ID: process.env.PADDLE_GROWTH_PRICE_ID || '',
  PADDLE_AGENCY_PRICE_ID: process.env.PADDLE_AGENCY_PRICE_ID || '',
  
  // App
  APP_URL: process.env.APP_URL || 'http://localhost:3000',
  
  // Limits per plan
  PLAN_LIMITS: {
    STARTER: 30,
    GROWTH: 100,
    AGENCY: -1, // unlimited
  } as Record<string, number>,
};
