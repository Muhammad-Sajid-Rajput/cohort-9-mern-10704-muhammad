import { NoteChunk } from '../models/notes.chunk';
import mongoose, { type QueryFilter } from 'mongoose';
import { Folder, IFolder } from '../models/folder';
import { Note, INote } from '../models/notes';
import { BadRequest } from '../utils/appError';
import { toObjectId } from '../utils/toObjectId';
import { logger } from '../utils/logger';

type MongooseIdOrString = string | mongoose.Types.ObjectId;

export const createFolder = async (
  userId: MongooseIdOrString,
  name: string,
  parentFolderId?: string | null,
) => {
  try {
    if (parentFolderId) {
      const parent = await Folder.findOne({
        _id: toObjectId(parentFolderId),
        user: toObjectId(userId),
        isDeleted: { $ne: true },
      });
      if (!parent) {
        throw new BadRequest('Parent folder not found');
      }
    }

    const folder = await Folder.create({
      name: name.trim(),
      user: toObjectId(userId),
      parentFolder: parentFolderId ? toObjectId(parentFolderId) : null,
    });

    return { message: 'Folder created successfully', success: true, folder };
  } catch (e) {
    logger.error('Error creating folder', { error: e instanceof Error ? e.message : e });
    throw e;
  }
};

export const renameFolder = async (
  userId: MongooseIdOrString,
  folderId: MongooseIdOrString,
  name: string,
) => {
  try {
    const folder = await Folder.findOneAndUpdate(
      {
        _id: toObjectId(folderId),
        user: toObjectId(userId),
        isDeleted: { $ne: true },
      },
      { name: name.trim() },
      { returnDocument: 'after' },
    );

    if (!folder) {
      throw new BadRequest('Folder not found');
    }

    return { message: 'Folder renamed successfully', success: true, folder };
  } catch (e) {
    logger.error('Error renaming folder', { error: e instanceof Error ? e.message : e });
    throw e;
  }
};

export const deleteFolder = async (
  userId: MongooseIdOrString,
  folderId: MongooseIdOrString,
) => {
  try {
    const folder = await Folder.findOne({
      _id: toObjectId(folderId),
      user: toObjectId(userId),
      isDeleted: { $ne: true },
    });

    if (!folder) {
      throw new BadRequest('Folder not found');
    }

    // Check if folder is empty (0 total notes and 0 active subfolders)
    const [noteCount, subfolderCount] = await Promise.all([
      Note.countDocuments({
        user: toObjectId(userId),
        folder: folder._id,
      }),
      Folder.countDocuments({
        user: toObjectId(userId),
        parentFolder: folder._id,
        isDeleted: { $ne: true },
      }),
    ]);

    const isEmpty = noteCount === 0 && subfolderCount === 0;

    if (isEmpty) {
      // Empty folder is deleted permanently
      await Folder.deleteOne({ _id: folder._id, user: toObjectId(userId) });
      return {
        message: 'Empty folder deleted permanently',
        success: true,
        folder: null,
        isPermanent: true,
      };
    }

    // Non-empty folder goes to Trash for 3 days
    const deletedAt = new Date();
    folder.isDeleted = true;
    folder.deletedAt = deletedAt;
    await folder.save();

    // Soft delete contained notes and their chunks
    const folderNotes = await Note.find({ user: toObjectId(userId), folder: folder._id }, { _id: 1 });
    const folderNoteIds = folderNotes.map((n) => n._id);

    await Note.updateMany(
      { user: toObjectId(userId), folder: folder._id, isDeleted: { $ne: true } },
      { isDeleted: true, deletedAt },
    );
    await NoteChunk.updateMany(
      { noteId: { $in: folderNoteIds } },
      { isDeleted: true },
    );

    // Recursively soft-delete child subfolders and their notes
    const softDeleteSubtree = async (parentId: mongoose.Types.ObjectId) => {
      const subfolders = await Folder.find({
        user: toObjectId(userId),
        parentFolder: parentId,
        isDeleted: { $ne: true },
      });

      for (const sub of subfolders) {
        sub.isDeleted = true;
        sub.deletedAt = deletedAt;
        await sub.save();

        const subNotes = await Note.find({ user: toObjectId(userId), folder: sub._id }, { _id: 1 });
        const subNoteIds = subNotes.map((n) => n._id);

        await Note.updateMany(
          { user: toObjectId(userId), folder: sub._id, isDeleted: { $ne: true } },
          { isDeleted: true, deletedAt },
        );
        await NoteChunk.updateMany(
          { noteId: { $in: subNoteIds } },
          { isDeleted: true },
        );
        await softDeleteSubtree(sub._id);
      }
    };

    await softDeleteSubtree(folder._id);

    return {
      message: 'Folder moved to Trash (retained for 3 days)',
      success: true,
      folder,
      isPermanent: false,
    };
  } catch (e) {
    logger.error('Error deleting folder', { error: e instanceof Error ? e.message : e });
    throw e;
  }
};

