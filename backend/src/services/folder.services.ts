import mongoose from 'mongoose';
import { Folder, IFolder } from '../models/folder';
import { Note } from '../models/notes';
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

    // Check if folder is empty (0 notes and 0 active subfolders)
    const [noteCount, subfolderCount] = await Promise.all([
      Note.countDocuments({
        user: toObjectId(userId),
        folder: folder._id,
        isDeleted: { $ne: true },
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

    // Soft delete contained notes, preserving folder reference so restoring restores them to this folder
    await Note.updateMany(
      { user: toObjectId(userId), folder: folder._id, isDeleted: { $ne: true } },
      { isDeleted: true, deletedAt },
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

        await Note.updateMany(
          { user: toObjectId(userId), folder: sub._id, isDeleted: { $ne: true } },
          { isDeleted: true, deletedAt },
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

    for (const exp of expiredFolders) {
      await Folder.deleteOne({ _id: exp._id });
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

    // If it is a subfolder and its parent is also in Trash, restore parent as well
    if (folder.parentFolder) {
      const parent = await Folder.findOne({
        _id: folder.parentFolder,
        user: toObjectId(userId),
      });

      if (parent && parent.isDeleted) {
        parent.isDeleted = false;
        parent.deletedAt = null;
        await parent.save();
      } else if (!parent) {
        // Parent was permanently deleted, convert to root folder
        folder.parentFolder = null;
      }
    }

    folder.isDeleted = false;
    folder.deletedAt = null;
    await folder.save();

    // Restore notes belonging to this folder
    await Note.updateMany(
      { user: toObjectId(userId), folder: folder._id, isDeleted: true },
      { isDeleted: false, deletedAt: null },
    );

    // Recursively restore subfolders and their notes
    const restoreSubtree = async (parentId: mongoose.Types.ObjectId) => {
      const subfolders = await Folder.find({
        user: toObjectId(userId),
        parentFolder: parentId,
        isDeleted: true,
      });

      for (const sub of subfolders) {
        sub.isDeleted = false;
        sub.deletedAt = null;
        await sub.save();

        await Note.updateMany(
          { user: toObjectId(userId), folder: sub._id, isDeleted: true },
          { isDeleted: false, deletedAt: null },
        );

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

    // Delete contained notes and their chunks
    const notes = await Note.find({
      user: toObjectId(userId),
      folder: folder._id,
    });

    for (const n of notes) {
      await Note.deleteOne({ _id: n._id });
    }

    // Recursively delete subfolders
    const deleteSubtree = async (parentId: mongoose.Types.ObjectId) => {
      const subfolders = await Folder.find({
        user: toObjectId(userId),
        parentFolder: parentId,
      });

      for (const sub of subfolders) {
        const subNotes = await Note.find({ user: toObjectId(userId), folder: sub._id });
        for (const sn of subNotes) {
          await Note.deleteOne({ _id: sn._id });
        }
        await deleteSubtree(sub._id);
        await Folder.deleteOne({ _id: sub._id });
      }
    };

    await deleteSubtree(folder._id);
    await Folder.deleteOne({ _id: folder._id });

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
