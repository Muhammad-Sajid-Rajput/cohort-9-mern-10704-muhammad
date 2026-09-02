import pino from 'pino';
import fs from 'fs';
import path from 'path';

const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const targets: pino.TransportTargetOptions[] = [
  {
    target: 'pino/file',
    options: { destination: path.join(logDir, 'combined.log'), mkdir: true },
    level: 'info',
  },
  {
    target: 'pino/file',
    options: { destination: path.join(logDir, 'error.log'), mkdir: true },
    level: 'error',
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

type LogLevel = 'info' | 'error' | 'warn' | 'debug';

const sanitizeData = (val: unknown): unknown => {
  if (typeof val === 'string') {
    return val.replace(/[\r\n\t]/g, ' ').trim();
  }
  return val;
};

const logWithSwap = (level: LogLevel, msgOrObj: string | object, ...args: unknown[]): void => {
  const sanitizedMsg = typeof msgOrObj === 'string' ? (sanitizeData(msgOrObj) as string) : msgOrObj;
  const sanitizedArgs = args.map(sanitizeData);
  if (typeof sanitizedMsg === 'string' && sanitizedArgs.length > 0 && typeof sanitizedArgs[0] === 'object' && sanitizedArgs[0] !== null) {
    pinoLogger[level](sanitizedArgs[0] as object, sanitizedMsg, ...(sanitizedArgs.slice(1) as string[]));
  } else {
    pinoLogger[level](sanitizedMsg as object, ...(sanitizedArgs as string[]));
  }
};

export const logger = {
  info: (msgOrObj: string | object, ...args: unknown[]) => logWithSwap('info', msgOrObj, ...args),
  error: (msgOrObj: string | object, ...args: unknown[]) => logWithSwap('error', msgOrObj, ...args),
  warn: (msgOrObj: string | object, ...args: unknown[]) => logWithSwap('warn', msgOrObj, ...args),
  debug: (msgOrObj: string | object, ...args: unknown[]) => logWithSwap('debug', msgOrObj, ...args),
};
