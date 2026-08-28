import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createNoteOf,
  editNoteOf,
  getAllNotesOf,
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
import { logger } from '../utils/logger';
import { getEmbeddings } from '../utils/getEmbedings';

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
  RecursiveCharacterTextSplitter: vi.fn().mockImplementation(function() {
    return {
      splitText: vi.fn().mockResolvedValue(['chunk 1', 'chunk 2']),
    };
  }),
}));

describe('notes.services', () => {
  const userId = '507f1f77bcf86cd799439011';
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
      const fakeNote = { _id: '507f1f77bcf86cd799439012', title: noteBody.title };
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

    it('should log and rethrow when Note.create fails', async () => {
      const error = new Error('DB error');
      vi.mocked(Note.create).mockRejectedValue(error);

      await expect(createNoteOf(userId, noteBody)).rejects.toThrow('DB error');
      expect(logger.error).toHaveBeenCalledWith(
        'Error creating note',
        { error: 'DB error' },
      );
    });
  });

  describe('editNoteOf', () => {
    it('should update a note, replace old chunks, and insert new chunks with correct payload', async () => {
      const noteId = '507f1f77bcf86cd799439012';
      const fakeNote = { _id: noteId, ...noteBody };
      vi.mocked(Note.findOneAndUpdate).mockResolvedValue(fakeNote as any);
      vi.mocked(NoteChunk.deleteMany).mockResolvedValue({ deletedCount: 2 } as any);
      vi.mocked(getEmbeddings).mockResolvedValue([[0.1], [0.2]]);

      const res = await editNoteOf(userId, noteId, noteBody);

      expect(Note.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: noteId, user: userId },
        { title: noteBody.title, content: noteBody.body, tags: noteBody.tags },
        { returnDocument: 'after' },
      );
      expect(NoteChunk.deleteMany).toHaveBeenCalledWith({ noteId, user: userId });
      expect(NoteChunk.insertMany).toHaveBeenCalledTimes(1);
      expect(res.success).toBe(true);
      expect(res.note).toEqual(fakeNote);
    });

    it('should throw when note does not exist', async () => {
      vi.mocked(Note.findOneAndUpdate).mockResolvedValue(null);

      await expect(editNoteOf(userId, 'invalid', noteBody)).rejects.toThrow(
        'Note not found or unauthorized',
      );
    });

    it('should log and rethrow when findOneAndUpdate fails', async () => {
      const error = new Error('DB error');
      vi.mocked(Note.findOneAndUpdate).mockRejectedValue(error);

      await expect(editNoteOf(userId, '507f1f77bcf86cd799439012', noteBody)).rejects.toThrow('DB error');
      expect(logger.error).toHaveBeenCalledWith(
        'Error updating note',
        { error: 'DB error' },
      );
    });
  });

  describe('getAllNotesOf', () => {
    it('should return paginated notes without filters', async () => {
      const query = { page: 1, limit: 10, skip: 0, search: '', tag: undefined };
      const notes = [{ title: 'Note 1' }];

      const mockFind = {
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(notes),
      };
      vi.mocked(Note.find).mockReturnValue(mockFind as any);
      vi.mocked(Note.countDocuments).mockResolvedValue(1);

      const res = await getAllNotesOf(userId, query);

      expect(Note.find).toHaveBeenCalledWith({ user: userId, isDeleted: { $ne: true } });
      expect(res.notes).toEqual(notes);
      expect(res.pagination).toEqual({ total: 1, page: 1, limit: 10, totalPages: 1 });
      expect(res.success).toBe(true);
    });

    it('should apply regex search filter when search is provided', async () => {
      const query = { page: 1, limit: 10, skip: 0, search: 'hello', tag: undefined };

      const mockFind = {
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };
      vi.mocked(Note.find).mockReturnValue(mockFind as any);
      vi.mocked(Note.countDocuments).mockResolvedValue(0);

      await getAllNotesOf(userId, query);

      expect(Note.find).toHaveBeenCalledWith({
        user: userId,
        isDeleted: { $ne: true },
        $or: [
          { title: { $regex: 'hello', $options: 'i' } },
          { content: { $regex: 'hello', $options: 'i' } },
          { tags: { $regex: 'hello', $options: 'i' } },
        ],
      });
    });

    it('should apply tag filter when tag is provided', async () => {
      const query = { page: 1, limit: 10, skip: 0, search: '', tag: NoteTag.WORK };

      const mockFind = {
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };
      vi.mocked(Note.find).mockReturnValue(mockFind as any);
      vi.mocked(Note.countDocuments).mockResolvedValue(0);

      await getAllNotesOf(userId, query);

      expect(Note.find).toHaveBeenCalledWith({
        user: userId,
        isDeleted: { $ne: true },
        tags: NoteTag.WORK,
      });
    });

    it('should calculate totalPages correctly', async () => {
      const query = { page: 2, limit: 5, skip: 5, search: '', tag: undefined };

      const mockFind = {
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };
      vi.mocked(Note.find).mockReturnValue(mockFind as any);
      vi.mocked(Note.countDocuments).mockResolvedValue(13);

      const res = await getAllNotesOf(userId, query);

      expect(res.pagination.totalPages).toBe(3);
    });
  });

  describe('getNoteOf', () => {
    it('should return a single note when found', async () => {
      const noteId = '507f1f77bcf86cd799439012';
      const fakeNote = { _id: noteId, title: 'Test' };

      vi.mocked(Note.findOne).mockResolvedValue(fakeNote as any);

      const res = await getNoteOf(userId, noteId);

      expect(Note.findOne).toHaveBeenCalledWith({ _id: noteId, user: userId, isDeleted: { $ne: true } });
      expect(res.note).toEqual(fakeNote);
      expect(res.success).toBe(true);
      expect(res.message).toBe('Note fetched successfully');
    });

    it('should throw when note is not found', async () => {
      vi.mocked(Note.findOne).mockResolvedValue(null);

      await expect(getNoteOf(userId, 'invalid')).rejects.toThrow('Note not found');
    });
  });

  describe('deleteNoteOf', () => {
    it('should move a note to trash successfully', async () => {
      const noteId = '507f1f77bcf86cd799439012';
      const fakeNote = { _id: noteId, isDeleted: true };

      vi.mocked(Note.findOneAndUpdate).mockResolvedValue(fakeNote as any);

      const res = await deleteNoteOf(userId, noteId);

      expect(Note.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: noteId, user: userId, isDeleted: { $ne: true } },
        { isDeleted: true, deletedAt: expect.any(Date) },
        { returnDocument: 'after' },
      );
      expect(res.success).toBe(true);
      expect(res.message).toBe('Note moved to trash');
      expect(res.note).toEqual(fakeNote);
    });

    it('should throw when note is not found', async () => {
      vi.mocked(Note.findOneAndUpdate).mockResolvedValue(null);

      await expect(deleteNoteOf(userId, 'invalid')).rejects.toThrow(
        'Note not found for this user',
      );
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

    it('should restore note from trash', async () => {
      const noteId = '507f1f77bcf86cd799439012';
      const fakeRestoredNote = { _id: noteId, isDeleted: false };
      vi.mocked(Note.findOneAndUpdate).mockResolvedValue(fakeRestoredNote as any);

      const res = await restoreNoteOf(userId, noteId);
      expect(Note.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: noteId, user: userId, isDeleted: true },
        { isDeleted: false, deletedAt: null },
        { returnDocument: 'after' },
      );
      expect(res.success).toBe(true);
      expect(res.message).toBe('Note restored successfully');
    });

    it('should permanently delete note and chunks', async () => {
      const noteId = '507f1f77bcf86cd799439012';
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

      const res = await emptyTrashOf(userId);
      expect(Note.deleteMany).toHaveBeenCalledWith({ user: userId, isDeleted: true });
      expect(res.success).toBe(true);
      expect(res.message).toBe('Trash emptied successfully');
    });
  });
});
