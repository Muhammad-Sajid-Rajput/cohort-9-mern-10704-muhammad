import { asyncHandler } from '../middlewares/asyncHandler';
import type { Request, Response } from 'express';
import { noteSchemaValidationBody, notesQuerySchema, paramsSchema } from '../schemas/notes.zod';
import {
  createNoteOf,
  deleteAllNotesOf,
  deleteNoteOf,
  editNoteOf,
  getAllNotesOf,
  getNoteOf,
} from '../services/notes.services';
import { HTTPSTATUS } from '../utils/enums';
import { UnauthorizedAccess } from '../utils/appError';
import { toObjectId } from '../utils/toObjectId';

export const createNote = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    if (!userId) throw new UnauthorizedAccess('User not authenticated');
    const noteBody = noteSchemaValidationBody.parse(req.body);
    const createdNote = await createNoteOf(userId, noteBody);
    return res.status(HTTPSTATUS.CREATED).json({
      message: createdNote.message,
      success: createdNote.success,
      note: createdNote.note,
    });
  },
);

export const editNote = asyncHandler(
  async (req: Request, res: Response) => {
    const { noteId } = paramsSchema.parse(req.params);
    if (!req.user?._id) throw new UnauthorizedAccess('User not authenticated');
    const noteBody = noteSchemaValidationBody.parse(req.body);
    const editedNote = await editNoteOf(
      toObjectId(req.user._id),
      toObjectId(noteId),
      noteBody,
    );
    return res.status(HTTPSTATUS.OK).json({
      message: editedNote.message,
      success: editedNote.success,
      note: editedNote.note,
    });
  },
);

export const getAllNotes = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    if (!userId) throw new UnauthorizedAccess('User not authenticated');
    const { page, limit, search, tag } = notesQuerySchema.parse(req.query);
    const allNotes = await getAllNotesOf(userId, {
      page,
      limit,
      skip: (page - 1) * limit,
      search,
      tag,
    });
    return res.status(HTTPSTATUS.OK).json({
      message: allNotes.message,
      success: allNotes.success,
      notes: allNotes.notes,
      pagination: allNotes.pagination,
    });
  },
);

export const getNote = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    if (!userId) throw new UnauthorizedAccess('User not authenticated');
    const { noteId } = paramsSchema.parse(req.params);
    const singleNote = await getNoteOf(userId, toObjectId(noteId));
    return res.status(HTTPSTATUS.OK).json({
      message: singleNote.message,
      success: singleNote.success,
      note: singleNote.note,
    });
  },
);

export const deleteNote = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    if (!userId) throw new UnauthorizedAccess('User not authenticated');
    const { noteId } = paramsSchema.parse(req.params);
    const deletedNote = await deleteNoteOf(userId, toObjectId(noteId));
    return res.status(HTTPSTATUS.OK).json({
      message: deletedNote.message,
      success: deletedNote.success,
      note: deletedNote.note,
    });
  },
);

export const deleteAllNotes = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    if (!userId) throw new UnauthorizedAccess('User not authenticated');
    const deletedNotes = await deleteAllNotesOf(userId);
    return res.status(HTTPSTATUS.OK).json({
      message: deletedNotes.message,
      success: deletedNotes.success,
      notes: deletedNotes.notes,
    });
  },
);
