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

const formatLogMessage = (msgOrObj: string | object, args: unknown[]): { msg: string; obj?: object } => {
  if (typeof msgOrObj === 'string') {
    if (args.length === 0) {
      return { msg: sanitizeLogString(msgOrObj) };
    }
    if (args.length === 1 && typeof args[0] === 'object' && args[0] !== null) {
      return { msg: sanitizeLogString(msgOrObj), obj: args[0] as object };
    }
    const formattedArgs = args
      .map((a) => (typeof a === 'object' && a !== null ? JSON.stringify(a) : sanitizeLogString(a)))
      .join(' ');
    return { msg: `${sanitizeLogString(msgOrObj)} ${formattedArgs}` };
  }
  return { msg: '', obj: msgOrObj };
};

export const logger = {
  info: (msgOrObj: string | object, ...args: unknown[]): void => {
    const { msg, obj } = formatLogMessage(msgOrObj, args);
    if (obj && msg) {
      pinoLogger.info(obj, msg);
    } else if (obj) {
      pinoLogger.info(obj);
    } else {
      pinoLogger.info(msg);
    }
  },
  error: (msgOrObj: string | object, ...args: unknown[]): void => {
    const { msg, obj } = formatLogMessage(msgOrObj, args);
    if (obj && msg) {
      pinoLogger.error(obj, msg);
    } else if (obj) {
      pinoLogger.error(obj);
    } else {
      pinoLogger.error(msg);
    }
  },
  warn: (msgOrObj: string | object, ...args: unknown[]): void => {
    const { msg, obj } = formatLogMessage(msgOrObj, args);
    if (obj && msg) {
      pinoLogger.warn(obj, msg);
    } else if (obj) {
      pinoLogger.warn(obj);
    } else {
      pinoLogger.warn(msg);
    }
  },
  debug: (msgOrObj: string | object, ...args: unknown[]): void => {
    const { msg, obj } = formatLogMessage(msgOrObj, args);
    if (obj && msg) {
      pinoLogger.debug(obj, msg);
    } else if (obj) {
      pinoLogger.debug(obj);
    } else {
      pinoLogger.debug(msg);
    }
  },
};
