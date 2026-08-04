import 'dotenv/config';
import express, { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import type { CorsOptions } from 'cors';
import { BadRequest, UnAuthorizedAcsess } from './utils/appError';
import { HTTPSTATUS } from './utils/enums';
import { connectDb, disconnectDb } from './db/db';
import { logger } from './utils/logger';
import { globalErrorHandler } from './middlewares/globalError';
import { routes } from './routes';
import { requestLogger } from './middlewares/reqLogger';

const app = express();
app.use(helmet());

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ?.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions: CorsOptions = {
  origin(origin, cb) {
    if (!origin || allowedOrigins?.includes(origin)) {
      cb(null, true);
    } else {
      const errorMessage = `Origin ${origin ?? 'current origin'} is not allowed!`;
      cb(new UnAuthorizedAcsess(errorMessage), false);
    }
  },
  credentials: true,
};
app.use(cors(corsOptions));

app.use(express.json());
app.use(requestLogger);
app.use(express.urlencoded({ extended: true }));

app.use('/health', (req: Request, res: Response) => {
  logger.info(`Request came at ${req.originalUrl}`);
  res.status(HTTPSTATUS.OK).json({
    message: 'everything is healthy like you!',
  });
});
app.use('/api/v1', routes);

app.use((req: Request, res: Response, nextFn: NextFunction) => {
  nextFn(new BadRequest(`Route ${req.originalUrl} not found`));
});

app.use(globalErrorHandler);

async function startServer() {
  const PORT = process.env.PORT || 8000;
  try {
    logger.info('connecting to db');
    await connectDb();

    const server = app.listen(PORT, () => {
      logger.info(`server running at ${PORT}`);
    });

    const shutdownSignals = ['SIGTERM', 'SIGINT'];
    shutdownSignals.forEach((sign) => {
      process.on(sign, async () => {
        try {
          await new Promise<void>((resolve, reject) => {
            server.close((err) => {
              logger.info('server is closing due to ', sign);
              if (err) reject(err);
              else resolve();
            });
          });
          await disconnectDb();
          process.exit(0);
        } catch {
          process.exit(0);
        }
      });
    });

    process.on('unhandledRejection', (reason: unknown) => {
      logger.error('Unhandled Promise Rejection', reason);
      process.exit(1);
    });

    process.on('uncaughtException', (reason: Error, origin: NodeJS.UncaughtExceptionOrigin) => {
      logger.error('Unhandled Exception Rejection', reason);
      process.exit(1);
    });
  } catch (e) {
    logger.error(
      e instanceof Error
        ? e.message
        : 'Error occurred starting server',
    );
  }
}

startServer();
