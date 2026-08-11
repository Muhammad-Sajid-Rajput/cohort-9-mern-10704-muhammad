import mongoose from 'mongoose';
import { logger } from '../utils/logger';
import { Note, NoteTag } from '../models/notes';
import { BadRequest } from '../utils/appError';
import { NotesBody } from '../types/notes.types';

type MongooseIdOrString = string | mongoose.Types.ObjectId;

export const createNoteOf = async (
  userId: string | mongoose.Types.ObjectId,
  noteBody: NotesBody,
) => {
  const { title, body, tags } = noteBody;
  try {
    const note = await Note.create({
      title,
      content: body,
      tags: tags as NoteTag[],
      user: userId,
    });
    return { message: 'Note created successfully', success: true, note };
  } catch (e) {
    logger.error('Error creating note', { error: e instanceof Error ? e.message : e });
    throw e;
  }
};

export const editNoteOf = async (
  userId: MongooseIdOrString,
  noteId: MongooseIdOrString,
  noteBody: NotesBody,
) => {
  try {
    const { title, body, tags } = noteBody;
    const noteExists = await Note.findOneAndUpdate(
      {
        _id: noteId,
        user: userId,
      },
      {
        title,
        content: body,
        tags,
      },
      { new: true },
    );
    if (!noteExists) {
      throw new BadRequest('Note not found or unauthorized');
    }

    return {
      message: 'Note updated successfully',
      success: true,
      note: noteExists,
    };
  } catch (e) {
    logger.error('Error updating note', {
      error: e instanceof Error ? e.message : e,
    });
    throw e;
  }
};

type NoteQuery = {
  page: number;
  limit: number;
  skip: number;
  search: string;
  tag: string;
};

interface INoteFilter {
  user: MongooseIdOrString;
  tags?: NoteTag | { $regex: string; $options: string };
  $or?: Array<{ [key: string]: { $regex: string; $options: string } }>;
}

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const getAllNotesOf = async (
  userId: MongooseIdOrString,
  query: NoteQuery,
) => {
  const { page, limit, skip, search, tag } = query;

  const filter: INoteFilter = { user: userId };
  if (search) {
    const escaped = escapeRegex(search);
    filter.$or = [
      { title: { $regex: escaped, $options: 'i' } },
      { content: { $regex: escaped, $options: 'i' } },
      { tags: { $regex: escaped, $options: 'i' } },
    ];
  }

  if (tag) {
    filter.tags = tag as NoteTag;
  }

  try {
    const [notes, total] = await Promise.all([
      Note.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Note.countDocuments(filter),
    ]);

    return {
      message: 'Notes fetched successfully',
      success: true,
      notes,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (e) {
    logger.error('Error fetching notes', { error: e instanceof Error ? e.message : e });
    throw e;
  }
};

export const getNoteOf = async (
  userId: MongooseIdOrString,
  noteId: MongooseIdOrString,
) => {
  try {
    const note = await Note.findOne({
      _id: noteId,
      user: userId,
    });
    if (!note) {
      throw new BadRequest('Note not found');
    }
    return {
      message: 'Note fetched successfully',
      success: true,
      note,
    };
  } catch (e) {
    logger.error('Error fetching note', {
      error: e instanceof Error ? e.message : e,
    });
    throw e;
  }
};

export const deleteNoteOf = async (
  userId: MongooseIdOrString,
  noteId: MongooseIdOrString,
) => {
  try {
    const note = await Note.findOneAndDelete({
      _id: noteId,
      user: userId,
    });
    if (!note) {
      throw new BadRequest('Note not found for this user');
    }

    return {
      message: 'Note deleted successfully',
      success: true,
      note,
    };
  } catch (e) {
    logger.error('Error deleting note', {
      error: e instanceof Error ? e.message : e,
    });
    throw e;
  }
};

export const deleteAllNotesOf = async (userId: MongooseIdOrString) => {
  try {
    const result = await Note.deleteMany({ user: userId });
    return {
      message: 'All notes deleted successfully',
      success: true,
      notes: result,
    };
  } catch (e) {
    logger.error('Error deleting all notes', { error: e instanceof Error ? e.message : e });
    throw e;
  }
};
