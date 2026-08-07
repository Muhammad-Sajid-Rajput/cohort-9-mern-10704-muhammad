import { Response, Request, NextFunction } from 'express';
import { ZodType } from 'zod';

export const zodMiddleware =
  (schema: ZodType) => (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (e) {
      next(e);
    }
  };
