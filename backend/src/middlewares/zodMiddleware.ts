import { Response, Request, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export const zodMiddleware =
  (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body); // this will automatic throws error which will later handled by our middleware
      next(); // otherwise data will be pased simple asf
    } catch (e) {
      next(e); // at here
    }
  };
