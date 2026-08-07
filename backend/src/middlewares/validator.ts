import { Request, Response, NextFunction } from 'express';
import { UnauthorizedAccess } from '../utils/appError';
import { verifyJwtToken } from '../utils/jwt';

export const validationJwtMiddleware = async (
  req: Request,
  res: Response,
  nextFn: NextFunction,
) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      throw new UnauthorizedAccess('No token provided');
    }

    const decoded = verifyJwtToken(token);

    if (!decoded.userId) {
      throw new UnauthorizedAccess('Invalid token payload');
    }
    req.userId = String(decoded.userId);
    nextFn();
  } catch (e) {
    nextFn(e);
  }
};
