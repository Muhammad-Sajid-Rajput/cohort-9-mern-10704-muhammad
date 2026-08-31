import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createNoteOf,
  editNoteOf,
  getNotesOf,
  getNoteOf,
  deleteNoteOf,
  deleteAllNotesOf,
  getTrashNotesOf,
  restoreNoteOf,
  permanentDeleteNoteOf,
  emptyTrashOf,
} from '../services/notes.services';
import { Note, NoteTag } from '../models/notes';
import { NoteChunk } from '../models/notes.chunk';
import { Folder } from '../models/folder';
import { logger } from '../utils/logger';
import { getEmbeddings } from '../utils/getEmbedings';
import { toObjectId } from '../utils/toObjectId';

vi.mock('../models/folder', () => ({
  Folder: {
    findOne: vi.fn(),
    deleteMany: vi.fn(),
  },
}));

vi.mock('../models/notes', () => ({
  Note: {
    create: vi.fn(),
    findOneAndUpdate: vi.fn(),
    find: vi.fn(),
    findOne: vi.fn(),
    findOneAndDelete: vi.fn(),
    deleteMany: vi.fn(),
    updateMany: vi.fn(),
    countDocuments: vi.fn(),
  },
  NoteTag: {
    WORK: 'work',
    PERSONAL: 'personal',
    LIFE: 'life',
  },
}));

vi.mock('../models/notes.chunk', () => ({
  NoteChunk: {
    insertMany: vi.fn(),
    deleteMany: vi.fn(),
    updateMany: vi.fn(),
  },
}));

vi.mock('../utils/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock('../utils/getEmbedings', () => ({
  getEmbeddings: vi.fn(),
}));

vi.mock('@langchain/textsplitters', () => ({
  RecursiveCharacterTextSplitter: vi.fn().mockImplementation(function () {
    return {
      splitText: vi.fn().mockResolvedValue(['chunk 1', 'chunk 2']),
    };
  }),
}));

