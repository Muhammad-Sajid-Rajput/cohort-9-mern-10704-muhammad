import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createFolder,
  renameFolder,
  deleteFolder,
  getFoldersOf,
  getFolderDetails,
  addNoteToFolder,
  removeNoteFromFolder,
  getAllFoldersFlat,
  getTrashFoldersOf,
  restoreFolderOf,
  permanentDeleteFolderOf,
} from '../services/folder.services';
import { Folder } from '../models/folder';
import { Note } from '../models/notes';
import { logger } from '../utils/logger';
import { toObjectId } from '../utils/toObjectId';

vi.mock('../models/folder', () => ({
  Folder: {
    create: vi.fn(),
    findOneAndUpdate: vi.fn(),
    findOne: vi.fn(),
    find: vi.fn(),
    updateOne: vi.fn(),
    deleteOne: vi.fn(),
    countDocuments: vi.fn(),
  },
}));

vi.mock('../models/notes', () => ({
  Note: {
    findOneAndUpdate: vi.fn(),
    find: vi.fn(),
    updateMany: vi.fn(),
    deleteOne: vi.fn(),
    countDocuments: vi.fn(),
  },
}));

vi.mock('../utils/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

describe('folder.services', () => {
  const userId = toObjectId('507f1f77bcf86cd799439011');
  const folderId = toObjectId('507f1f77bcf86cd799439012');
  const noteId = toObjectId('507f1f77bcf86cd799439013');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createFolder', () => {
    it('should create a root-level folder when no parent is specified', async () => {
      const fakeFolder = { _id: folderId, name: 'Work', user: userId, parentFolder: null };
      vi.mocked(Folder.create).mockResolvedValue(fakeFolder as any);

      const res = await createFolder(userId, 'Work');
      expect(Folder.create).toHaveBeenCalledWith({
        name: 'Work',
        user: expect.any(Object),
        parentFolder: null,
      });
      expect(res.success).toBe(true);
      expect(res.folder).toEqual(fakeFolder);
    });

    it('should create a nested folder when parent exists', async () => {
      const parentId = '507f1f77bcf86cd799439014';
      vi.mocked(Folder.findOne).mockResolvedValue({ _id: parentId } as any);
      const fakeSubfolder = { _id: folderId, name: 'Projects', parentFolder: parentId };
      vi.mocked(Folder.create).mockResolvedValue(fakeSubfolder as any);

      const res = await createFolder(userId, 'Projects', parentId);
      expect(Folder.findOne).toHaveBeenCalledWith({
        _id: expect.any(Object),
        user: expect.any(Object),
        isDeleted: { $ne: true },
      });
      expect(res.success).toBe(true);
    });

    it('should throw when parent folder does not exist', async () => {
      vi.mocked(Folder.findOne).mockResolvedValue(null);
      await expect(createFolder(userId, 'Projects', '507f1f77bcf86cd799439014')).rejects.toThrow(
        'Parent folder not found',
      );
    });
  });

  describe('renameFolder', () => {
    it('should rename folder successfully', async () => {
      const fakeFolder = { _id: folderId, name: 'Work Renamed' };
      vi.mocked(Folder.findOneAndUpdate).mockResolvedValue(fakeFolder as any);

      const res = await renameFolder(userId, folderId, 'Work Renamed');
      expect(Folder.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: expect.any(Object), user: expect.any(Object), isDeleted: { $ne: true } },
        { name: 'Work Renamed' },
        { returnDocument: 'after' },
      );
      expect(res.success).toBe(true);
      expect(res.folder).toEqual(fakeFolder);
    });

    it('should throw when folder to rename is not found', async () => {
      vi.mocked(Folder.findOneAndUpdate).mockResolvedValue(null);
      await expect(renameFolder(userId, folderId, 'Work')).rejects.toThrow('Folder not found');
    });
  });

  describe('deleteFolder', () => {
    it('should permanently delete an empty folder', async () => {
      const fakeFolder = { _id: folderId, user: userId };
      vi.mocked(Folder.findOne).mockResolvedValue(fakeFolder as any);
      vi.mocked(Note.countDocuments).mockResolvedValue(0);
      vi.mocked(Folder.countDocuments).mockResolvedValue(0);
      vi.mocked(Folder.deleteOne).mockResolvedValue({ deletedCount: 1 } as any);

      const res = await deleteFolder(userId, folderId);
      expect(Folder.deleteOne).toHaveBeenCalledWith({
        _id: folderId,
        user: userId,
      });
      expect(res.success).toBe(true);
      expect(res.isPermanent).toBe(true);
    });

    it('should soft delete a non-empty folder to trash', async () => {
      const fakeFolder = {
        _id: folderId,
        user: userId,
        isDeleted: false,
        save: vi.fn().mockResolvedValue(true),
      };
      vi.mocked(Folder.findOne).mockResolvedValue(fakeFolder as any);
      vi.mocked(Note.countDocuments).mockResolvedValue(2);
      vi.mocked(Folder.countDocuments).mockResolvedValue(0);
      vi.mocked(Note.updateMany).mockResolvedValue({ modifiedCount: 2 } as any);
      vi.mocked(Folder.find).mockResolvedValue([]);

      const res = await deleteFolder(userId, folderId);
      expect(fakeFolder.isDeleted).toBe(true);
      expect(fakeFolder.save).toHaveBeenCalled();
      expect(Note.updateMany).toHaveBeenCalledWith(
        { user: userId, folder: folderId, isDeleted: { $ne: true } },
        { isDeleted: true, deletedAt: expect.any(Date) },
      );
      expect(res.success).toBe(true);
      expect(res.isPermanent).toBe(false);
    });
  });

  describe('restoreFolderOf', () => {
    it('should restore folder, its notes, and preserve parent folder', async () => {
      const parentId = '507f1f77bcf86cd799439014';
      const fakeFolder = {
        _id: folderId,
        parentFolder: parentId,
        isDeleted: true,
        save: vi.fn().mockResolvedValue(true),
      };
      const fakeParent = {
        _id: parentId,
        isDeleted: true,
        save: vi.fn().mockResolvedValue(true),
      };

      vi.mocked(Folder.findOne)
        .mockResolvedValueOnce(fakeFolder as any)
        .mockResolvedValueOnce(fakeParent as any);

      vi.mocked(Note.updateMany).mockResolvedValue({ modifiedCount: 1 } as any);
      vi.mocked(Folder.find).mockResolvedValue([]);

      const res = await restoreFolderOf(userId, folderId);
      expect(fakeFolder.isDeleted).toBe(false);
      expect(fakeFolder.save).toHaveBeenCalled();
      expect(fakeParent.isDeleted).toBe(false);
      expect(fakeParent.save).toHaveBeenCalled();
      expect(Note.updateMany).toHaveBeenCalledWith(
        { user: userId, folder: folderId, isDeleted: true },
        { isDeleted: false, deletedAt: null },
      );
      expect(res.success).toBe(true);
    });
  });

  describe('permanentDeleteFolderOf', () => {
    it('should permanently delete folder and its contents', async () => {
      const fakeFolder = { _id: folderId, user: userId };
      vi.mocked(Folder.findOne).mockResolvedValue(fakeFolder as any);
      vi.mocked(Note.find).mockResolvedValue([]);
      vi.mocked(Folder.find).mockResolvedValue([]);
      vi.mocked(Folder.deleteOne).mockResolvedValue({ deletedCount: 1 } as any);

      const res = await permanentDeleteFolderOf(userId, folderId);
      expect(Folder.deleteOne).toHaveBeenCalledWith({ _id: folderId });
      expect(res.success).toBe(true);
    });
  });

  describe('getFoldersOf', () => {
    it('should fetch folders with subfolder and note counts', async () => {
      const fakeFolderDoc = {
        _id: folderId,
        name: 'Work',
        toObject: () => ({ _id: folderId, name: 'Work' }),
      };
      vi.mocked(Folder.find).mockReturnValue({
        sort: vi.fn().mockResolvedValue([fakeFolderDoc]),
      } as any);
      vi.mocked(Folder.countDocuments).mockResolvedValue(2);
      vi.mocked(Note.countDocuments).mockResolvedValue(5);

      const res = await getFoldersOf(userId, null);
      expect(res.success).toBe(true);
      expect(res.folders).toHaveLength(1);
      expect(res.folders[0].subfolderCount).toBe(2);
      expect(res.folders[0].noteCount).toBe(5);
    });
  });

  describe('addNoteToFolder and removeNoteFromFolder', () => {
    it('should add note to folder', async () => {
      vi.mocked(Folder.findOne).mockResolvedValue({ _id: folderId } as any);
      vi.mocked(Note.findOneAndUpdate).mockResolvedValue({ _id: noteId, folder: folderId } as any);

      const res = await addNoteToFolder(userId, folderId, noteId);
      expect(Note.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: expect.any(Object), user: expect.any(Object), isDeleted: { $ne: true } },
        { folder: expect.any(Object) },
        { returnDocument: 'after' },
      );
      expect(res.success).toBe(true);
    });

    it('should remove note from folder', async () => {
      vi.mocked(Note.findOneAndUpdate).mockResolvedValue({ _id: noteId, folder: null } as any);

      const res = await removeNoteFromFolder(userId, folderId, noteId);
      expect(Note.findOneAndUpdate).toHaveBeenCalledWith(
        {
          _id: expect.any(Object),
          user: expect.any(Object),
          folder: expect.any(Object),
          isDeleted: { $ne: true },
        },
        { folder: null },
        { returnDocument: 'after' },
      );
      expect(res.success).toBe(true);
    });
  });

  describe('getAllFoldersFlat', () => {
    it('should fetch all folders flat', async () => {
      vi.mocked(Folder.find).mockReturnValue({
        sort: vi.fn().mockResolvedValue([{ _id: folderId, name: 'Work' }]),
      } as any);

      const res = await getAllFoldersFlat(userId);
      expect(res.success).toBe(true);
      expect(res.folders).toHaveLength(1);
    });
  });
});
