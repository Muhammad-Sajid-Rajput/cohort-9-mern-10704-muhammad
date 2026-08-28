import z from 'zod';

const objectIdRegex = /^[a-f\d]{24}$/i;

export const createFolderSchema = z.object({
  name: z.string().trim().min(1, 'Folder name is required').max(100, 'Folder name cannot exceed 100 characters'),
  parentFolderId: z.string().regex(objectIdRegex, 'Invalid parent folder ID').optional().nullable(),
});

export const renameFolderSchema = z.object({
  name: z.string().trim().min(1, 'Folder name is required').max(100, 'Folder name cannot exceed 100 characters'),
});

export const folderIdParamSchema = z.object({
  folderId: z.string().regex(objectIdRegex, 'Invalid folder ID'),
});

export const folderNoteParamSchema = z.object({
  folderId: z.string().regex(objectIdRegex, 'Invalid folder ID'),
  noteId: z.string().regex(objectIdRegex, 'Invalid note ID'),
});

export const addNoteToFolderSchema = z.object({
  noteId: z.string().regex(objectIdRegex, 'Invalid note ID'),
});
