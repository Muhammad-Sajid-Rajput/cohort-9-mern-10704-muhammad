import z from 'zod';

const titleNote = z.string().max(255).min(3);
const noteBody = z.string().max(50000).min(10);
const enumTags = z.enum(['work', 'personal', 'life']);

export const noteSchemaValidationBody = z.object({
  title: titleNote,
  body: noteBody,
  tags: z.array(enumTags),
});

export const paramsSchema = z.object({
  noteId: z.string(),
});

export const notesQuerySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('10'),
  search: z.string().optional().default(''),
  tag: z.string().optional().default(''),
});
