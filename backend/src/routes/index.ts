import { Router } from 'express';
import { authRoute } from './auth.routes';
import { notesRoutes } from './notes.routes';

export const routes = Router();
routes.use('/auth', authRoute);
routes.use('/notes', notesRoutes);
