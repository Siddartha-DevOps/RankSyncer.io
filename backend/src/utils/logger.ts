import winston from 'winston';

const { combine, timestamp, errors, json, colorize, simple } = winston.format;

const isDev = process.env.NODE_ENV !== 'production';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    isDev ? simple() : json()
  ),
  transports: [
    new winston.transports.Console({
      format: isDev
        ? combine(colorize(), simple())
        : combine(timestamp(), json()),
    }),
    // Note: In Cloud environments like Cloud Run, we typically rely on Stdout
    // but keeping these as per user request.
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
    }),
  ],
});
