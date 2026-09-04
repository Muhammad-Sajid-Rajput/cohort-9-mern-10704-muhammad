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

const sanitize = (data: unknown): unknown => {
  if (typeof data === 'string') {
    return data.replace(/[\r\n\t]/g, ' ').slice(0, 1000).trim();
  }

  if (data instanceof Error) {
    return {
      err: {
        message: data.message.replace(/[\r\n\t]/g, ' ').slice(0, 1000).trim(),
        stack: data.stack ? data.stack.replace(/[\r\n\t]/g, ' ').slice(0, 2000).trim() : undefined,
        name: data.name,
      },
    };
  }
  if (typeof data === 'object' && data !== null) {
    const cleanObj: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      cleanObj[key] = typeof value === 'string' ? value.replace(/[\r\n\t]/g, ' ').slice(0, 1000).trim() : value;
    }
    return cleanObj;
  }
  return data;
};

const normalizeMeta = (meta: unknown): object => {
  if (meta instanceof Error) {
    return sanitize(meta) as object;
  }
  if (meta !== null && typeof meta === 'object') {
    return sanitize(meta) as object;
  }
  return { value: String(meta).replace(/[\r\n\t]/g, ' ').slice(0, 1000).trim() };
};

export const logger = {
  info: (msg: string | object, meta?: unknown): void => {
    if (typeof msg === 'string') {
      const cleanMsg = String(sanitize(msg));
      if (meta !== undefined && meta !== null) {
        pinoLogger.info(normalizeMeta(meta), cleanMsg);
      } else {
        pinoLogger.info(cleanMsg);
      }
    } else {
      pinoLogger.info(sanitize(msg) as object);
    }
  },
  error: (msg: string | object, meta?: unknown): void => {
    if (typeof msg === 'string') {
      const cleanMsg = String(sanitize(msg));
      if (meta !== undefined && meta !== null) {
        pinoLogger.error(normalizeMeta(meta), cleanMsg);
      } else {
        pinoLogger.error(cleanMsg);
      }
    } else {
      pinoLogger.error(sanitize(msg) as object);
    }
  },
  warn: (msg: string | object, meta?: unknown): void => {
    if (typeof msg === 'string') {
      const cleanMsg = String(sanitize(msg));
      if (meta !== undefined && meta !== null) {
        pinoLogger.warn(normalizeMeta(meta), cleanMsg);
      } else {
        pinoLogger.warn(cleanMsg);
      }
    } else {
      pinoLogger.warn(sanitize(msg) as object);
    }
  },
  debug: (msg: string | object, meta?: unknown): void => {
    if (typeof msg === 'string') {
      const cleanMsg = String(sanitize(msg));
      if (meta !== undefined && meta !== null) {
        pinoLogger.debug(normalizeMeta(meta), cleanMsg);
      } else {
        pinoLogger.debug(cleanMsg);
      }
    } else {
      pinoLogger.debug(sanitize(msg) as object);
    }
  },
};