export const getTrashFoldersOf = async (userId: MongooseIdOrString) => {
  try {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

    // Permanently purge folders older than 3 days
    const expiredFolders = await Folder.find({
      user: toObjectId(userId),
      isDeleted: true,
      deletedAt: { $lt: threeDaysAgo },
    });

    if (expiredFolders.length > 0) {
      const collectSubtreeFolderIds = async (
        parentIds: mongoose.Types.ObjectId[],
      ): Promise<mongoose.Types.ObjectId[]> => {
        const subfolders = await Folder.find(
          { user: toObjectId(userId), parentFolder: { $in: parentIds } },
          { _id: 1 },
        );
        if (subfolders.length === 0) return [];
        const subIds = subfolders.map((s) => s._id);
        const nestedIds = await collectSubtreeFolderIds(subIds);
        return [...subIds, ...nestedIds];
      };

      const rootExpiredIds = expiredFolders.map((f) => f._id);
      const subfolderIds = await collectSubtreeFolderIds(rootExpiredIds);
      const allFolderIds = [...rootExpiredIds, ...subfolderIds];

      const notes = await Note.find(
        { user: toObjectId(userId), folder: { $in: allFolderIds } },
        { _id: 1 },
      );
      const noteIds = notes.map((n) => n._id);

      await Promise.all([
        NoteChunk.deleteMany({ noteId: { $in: noteIds } }),
        Note.deleteMany({ _id: { $in: noteIds }, user: toObjectId(userId) }),
        Folder.deleteMany({ _id: { $in: allFolderIds }, user: toObjectId(userId) }),
      ]);
    }

    // Fetch folders in trash within 3 days
    const folders = await Folder.find({
      user: toObjectId(userId),
      isDeleted: true,
      deletedAt: { $gte: threeDaysAgo },
    }).sort({ deletedAt: -1 });

    const enriched = await Promise.all(
      folders.map(async (f) => {
        let parentName: string | null = null;
        if (f.parentFolder) {
          const parent = await Folder.findOne({ _id: f.parentFolder, user: toObjectId(userId) });
          if (parent) parentName = parent.name;
        }

        const noteCount = await Note.countDocuments({
          user: toObjectId(userId),
          folder: f._id,
          isDeleted: true,
        });

        return {
          ...f.toObject(),
          parentName,
          noteCount,
        };
      }),
    );

    return { message: 'Trash folders fetched', success: true, folders: enriched };
  } catch (e) {
    logger.error('Error fetching trash folders', { error: e instanceof Error ? e.message : e });
    throw e;
  }
};

