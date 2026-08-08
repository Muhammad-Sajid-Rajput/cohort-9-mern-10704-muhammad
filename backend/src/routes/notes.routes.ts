import { Router } from 'express';
import {
  createNote,
  deleteAllNotes,
  deleteNote,
  editNote,
  getAllNotes,
  getNote,
} from '../controllers/notes';
import { attachUserMiddleware } from '../middlewares/attachUserMiddleware';
import { validationJwtMiddleware } from '../middlewares/validator';
import { zodMiddleware } from '../middlewares/zodMiddleware';
import { noteSchemaValidationBody } from '../schemas/notes.zod';

export const notesRoutes = Router();

notesRoutes.use(validationJwtMiddleware, attachUserMiddleware);
notesRoutes.post('/', zodMiddleware(noteSchemaValidationBody), createNote);
notesRoutes.put('/:noteId', zodMiddleware(noteSchemaValidationBody), editNote);
notesRoutes.get('/', getAllNotes);
notesRoutes.get('/:noteId', getNote);
notesRoutes.delete('/:noteId', deleteNote);
notesRoutes.delete('/', deleteAllNotes);
