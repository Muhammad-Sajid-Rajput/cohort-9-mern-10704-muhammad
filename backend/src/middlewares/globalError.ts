import { ZodError } from 'zod';
import type { Response, Request, NextFunction } from 'express';
import { ErrorCodeEnums, HTTPSTATUS } from '../utils/enums';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';

export const formatZodErrors = (res: Response, errorZod: ZodError) => {
  const errors = errorZod?.issues?.map((error) => {
    return {
      field: error.path.join(' '),
      message: error.message,
      success: false,
    };
  });

  res.status(HTTPSTATUS.BAD_REQUEST).json({
    message: 'validation failed',
    errors,
    errorCode: ErrorCodeEnums.VALIDATION_ERROR,
  });
};

type ErrorThatCanOccur = SyntaxError | AppError | ZodError | Error;

export const globalErrorHandler = (
  error: ErrorThatCanOccur,
  req: Request,
  res: Response,
  nextFn: NextFunction,
) => {
  if (res.headersSent) {
    return nextFn(error);
  }

  logger.error(`Error occurred: ${error}`);

  if (error instanceof SyntaxError && 'body' in error) {
    return res.status(HTTPSTATUS.BAD_REQUEST).json({
      message: 'Invalid JSON request body',
      errorCode: ErrorCodeEnums.VALIDATION_ERROR,
      success: false,
    });
  }

  if (error instanceof ZodError) {
    return formatZodErrors(res, error);
  }

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      message: error.message || 'An error occurred',
      success: false,
      errorCode: error.errorCode || ErrorCodeEnums.VALIDATION_ERROR,
    });
  }

  return res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
    success: false,
    message: 'Internal Server Error',
  });
};
