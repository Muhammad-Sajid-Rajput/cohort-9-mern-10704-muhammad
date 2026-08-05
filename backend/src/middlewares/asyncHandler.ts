import type { Request, Response, NextFunction } from 'express';
type functionType = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<any>;

export const asyncHandler =
  (fn: functionType) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await fn(req, res, next);
    } catch (e) {
      next(e);
    }
  };
