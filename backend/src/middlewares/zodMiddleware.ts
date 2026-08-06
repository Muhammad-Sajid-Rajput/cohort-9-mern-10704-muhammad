import { Response, Request, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export const zodMiddleware =
  (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (e) {
      next(e);
    }
  };
