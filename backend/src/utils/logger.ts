import pino from 'pino';

const targets: pino.TransportTargetOptions[] = [
  {
    target: 'pino-roll',
    level: 'error',
    options: {
      file: 'logs/error',
      frequency: 'daily',
      extension: '.log',
      size: '20m',
      mkdir: true,
    },
  },
  {
    target: 'pino-roll',
    level: 'info',
    options: {
      file: 'logs/combined',
      frequency: 'daily',
      extension: '.log',
      size: '20m',
      mkdir: true,
    },
  },
];

if (process.env.NODE_ENV !== 'production') {
  targets.push({
    target: 'pino-pretty',
    level: 'debug',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss',
      ignore: 'pid,hostname',
    },
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

const logWithSwap = (level: LogLevel, msgOrObj: string | object, ...args: unknown[]): void => {
  if (typeof msgOrObj === 'string' && args.length > 0 && typeof args[0] === 'object' && args[0] !== null) {
    pinoLogger[level](args[0] as object, msgOrObj, ...args.slice(1) as string[]);
  } else {
    pinoLogger[level](msgOrObj as object, ...args as string[]);
  }
};

export const logger = {
  info: (msgOrObj: string | object, ...args: unknown[]) => logWithSwap('info', msgOrObj, ...args),
  error: (msgOrObj: string | object, ...args: unknown[]) => logWithSwap('error', msgOrObj, ...args),
  warn: (msgOrObj: string | object, ...args: unknown[]) => logWithSwap('warn', msgOrObj, ...args),
  debug: (msgOrObj: string | object, ...args: unknown[]) => logWithSwap('debug', msgOrObj, ...args),
};
