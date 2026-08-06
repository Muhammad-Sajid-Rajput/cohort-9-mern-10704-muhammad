import { Router } from 'express';
import { authRoute } from './auth.routes';

export const routes = Router();
routes.use('/auth', authRoute);
