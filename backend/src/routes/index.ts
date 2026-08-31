import { Router } from 'express';
import { authRoute } from './auth.routes';
import { notesRoutes } from './notes.routes';
import { folderRoutes } from './folder.routes';

export const routes = Router();
routes.use('/auth', authRoute);
routes.use('/notes', notesRoutes);
routes.use('/folders', folderRoutes);
