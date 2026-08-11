import z from 'zod';
import { noteSchemaValidationBody } from '../schemas/notes.zod';

export type NotesBody = z.infer<typeof noteSchemaValidationBody>;
