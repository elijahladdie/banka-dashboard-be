import { NODE_ENV } from './constants';

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
} as const;

type LogLevel = keyof typeof LOG_LEVELS;

const getLogLevel = (): number => {
  if (NODE_ENV === 'production') return LOG_LEVELS.INFO;
  return LOG_LEVELS.DEBUG;
};

const formatTimestamp = (): string => {
  return new Date().toISOString();
};

const formatMessage = (level: LogLevel, message: string, meta?: any): string => {
  const timestamp = formatTimestamp();
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
  return `[${timestamp}] [${level}] ${message}${metaStr}`;
};

const logger = {
  error(message: string, meta?: any): void {
    if (getLogLevel() >= LOG_LEVELS.ERROR) {
      console.error(formatMessage('ERROR', message, meta));
    }
  },

  warn(message: string, meta?: any): void {
    if (getLogLevel() >= LOG_LEVELS.WARN) {
      console.warn(formatMessage('WARN', message, meta));
    }
  },

  info(message: string, meta?: any): void {
    if (getLogLevel() >= LOG_LEVELS.INFO) {
      console.info(formatMessage('INFO', message, meta));
    }
  },

  debug(message: string, meta?: any): void {
    if (getLogLevel() >= LOG_LEVELS.DEBUG) {
      console.debug(formatMessage('DEBUG', message, meta));
    }
  },
};
export default logger;
