import pino from 'pino';

// so we have two formats one for storing logs in files

// for console for developer

const targets: pino.TransportTargetOptions[] = [
  // errors only
  {
    target: 'pino-roll',
    level: 'error',
    options: {
      file: 'logs/error',
      frequency: 'daily',
      extension: '.log',
      mkdir: true,
    },
  },
  // combine
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
    base: { service: 'notes-backed' },
  },
  transport,
);

const logWithSwap = (level: 'info' | 'error' | 'warn' | 'debug', msgOrObj: any, ...args: any[]) => {
  if (typeof msgOrObj === 'string' && args.length > 0 && typeof args[0] === 'object') {
    (pinoLogger[level] as Function)(args[0], msgOrObj, ...args.slice(1));
  } else {
    (pinoLogger[level] as Function)(msgOrObj, ...args);
  }
};

export const logger = {
  info: (msgOrObj: any, ...args: any[]) => logWithSwap('info', msgOrObj, ...args),
  error: (msgOrObj: any, ...args: any[]) => logWithSwap('error', msgOrObj, ...args),
  warn: (msgOrObj: any, ...args: any[]) => logWithSwap('warn', msgOrObj, ...args),
  debug: (msgOrObj: any, ...args: any[]) => logWithSwap('debug', msgOrObj, ...args),
};
