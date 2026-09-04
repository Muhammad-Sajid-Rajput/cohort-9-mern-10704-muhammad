import pino from 'pino';
import fs from 'fs';
import path from 'path';

const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const targets: pino.TransportTargetOptions[] = [
  {
    target: 'pino-roll',
    level: 'info',
    options: {
      file: path.join(logDir, 'combined'),
      frequency: 'daily',
      extension: '.log',
      size: '20m',
      limit: { count: 7 },
      mkdir: true,
    },
  },
  {
    target: 'pino-roll',
    level: 'error',
    options: {
      file: path.join(logDir, 'error'),
      frequency: 'daily',
      extension: '.log',
      size: '20m',
      limit: { count: 7 },
      mkdir: true,
    },
  },
];

if (process.env.NODE_ENV === 'development') {
  targets.push({
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:yyyy-mm-dd HH:MM:ss.l',
      ignore: 'pid,hostname',
    },
    level: 'debug',
  });
}

const transport = pino.transport({ targets });

const pinoLogger = pino(
  {
    level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
    serializers: { err: pino.stdSerializers.err },
    base: { service: 'notes-backend' },
  },
  transport,
);

const sanitizeLogString = (val: unknown): string => {
  if (typeof val === 'string') {
    return val.replace(/[\r\n\t]/g, ' ').slice(0, 1000).trim();
  }
  return String(val ?? '').slice(0, 1000);
};

export const logger = {
  info: (msgOrObj: string | object, ...args: unknown[]) => {
    if (typeof msgOrObj === 'string') {
      const sanitized = sanitizeLogString(msgOrObj);
      if (args.length > 0 && typeof args[0] === 'object' && args[0] !== null) {
        pinoLogger.info(args[0] as object, sanitized);
      } else {
        pinoLogger.info(sanitized);
      }
    } else {
      pinoLogger.info(msgOrObj);
    }
  },
  error: (msgOrObj: string | object, ...args: unknown[]) => {
    if (typeof msgOrObj === 'string') {
      const sanitized = sanitizeLogString(msgOrObj);
      if (args.length > 0 && typeof args[0] === 'object' && args[0] !== null) {
        pinoLogger.error(args[0] as object, sanitized);
      } else {
        pinoLogger.error(sanitized);
      }
    } else {
      pinoLogger.error(msgOrObj);
    }
  },
  warn: (msgOrObj: string | object, ...args: unknown[]) => {
    if (typeof msgOrObj === 'string') {
      const sanitized = sanitizeLogString(msgOrObj);
      if (args.length > 0 && typeof args[0] === 'object' && args[0] !== null) {
        pinoLogger.warn(args[0] as object, sanitized);
      } else {
        pinoLogger.warn(sanitized);
      }
    } else {
      pinoLogger.warn(msgOrObj);
    }
  },
  debug: (msgOrObj: string | object, ...args: unknown[]) => {
    if (typeof msgOrObj === 'string') {
      const sanitized = sanitizeLogString(msgOrObj);
      if (args.length > 0 && typeof args[0] === 'object' && args[0] !== null) {
        pinoLogger.debug(args[0] as object, sanitized);
      } else {
        pinoLogger.debug(sanitized);
      }
    } else {
      pinoLogger.debug(msgOrObj);
    }
  },
};
