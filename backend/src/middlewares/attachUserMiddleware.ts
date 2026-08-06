import { User } from '../models/user';
import { UnauthorizedAccess } from '../utils/appError';
import type { Request, Response, NextFunction } from 'express';

export const attachUserMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const user = await User.findById(req.userId);

  if (!user) {
    return next(new UnauthorizedAccess('User not found'));
  }

  if (!user.isEmailVerified) {
    return next(new UnauthorizedAccess('Email not verified'));
  }

  req.user = user;

  next();
};
