import z from 'zod';
import { NoteTag } from '../models/notes';

const titleNote = z.string().trim().min(3).max(255);
const noteBody = z.string().trim().min(10).max(50000);
const enumTags = z.nativeEnum(NoteTag);

const objectIdRegex = /^[a-f\d]{24}$/i;

export const noteSchemaValidationBody = z.object({
  title: titleNote,
  body: noteBody,
  tags: z.array(enumTags),
});

export const paramsSchema = z.object({
  noteId: z.string().regex(objectIdRegex, 'Invalid note ID'),
});

export const notesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  search: z.string().optional().default(''),
  tag: enumTags.optional(),
});

export const chatSchema = z.object({
  message: z.string().trim().min(1).max(2000),
});
