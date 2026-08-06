import mongoose from 'mongoose';
import { IUser } from '../models/user';
declare global {
  namespace Express {
    interface Request {
      userId?: string | mongoose.Types.ObjectId;
      user?: IUser;
    }
  }
}