export const restoreFolderOf = async (
  userId: MongooseIdOrString,
  folderId: MongooseIdOrString,
) => {
  try {
    const folder = await Folder.findOne({
      _id: toObjectId(folderId),
      user: toObjectId(userId),
      isDeleted: true,
    });

    if (!folder) {
      throw new BadRequest('Folder not found in Trash');
    }

    const cascadeDeletedAt = folder.deletedAt;

    // Restore every trashed ancestor so the folder is reachable from the root
    let ancestorId = folder.parentFolder;
    while (ancestorId) {
      const ancestor: IFolder | null = await Folder.findOne({
        _id: ancestorId,
        user: toObjectId(userId),
      });

      if (!ancestor) {
        // Ancestor was permanently deleted, convert to root folder
        folder.parentFolder = null;
        break;
      }

      if (ancestor.isDeleted) {
        ancestor.isDeleted = false;
        ancestor.deletedAt = null;
        await ancestor.save();

        const ancestorNoteFilter: QueryFilter<INote> = {
          user: toObjectId(userId),
          folder: ancestor._id,
          isDeleted: true,
        };
        if (cascadeDeletedAt) {
          ancestorNoteFilter.deletedAt = cascadeDeletedAt;
        }

        const ancestorNotes = await Note.find(ancestorNoteFilter, { _id: 1 });
        const ancestorNoteIds = ancestorNotes.map((n) => n._id);

        await Note.updateMany(ancestorNoteFilter, { isDeleted: false, deletedAt: null });
        await NoteChunk.updateMany({ noteId: { $in: ancestorNoteIds } }, { isDeleted: false });
      }

      ancestorId = ancestor.parentFolder;
    }

    folder.isDeleted = false;
    folder.deletedAt = null;
    await folder.save();

    // Restore notes belonging to this folder and their chunks (scoped to cascadeDeletedAt if present)
    const folderNoteFilter: QueryFilter<INote> = {
      user: toObjectId(userId),
      folder: folder._id,
      isDeleted: true,
    };
    if (cascadeDeletedAt) {
      folderNoteFilter.deletedAt = cascadeDeletedAt;
    }

    const folderNotes = await Note.find(folderNoteFilter, { _id: 1 });
    const folderNoteIds = folderNotes.map((n) => n._id);

    await Note.updateMany(folderNoteFilter, { isDeleted: false, deletedAt: null });
    await NoteChunk.updateMany({ noteId: { $in: folderNoteIds } }, { isDeleted: false });

    // Recursively restore subfolders and their notes (scoped to cascadeDeletedAt)
    const restoreSubtree = async (parentId: mongoose.Types.ObjectId) => {
      const subfolderFilter: QueryFilter<IFolder> = {
        user: toObjectId(userId),
        parentFolder: parentId,
        isDeleted: true,
      };
      if (cascadeDeletedAt) {
        subfolderFilter.deletedAt = cascadeDeletedAt;
      }

      const subfolders = await Folder.find(subfolderFilter);

      for (const sub of subfolders) {
        sub.isDeleted = false;
        sub.deletedAt = null;
        await sub.save();

        const subNoteFilter: QueryFilter<INote> = {
          user: toObjectId(userId),
          folder: sub._id,
          isDeleted: true,
        };
        if (cascadeDeletedAt) {
          subNoteFilter.deletedAt = cascadeDeletedAt;
        }

        const subNotes = await Note.find(subNoteFilter, { _id: 1 });
        const subNoteIds = subNotes.map((n) => n._id);

        await Note.updateMany(subNoteFilter, { isDeleted: false, deletedAt: null });
        await NoteChunk.updateMany({ noteId: { $in: subNoteIds } }, { isDeleted: false });

        await restoreSubtree(sub._id);
      }
    };

    await restoreSubtree(folder._id);

    return { message: 'Folder restored successfully', success: true, folder };
  } catch (e) {
    logger.error('Error restoring folder', { error: e instanceof Error ? e.message : e });
    throw e;
  }
};

export const permanentDeleteFolderOf = async (
  userId: MongooseIdOrString,
  folderId: MongooseIdOrString,
) => {
  try {
    const folder = await Folder.findOne({
      _id: toObjectId(folderId),
      user: toObjectId(userId),
    });

    if (!folder) {
      throw new BadRequest('Folder not found');
    }

    // Collect all subfolder IDs recursively
    const collectSubtreeFolderIds = async (
      parentId: mongoose.Types.ObjectId,
    ): Promise<mongoose.Types.ObjectId[]> => {
      const subfolders = await Folder.find(
        { user: toObjectId(userId), parentFolder: parentId },
        { _id: 1 },
      );
      if (subfolders.length === 0) return [];
      const subIds = subfolders.map((s) => s._id);
      const nestedPromises = subIds.map((id) => collectSubtreeFolderIds(id));
      const nestedResults = await Promise.all(nestedPromises);
      return [...subIds, ...nestedResults.flat()];
    };

    const subfolderIds = await collectSubtreeFolderIds(folder._id);
    const allFolderIds = [folder._id, ...subfolderIds];

    // Find and delete notes & chunks in bulk
    const notes = await Note.find(
      { user: toObjectId(userId), folder: { $in: allFolderIds } },
      { _id: 1 },
    );
    const noteIds = notes.map((n) => n._id);

    await Promise.all([
      NoteChunk.deleteMany({ noteId: { $in: noteIds } }),
      Note.deleteMany({ _id: { $in: noteIds }, user: toObjectId(userId) }),
      Folder.deleteMany({ _id: { $in: allFolderIds }, user: toObjectId(userId) }),
    ]);

    return { message: 'Folder permanently deleted', success: true };
  } catch (e) {
    logger.error('Error permanently deleting folder', { error: e instanceof Error ? e.message : e });
    throw e;
  }
};

