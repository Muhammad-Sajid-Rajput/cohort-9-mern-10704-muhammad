import { Router } from 'express';
import {
  chat,
  createNote,
  deleteAllNotes,
  deleteNote,
  editNote,
  getAllNotes,
  getNote,
  getTrashNotes,
  restoreNote,
  permanentDeleteNote,
  emptyTrash,
} from '../controllers/notes';
import { attachUserMiddleware } from '../middlewares/attachUserMiddleware';
import { validationJwtMiddleware } from '../middlewares/validator';
import { zodMiddleware } from '../middlewares/zodMiddleware';
import { noteSchemaValidationBody } from '../schemas/notes.zod';

export const notesRoutes = Router();

notesRoutes.use(validationJwtMiddleware, attachUserMiddleware);

notesRoutes.post('/', zodMiddleware(noteSchemaValidationBody), createNote);
notesRoutes.get('/trash', getTrashNotes);
notesRoutes.delete('/trash', emptyTrash);
notesRoutes.post('/trash/:noteId/restore', restoreNote);
notesRoutes.delete('/trash/:noteId', permanentDeleteNote);

notesRoutes.put('/:noteId', zodMiddleware(noteSchemaValidationBody), editNote);
notesRoutes.get('/', getAllNotes);
notesRoutes.get('/:noteId', getNote);
notesRoutes.delete('/:noteId', deleteNote);
notesRoutes.delete('/', deleteAllNotes);
notesRoutes.post('/chat', chat);
