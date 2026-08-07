import { IUser } from '../models/user';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      user?: IUser;
    }
  }
}