export const getFoldersOf = async (
  userId: MongooseIdOrString,
  parentFolderId?: string | null,
) => {
  try {
    const filter = {
      user: toObjectId(userId),
      parentFolder: parentFolderId ? toObjectId(parentFolderId) : null,
      isDeleted: { $ne: true },
    };

    const folders = await Folder.find(filter).sort({ name: 1 });

    const enrichedFolders = await Promise.all(
      folders.map(async (f) => {
        const [subfolderCount, noteCount] = await Promise.all([
          Folder.countDocuments({
            user: toObjectId(userId),
            parentFolder: f._id,
            isDeleted: { $ne: true },
          }),
          Note.countDocuments({
            user: toObjectId(userId),
            folder: f._id,
            isDeleted: { $ne: true },
          }),
        ]);

        return {
          ...f.toObject(),
          subfolderCount,
          noteCount,
        };
      }),
    );

    return { message: 'Folders fetched successfully', success: true, folders: enrichedFolders };
  } catch (e) {
    logger.error('Error fetching folders', { error: e instanceof Error ? e.message : e });
    throw e;
  }
};

export const getFolderDetails = async (
  userId: MongooseIdOrString,
  folderId: MongooseIdOrString,
) => {
  try {
    const folder = await Folder.findOne({
      _id: toObjectId(folderId),
      user: toObjectId(userId),
      isDeleted: { $ne: true },
    });

    if (!folder) {
      throw new BadRequest('Folder not found');
    }

    // Build breadcrumb path from root to current folder
    const breadcrumbs: { _id: string; name: string }[] = [];
    let currentFolder: IFolder | null = folder;

    while (currentFolder) {
      breadcrumbs.unshift({
        _id: currentFolder._id.toString(),
        name: currentFolder.name,
      });

      if (currentFolder.parentFolder) {
        currentFolder = await Folder.findOne({
          _id: currentFolder.parentFolder,
          user: toObjectId(userId),
          isDeleted: { $ne: true },
        });
      } else {
        currentFolder = null;
      }
    }

    // Fetch subfolders and notes inside this folder
    const [subfoldersRes, notes] = await Promise.all([
      getFoldersOf(userId, folderId.toString()),
      Note.find({
        user: toObjectId(userId),
        folder: toObjectId(folderId),
        isDeleted: { $ne: true },
      }).sort({ updatedAt: -1 }),
    ]);

    return {
      message: 'Folder details fetched successfully',
      success: true,
      folder,
      breadcrumbs,
      subfolders: subfoldersRes.folders,
      notes,
    };
  } catch (e) {
    logger.error('Error fetching folder details', { error: e instanceof Error ? e.message : e });
    throw e;
  }
};

export const addNoteToFolder = async (
  userId: MongooseIdOrString,
  folderId: MongooseIdOrString,
  noteId: MongooseIdOrString,
) => {
  try {
    const folder = await Folder.findOne({
      _id: toObjectId(folderId),
      user: toObjectId(userId),
      isDeleted: { $ne: true },
    });

    if (!folder) {
      throw new BadRequest('Folder not found');
    }

    const note = await Note.findOneAndUpdate(
      {
        _id: toObjectId(noteId),
        user: toObjectId(userId),
        isDeleted: { $ne: true },
      },
      { folder: toObjectId(folderId) },
      { returnDocument: 'after' },
    );

    if (!note) {
      throw new BadRequest('Note not found');
    }

    return { message: 'Note added to folder', success: true, note, folder };
  } catch (e) {
    logger.error('Error adding note to folder', { error: e instanceof Error ? e.message : e });
    throw e;
  }
};

export const removeNoteFromFolder = async (
  userId: MongooseIdOrString,
  folderId: MongooseIdOrString,
  noteId: MongooseIdOrString,
) => {
  try {
    const note = await Note.findOneAndUpdate(
      {
        _id: toObjectId(noteId),
        user: toObjectId(userId),
        folder: toObjectId(folderId),
        isDeleted: { $ne: true },
      },
      { folder: null },
      { returnDocument: 'after' },
    );

    if (!note) {
      throw new BadRequest('Note not found in this folder');
    }

    return { message: 'Note removed from folder', success: true, note };
  } catch (e) {
    logger.error('Error removing note from folder', { error: e instanceof Error ? e.message : e });
    throw e;
  }
};

export const getAllFoldersFlat = async (userId: MongooseIdOrString) => {
  try {
    const folders = await Folder.find({
      user: toObjectId(userId),
      isDeleted: { $ne: true },
    }).sort({ name: 1 });

    return { message: 'All folders fetched', success: true, folders };
  } catch (e) {
    logger.error('Error fetching flat folders', { error: e instanceof Error ? e.message : e });
    throw e;
  }
};
