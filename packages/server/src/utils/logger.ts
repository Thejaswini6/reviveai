/**
 * Logging Utility
 * Simple structured logging for development and production
 */

import { ENV } from '../env.js';

type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  trace: 0,
  debug: 1,
  info: 2,
  warn: 3,
  error: 4,
};

const currentLevel = LOG_LEVELS[ENV.LOG_LEVEL];

function formatMessage(level: LogLevel, message: string, data?: any): string {
  const timestamp = new Date().toISOString();
  const dataStr = data ? ` | ${JSON.stringify(data)}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${dataStr}`;
}

export const logger = {
  trace: (message: string, data?: any) => {
    if (LOG_LEVELS.trace >= currentLevel) {
      console.log(formatMessage('trace', message, data));
    }
  },

  debug: (message: string, data?: any) => {
    if (LOG_LEVELS.debug >= currentLevel) {
      console.log(formatMessage('debug', message, data));
    }
  },

  info: (message: string, data?: any) => {
    if (LOG_LEVELS.info >= currentLevel) {
      console.log(formatMessage('info', message, data));
    }
  },

  warn: (message: string, data?: any) => {
    if (LOG_LEVELS.warn >= currentLevel) {
      console.warn(formatMessage('warn', message, data));
    }
  },

  error: (message: string, data?: any) => {
    if (LOG_LEVELS.error >= currentLevel) {
      console.error(formatMessage('error', message, data));
    }
  },
};