describe('notes.services', () => {
  const userId = toObjectId('507f1f77bcf86cd799439011');
  const noteBody = {
    title: 'Test Note',
    body: 'Test body content',
    tags: [NoteTag.WORK],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createNoteOf', () => {
    it('should create a note and insert chunks with correct payload', async () => {
      const fakeNote = { _id: toObjectId('507f1f77bcf86cd799439012'), title: noteBody.title };
      vi.mocked(Note.create).mockResolvedValue(fakeNote as any);
      vi.mocked(getEmbeddings).mockResolvedValue([[0.1], [0.2]]);

      const res = await createNoteOf(userId, noteBody);

      expect(Note.create).toHaveBeenCalledWith({
        title: noteBody.title,
        content: noteBody.body,
        tags: noteBody.tags,
        user: userId,
        folder: null,
      });
      expect(NoteChunk.insertMany).toHaveBeenCalledTimes(1);
      expect(res.success).toBe(true);
      expect(res.note).toEqual(fakeNote);
    });

    it('should validate folder when folderId is provided', async () => {
      const folderId = '507f1f77bcf86cd799439013';
      vi.mocked(Folder.findOne).mockResolvedValue({ _id: toObjectId(folderId) } as any);
      const fakeNote = { _id: toObjectId('507f1f77bcf86cd799439012'), title: noteBody.title };
      vi.mocked(Note.create).mockResolvedValue(fakeNote as any);
      vi.mocked(getEmbeddings).mockResolvedValue([[0.1], [0.2]]);

      const res = await createNoteOf(userId, { ...noteBody, folder: folderId });

      expect(Folder.findOne).toHaveBeenCalledWith({
        _id: expect.any(Object),
        user: expect.any(Object),
        isDeleted: { $ne: true },
      });
      expect(res.success).toBe(true);
    });

    it('should throw when provided folder is not found', async () => {
      vi.mocked(Folder.findOne).mockResolvedValue(null);

      await expect(
        createNoteOf(userId, { ...noteBody, folder: '507f1f77bcf86cd799439013' }),
      ).rejects.toThrow('Folder not found');
    });

    it('should log and rethrow when Note.create fails', async () => {
      const error = new Error('DB error');
      vi.mocked(Note.create).mockRejectedValue(error);

      await expect(createNoteOf(userId, noteBody)).rejects.toThrow('DB error');
      expect(logger.error).toHaveBeenCalledWith(
        'Error creating note',
        expect.objectContaining({ error: 'DB error' }),
      );
    });
  });

  describe('editNoteOf', () => {
    it('should update note and recreate chunks', async () => {
      const noteId = toObjectId('507f1f77bcf86cd799439012');
      const fakeUpdatedNote = { _id: noteId, ...noteBody };
      vi.mocked(Note.findOneAndUpdate).mockResolvedValue(fakeUpdatedNote as any);
      vi.mocked(NoteChunk.deleteMany).mockResolvedValue({} as any);
      vi.mocked(getEmbeddings).mockResolvedValue([[0.1], [0.2]]);

      const res = await editNoteOf(userId, noteId, noteBody);

      expect(Note.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: noteId, user: userId, isDeleted: { $ne: true } },
        { title: noteBody.title, content: noteBody.body, tags: noteBody.tags },
        { returnDocument: 'after' },
      );
      expect(NoteChunk.deleteMany).toHaveBeenCalledWith({ noteId, user: userId });
      expect(NoteChunk.insertMany).toHaveBeenCalledTimes(1);
      expect(res.success).toBe(true);
    });

    it('should throw when note does not exist', async () => {
      const noteId = toObjectId('507f1f77bcf86cd799439012');
      vi.mocked(Note.findOneAndUpdate).mockResolvedValue(null);

      await expect(editNoteOf(userId, noteId, noteBody)).rejects.toThrow(
        'Note not found or unauthorized',
      );
    });
  });

  describe('getNotesOf', () => {
    it('should return paginated notes with default limit and page', async () => {
      const fakeNotes = [{ title: 'Note 1' }, { title: 'Note 2' }];
      vi.mocked(Note.find).mockReturnValue({
        sort: vi.fn().mockReturnValue({
          skip: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue(fakeNotes),
          }),
        }),
      } as any);
      vi.mocked(Note.countDocuments).mockResolvedValue(2);

      const res = await getNotesOf(userId, 1, 10);

      expect(res.success).toBe(true);
      expect(res.notes).toEqual(fakeNotes);
      expect(res.pagination.total).toBe(2);
      expect(res.pagination.totalPages).toBe(1);
    });

    it('should filter by tag and search query', async () => {
      vi.mocked(Note.find).mockReturnValue({
        sort: vi.fn().mockReturnValue({
          skip: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      } as any);
      vi.mocked(Note.countDocuments).mockResolvedValue(0);

      await getNotesOf(userId, 1, 10, 'work', 'hello');

      expect(Note.find).toHaveBeenCalledWith({
        user: userId,
        isDeleted: { $ne: true },
        tags: 'work',
        $or: [
          { title: { $regex: 'hello', $options: 'i' } },
          { content: { $regex: 'hello', $options: 'i' } },
        ],
      });
    });
  });

  describe('getNoteOf', () => {
    it('should return note if found', async () => {
      const noteId = toObjectId('507f1f77bcf86cd799439012');
      const fakeNote = { _id: noteId, title: 'My Note' };
      vi.mocked(Note.findOne).mockResolvedValue(fakeNote as any);

      const res = await getNoteOf(userId, noteId);

      expect(Note.findOne).toHaveBeenCalledWith({ _id: noteId, user: userId, isDeleted: { $ne: true } });
      expect(res.success).toBe(true);
      expect(res.note).toEqual(fakeNote);
    });

    it('should throw if note is not found', async () => {
      const noteId = toObjectId('507f1f77bcf86cd799439012');
      vi.mocked(Note.findOne).mockResolvedValue(null);

      await expect(getNoteOf(userId, noteId)).rejects.toThrow('Note not found');
    });
  });

  describe('deleteNoteOf', () => {
    it('should soft delete note and mirror on chunks', async () => {
      const noteId = toObjectId('507f1f77bcf86cd799439012');
      const fakeDeletedNote = { _id: noteId, isDeleted: true };
      vi.mocked(Note.findOneAndUpdate).mockResolvedValue(fakeDeletedNote as any);
      vi.mocked(NoteChunk.updateMany).mockResolvedValue({ modifiedCount: 1 } as any);

      const res = await deleteNoteOf(userId, noteId);

      expect(Note.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: noteId, user: userId, isDeleted: { $ne: true } },
        { isDeleted: true, deletedAt: expect.any(Date) },
        { returnDocument: 'after' },
      );
      expect(NoteChunk.updateMany).toHaveBeenCalledWith(
        { noteId, user: userId },
        { isDeleted: true },
      );
      expect(res.success).toBe(true);
      expect(res.message).toBe('Note moved to trash');
    });

    it('should throw if note not found or already deleted', async () => {
      const noteId = toObjectId('507f1f77bcf86cd799439012');
      vi.mocked(Note.findOneAndUpdate).mockResolvedValue(null);

      await expect(deleteNoteOf(userId, noteId)).rejects.toThrow('Note not found or already in trash');
    });
  });

  describe('deleteAllNotesOf', () => {
    it('should move all notes to trash for a user', async () => {
      vi.mocked(Note.updateMany).mockResolvedValue({ modifiedCount: 5 } as any);

      const res = await deleteAllNotesOf(userId);

      expect(Note.updateMany).toHaveBeenCalledWith(
        { user: userId, isDeleted: { $ne: true } },
        { isDeleted: true, deletedAt: expect.any(Date) },
      );
      expect(res.success).toBe(true);
      expect(res.message).toBe('All notes moved to trash');
    });
  });

  describe('trash operations', () => {
    it('should fetch trash notes within 3 days', async () => {
      vi.mocked(Note.find).mockImplementation((filter: any, projection?: any) => {
        if (projection) {
          return Promise.resolve([]) as any;
        }
        return {
          sort: vi.fn().mockResolvedValue([{ title: 'Trash Note 1' }]),
        } as any;
      });

      const res = await getTrashNotesOf(userId);
      expect(res.success).toBe(true);
      expect(res.notes).toHaveLength(1);
    });

    it('should restore note from trash and un-delete chunks', async () => {
      const noteId = toObjectId('507f1f77bcf86cd799439012');
      const fakeRestoredNote = { _id: noteId, isDeleted: false };
      vi.mocked(Note.findOneAndUpdate).mockResolvedValue(fakeRestoredNote as any);
      vi.mocked(NoteChunk.updateMany).mockResolvedValue({ modifiedCount: 1 } as any);

      const res = await restoreNoteOf(userId, noteId);
      expect(Note.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: noteId, user: userId, isDeleted: true },
        { isDeleted: false, deletedAt: null },
        { returnDocument: 'after' },
      );
      expect(NoteChunk.updateMany).toHaveBeenCalledWith(
        { noteId, user: userId },
        { isDeleted: false },
      );
      expect(res.success).toBe(true);
      expect(res.message).toBe('Note restored successfully');
    });

    it('should permanently delete note and chunks', async () => {
      const noteId = toObjectId('507f1f77bcf86cd799439012');
      vi.mocked(Note.findOneAndDelete).mockResolvedValue({ _id: noteId } as any);
      vi.mocked(NoteChunk.deleteMany).mockResolvedValue({ deletedCount: 2 } as any);

      const res = await permanentDeleteNoteOf(userId, noteId);
      expect(Note.findOneAndDelete).toHaveBeenCalledWith({ _id: noteId, user: userId, isDeleted: true });
      expect(NoteChunk.deleteMany).toHaveBeenCalledWith({ noteId, user: userId });
      expect(res.success).toBe(true);
      expect(res.message).toBe('Note permanently deleted');
    });

    it('should empty trash permanently', async () => {
      vi.mocked(Note.find).mockResolvedValue([{ _id: 'n1' }, { _id: 'n2' }] as any);
      vi.mocked(Note.deleteMany).mockResolvedValue({ deletedCount: 2 } as any);
      vi.mocked(NoteChunk.deleteMany).mockResolvedValue({ deletedCount: 4 } as any);
      vi.mocked(Folder.deleteMany).mockResolvedValue({ deletedCount: 1 } as any);

      const res = await emptyTrashOf(userId);
      expect(Note.deleteMany).toHaveBeenCalledWith({ user: userId, isDeleted: true });
      expect(NoteChunk.deleteMany).toHaveBeenCalledWith({ noteId: { $in: ['n1', 'n2'] }, user: userId });
      expect(Folder.deleteMany).toHaveBeenCalledWith({ user: userId, isDeleted: true });
      expect(res.success).toBe(true);
      expect(res.message).toBe('Trash emptied successfully');
    });
  });
});
