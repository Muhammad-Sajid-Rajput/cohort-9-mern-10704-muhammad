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
  logger.error(`error occured ${error}`);

  if (error instanceof SyntaxError && 'body' in error) {
    return res.status(HTTPSTATUS.BAD_REQUEST).json({
      message: 'bad request body request json , please check your body',
      errorCode: ErrorCodeEnums.VALIDATION_ERROR,
      success: false,
    });
  }

  if (error instanceof ZodError) {
    return formatZodErrors(res, error);
  }

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      message:
        error.message ||
        'error occured at ap level check logs to identify the error',
      success: false,
      errorCode: error.errorCode || ErrorCodeEnums.VALIDATION_ERROR,
    });
  }

  // if everything pass means internal server error
  return res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
    success: false,
    message: 'Internal Server Error',
    error: error?.message || 'unknown error',
  });
};
