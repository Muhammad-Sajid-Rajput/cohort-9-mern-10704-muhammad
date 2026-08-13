import { describe, it, expect, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';

vi.mock('../models/notes.js');
vi.mock('../models/notes.chunk.js', () => ({
  NoteChunk: {
    insertMany: vi.fn(),
    deleteMany: vi.fn(),
    aggregate: vi.fn(),
  },
}));

vi.mock('../utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock('../utils/getEmbedings.js', () => ({
  getEmbedding: vi.fn().mockResolvedValue([0.1, 0.2, 0.3]),
  getEmbeddings: vi.fn().mockResolvedValue([[0.1, 0.2, 0.3]]),
}));

vi.mock('../utils/gemni.js', () => ({
  sendToGemni: vi.fn().mockResolvedValue({ reply: 'mocked reply' }),
}));

vi.mock('../utils/toObjectId.js', () => ({
  toObjectId: vi.fn((id) => id),
}));

vi.mock('@langchain/textsplitters', () => {
  const splitText = vi.fn().mockResolvedValue(['chunk one']);
  class RecursiveCharacterTextSplitter {
    splitText = splitText;
  }
  return { RecursiveCharacterTextSplitter };
});

import { Note } from '../models/notes.js';
import { NoteChunk } from '../models/notes.chunk.js';
import {
  createNoteOf,
  editNoteOf,
  getAllNotesOf,
  getNoteOf,
  deleteNoteOf,
  deleteAllNotesOf,
} from '../services/notes.services.js';

describe('Notes Services', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const userId = new mongoose.Types.ObjectId().toString();
  const noteBody = {
    title: 'Test Title',
    body: 'Test content',
    tags: ['work'] as any,
  };

  describe('createNoteOf', () => {
    it('should create a note and insert chunks successfully', async () => {
      const fakeNote = { _id: 'note123', ...noteBody };

      vi.mocked(Note.create).mockResolvedValue(fakeNote as any);
      vi.mocked(NoteChunk.insertMany).mockResolvedValue([] as any);

      const res = await createNoteOf(userId, noteBody);

      expect(Note.create).toHaveBeenCalledWith({
        title: noteBody.title,
        content: noteBody.body,
        tags: noteBody.tags,
        user: userId,
      });
      expect(NoteChunk.insertMany).toHaveBeenCalledOnce();
      expect(res.success).toBe(true);
      expect(res.message).toBe('Note created successfully');
      expect(res.note).toEqual(fakeNote);
    });

    it('should throw and log error when Note.create fails', async () => {
      const error = new Error('DB error');
      vi.mocked(Note.create).mockRejectedValue(error);

      await expect(createNoteOf(userId, noteBody)).rejects.toThrow('DB error');
    });
  });

  describe('editNoteOf', () => {
    it('should update a note, replace old chunks, and insert new chunks', async () => {
      const noteId = 'note123';
      const updatedNote = { _id: noteId, ...noteBody };

      vi.mocked(Note.findOneAndUpdate).mockResolvedValue(updatedNote as any);
      vi.mocked(NoteChunk.deleteMany).mockResolvedValue({
        deletedCount: 2,
      } as any);
      vi.mocked(NoteChunk.insertMany).mockResolvedValue([] as any);

      const res = await editNoteOf(userId, noteId, noteBody);

      expect(Note.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: noteId, user: userId },
        { title: noteBody.title, content: noteBody.body, tags: noteBody.tags },
        { new: true },
      );
      expect(NoteChunk.deleteMany).toHaveBeenCalledWith({
        noteId,
        user: userId,
      });
      expect(NoteChunk.insertMany).toHaveBeenCalledOnce();
      expect(res.success).toBe(true);
      expect(res.message).toBe('Note updated successfully');
      expect(res.note).toEqual(updatedNote);
    });

    it('should throw "Note not found or unauthorized" when note does not exist', async () => {
      vi.mocked(Note.findOneAndUpdate).mockResolvedValue(null);

      await expect(editNoteOf(userId, 'invalid-id', noteBody)).rejects.toThrow(
        'Note not found or unauthorized',
      );
    });

    it('should throw and log error when findOneAndUpdate fails', async () => {
      const error = new Error('DB error');
      vi.mocked(Note.findOneAndUpdate).mockRejectedValue(error);

      await expect(editNoteOf(userId, 'note123', noteBody)).rejects.toThrow(
        'DB error',
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

      expect(Note.find).toHaveBeenCalledWith({ user: userId });
      expect(res.notes).toEqual(notes);
      expect(res.pagination).toEqual({
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
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
        $or: [
          { title: { $regex: 'hello', $options: 'i' } },
          { content: { $regex: 'hello', $options: 'i' } },
          { tags: { $regex: 'hello', $options: 'i' } },
        ],
      });
    });

    it('should apply tag filter when tag is provided', async () => {
      const query = { page: 1, limit: 10, skip: 0, search: '', tag: 'work' as any };

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
        tags: 'work',
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
      const noteId = 'note123';
      const fakeNote = { _id: noteId, title: 'Test' };

      vi.mocked(Note.findOne).mockResolvedValue(fakeNote as any);

      const res = await getNoteOf(userId, noteId);

      expect(Note.findOne).toHaveBeenCalledWith({ _id: noteId, user: userId });
      expect(res.note).toEqual(fakeNote);
      expect(res.success).toBe(true);
      expect(res.message).toBe('Note fetched successfully');
    });

    it('should throw BadRequest when note is not found', async () => {
      vi.mocked(Note.findOne).mockResolvedValue(null);

      await expect(getNoteOf(userId, 'invalid')).rejects.toThrow(
        'Note not found',
      );
    });
  });

  describe('deleteNoteOf', () => {
    it('should delete a note and its chunks successfully', async () => {
      const noteId = 'note123';
      const fakeNote = { _id: noteId };

      vi.mocked(Note.findOneAndDelete).mockResolvedValue(fakeNote as any);
      vi.mocked(NoteChunk.deleteMany).mockResolvedValue({
        deletedCount: 3,
      } as any);

      const res = await deleteNoteOf(userId, noteId);

      expect(Note.findOneAndDelete).toHaveBeenCalledWith({
        _id: noteId,
        user: userId,
      });
      expect(NoteChunk.deleteMany).toHaveBeenCalledWith({
        noteId,
        user: userId,
      });
      expect(res.success).toBe(true);
      expect(res.message).toBe('Note deleted successfully');
      expect(res.note).toEqual(fakeNote);
    });

    it('should throw BadRequest when note is not found', async () => {
      vi.mocked(Note.findOneAndDelete).mockResolvedValue(null);

      await expect(deleteNoteOf(userId, 'invalid')).rejects.toThrow(
        'Note not found for this user',
      );
    });
  });

  describe('deleteAllNotesOf', () => {
    it('should delete all notes and chunks for a user', async () => {
      vi.mocked(Note.deleteMany).mockResolvedValue({ deletedCount: 5 } as any);
      vi.mocked(NoteChunk.deleteMany).mockResolvedValue({
        deletedCount: 12,
      } as any);

      const res = await deleteAllNotesOf(userId);

      expect(Note.deleteMany).toHaveBeenCalledWith({ user: userId });
      expect(NoteChunk.deleteMany).toHaveBeenCalledWith({ user: userId });
      expect(res.success).toBe(true);
      expect(res.message).toBe('All notes deleted successfully');
    });
  });
});
