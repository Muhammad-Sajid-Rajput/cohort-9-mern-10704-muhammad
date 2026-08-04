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

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',');
const corsOptions: CorsOptions = {
  origin(origin, cb) {
    if (!origin || allowedOrigins?.includes(origin)) {
      cb(null, true);
    } else {
      const errrorMessage = `the orgin ${origin ?? 'current origin'} isnt allowed !`;
      cb(new UnAuthorizedAcsess(errrorMessage), false);
    }
  },
  credentials: true,
};
app.use(cors(corsOptions));

app.use(express.json());
app.use(requestLogger);
app.use(express.urlencoded({ extended: true }));

// Route add here
app.use('/health', (req: Request, res: Response, nextFn: NextFunction) => {
  logger.info(`req came at ${req.originalUrl}`);
  res.status(HTTPSTATUS.OK).json({
    message: 'everything is healthy like you!',
  });
});
app.use('/api/v1', routes);

// 404 catch unknown routes
app.use((req: Request, res: Response, nextFn: NextFunction) => {
  nextFn(new BadRequest(`Route ${req.originalUrl} not found`));
});

// Error handler
app.use(globalErrorHandler);

async function startServer() {
  const PORT = process.env.PORT || 8000;
  try {
    const server = app.listen(PORT, async () => {
      logger.info('connecting to db');
      await connectDb();
      logger.info(`server runing at ${PORT}`);
    });

    const shutdownSignals = ['SIGTERM', 'SIGINT'];
    shutdownSignals.forEach((sign) => {
      process.on(sign, async () => {
        try {
          server.close(() => {
            logger.info('server is closing due to ', sign);
          });
          // server closed now disconnect db
          await disconnectDb();
          // exit
          process.exit(0);
        } catch (e) {
          process.exit(0);
        }
      });
    });

    process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
      logger.error('Unhandled Promise Rejection', reason);
      process.exit(1);
    });

    process.on('uncaughtException', (reason: any, promise: Promise<any>) => {
      logger.error('Unhandled Exception Rejection', reason);
      process.exit(1);
    });
  } catch (e) {
    logger.error(
      e instanceof Error
        ? e.message
        : 'error occured starting server due to some reasons',
    );
  }
}

startServer();
