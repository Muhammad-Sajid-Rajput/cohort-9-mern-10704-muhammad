import { Folder } from '../models/folder';
import mongoose, { type QueryFilter } from 'mongoose';
import { logger } from '../utils/logger';
import { Note, NoteTag, INote } from '../models/notes';
import { BadRequest } from '../utils/appError';
import { NotesBody } from '../types/notes.types';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { getEmbedding, getEmbeddings } from '../utils/getEmbedings';
import { NoteChunk } from '../models/notes.chunk';
import { toObjectId } from '../utils/toObjectId';
import { sendToGemni } from '../utils/gemni';

type MongooseIdOrString = string | mongoose.Types.ObjectId;

const escapeRegex = (str: string): string => str.replace(/[.*+?^${}()|[\]\\]/g, (match) => `\\${match}`);

export const createNoteOf = async (
  userId: string | mongoose.Types.ObjectId,
  noteBody: NotesBody,
) => {
  const { title, body, tags, folder } = noteBody;
  try {
    if (folder) {
      const existingFolder = await Folder.findOne({
        _id: toObjectId(folder),
        user: toObjectId(userId),
        isDeleted: { $ne: true },
      });
      if (!existingFolder) {
        throw new BadRequest('Folder not found');
      }
    }

    const note = await Note.create({
      title,
      content: body,
      tags: tags as NoteTag[],
      user: userId,
      folder: folder ? toObjectId(folder) : null,
    });

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 400,
      chunkOverlap: 100,
    });
    const chunks = await splitter.splitText(body);
    const chunksWithTitle = chunks.map((chunk: string) => `${title}\n\n${chunk}`);
    const embeddings = await getEmbeddings(chunksWithTitle);
    const docs = chunksWithTitle.map((chunk, i) => ({
      user: userId,
      content: chunk,
      noteId: note._id,
      noteTitle: title,
      embedding: embeddings[i],
      chunkIndex: i,
      isDeleted: false,
    }));
    await NoteChunk.insertMany(docs);

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
    const { title, body, tags, folder } = noteBody;
    if (folder) {
      const existingFolder = await Folder.findOne({
        _id: toObjectId(folder),
        user: toObjectId(userId),
        isDeleted: { $ne: true },
      });
      if (!existingFolder) {
        throw new BadRequest('Folder not found');
      }
    }

    const updatePayload: {
      title: string;
      content: string;
      tags: NoteTag[];
      folder?: mongoose.Types.ObjectId | null;
    } = { title, content: body, tags: tags as NoteTag[] };
    if (folder !== undefined) {
      updatePayload.folder = folder ? toObjectId(folder) : null;
    }
    const noteExists = await Note.findOneAndUpdate(
      { _id: noteId, user: userId, isDeleted: { $ne: true } },
      updatePayload,
      { returnDocument: 'after' },
    );
    if (!noteExists) {
      throw new BadRequest('Note not found or unauthorized');
    }

    await NoteChunk.deleteMany({ noteId, user: userId });
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 400,
      chunkOverlap: 100,
    });
    const chunks = await splitter.splitText(body);
    const chunksWithTitle = chunks.map((chunk: string) => `${title}\n\n${chunk}`);
    const embeddings = await getEmbeddings(chunksWithTitle);
    const docs = chunksWithTitle.map((chunk, i) => ({
      user: userId,
      content: chunk,
      noteId: noteExists._id,
      noteTitle: title,
      embedding: embeddings[i],
      chunkIndex: i,
      isDeleted: false,
    }));
    await NoteChunk.insertMany(docs);

    return { message: 'Note updated successfully', success: true, note: noteExists };
  } catch (e) {
    logger.error('Error updating note', { error: e instanceof Error ? e.message : e });
    throw e;
  }
};

export interface NotesQueryParams {
  page?: number;
  limit?: number;
  skip?: number;
  search?: string;
  tag?: string;
  folder?: string;
}

export interface GetAllNotesResponse {
  message: string;
  success: boolean;
  notes: INote[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const getAllNotesOf = async (
  userId: MongooseIdOrString,
  queryParamsOrPage: NotesQueryParams | number = 1,
  limitArg: number = 10,
  tagArg?: string,
  searchArg?: string,
  folderArg?: string,
): Promise<GetAllNotesResponse> => {
  try {
    let page = 1;
    let limit = 10;
    let search: string | undefined;
    let tag: string | undefined;
    let folder: string | undefined;
    let skipArg: number | undefined;

    if (typeof queryParamsOrPage === 'object' && queryParamsOrPage !== null) {
      page = queryParamsOrPage.page ?? 1;
      limit = queryParamsOrPage.limit ?? 10;
      skipArg = queryParamsOrPage.skip;
      search = queryParamsOrPage.search;
      tag = queryParamsOrPage.tag;
      folder = queryParamsOrPage.folder;
    } else {
      page = Number(queryParamsOrPage) || 1;
      limit = limitArg;
      tag = tagArg;
      search = searchArg;
      folder = folderArg;
    }

    const filter: QueryFilter<INote> = { user: toObjectId(userId), isDeleted: { $ne: true } };

    if (tag) {
      filter.tags = tag as NoteTag;
    }

    if (folder !== undefined) {
      filter.folder = folder ? toObjectId(folder) : null;
    }

    if (search) {
      const escapedSearch = escapeRegex(search);
      filter.$or = [
        { title: { $regex: escapedSearch, $options: 'i' } },
        { content: { $regex: escapedSearch, $options: 'i' } },
      ];
    }

    const skip = skipArg ?? (page - 1) * limit;

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

export const getNotesOf = getAllNotesOf;

export const getNoteOf = async (
  userId: MongooseIdOrString,
  noteId: MongooseIdOrString,
) => {
  try {
    const note = await Note.findOne({ _id: noteId, user: userId, isDeleted: { $ne: true } });
    if (!note) {
      throw new BadRequest('Note not found');
    }
    return { message: 'Note fetched successfully', success: true, note };
  } catch (e) {
    logger.error('Error fetching note', { error: e instanceof Error ? e.message : e });
    throw e;
  }
};

export const deleteNoteOf = async (
  userId: MongooseIdOrString,
  noteId: MongooseIdOrString,
) => {
  try {
    const note = await Note.findOneAndUpdate(
      { _id: noteId, user: userId, isDeleted: { $ne: true } },
      { isDeleted: true, deletedAt: new Date() },
      { returnDocument: 'after' },
    );

    if (!note) {
      throw new BadRequest('Note not found or already in trash');
    }

    await NoteChunk.updateMany(
      { noteId: note._id, user: toObjectId(userId) },
      { isDeleted: true },
    );

    return { message: 'Note moved to trash', success: true, note };
  } catch (e) {
    logger.error('Error deleting note', { error: e instanceof Error ? e.message : e });
    throw e;
  }
};

export const deleteAllNotesOf = async (userId: MongooseIdOrString) => {
  try {
    const result = await Note.updateMany(
      { user: userId, isDeleted: { $ne: true } },
      { isDeleted: true, deletedAt: new Date() },
    );

    await NoteChunk.updateMany(
      { user: toObjectId(userId) },
      { isDeleted: true },
    );

    return { message: 'All notes moved to trash', success: true, notes: result };
  } catch (e) {
    logger.error('Error deleting all notes', { error: e instanceof Error ? e.message : e });
    throw e;
  }
};

interface RelevantChunk {
  content: string;
  noteTitle: string;
  score: number;
}

export const augmententRetrival = async (
  message: string,
  userId: string | mongoose.Types.ObjectId,
  noteId?: string | null,
) => {
  try {
    const contextParts: string[] = [];

    if (noteId && mongoose.isValidObjectId(noteId)) {
      const activeNote = await Note.findOne({
        _id: toObjectId(noteId),
        user: toObjectId(userId),
        isDeleted: { $ne: true },
      });
      if (activeNote) {
        contextParts.push(
          `[Active Note Being Viewed by User]\nTitle: ${activeNote.title}\nContent: ${activeNote.content}`
        );
      }
    }

    try {
      const chatMessageEmbed = await getEmbedding(message);
      const relevantChunks = await NoteChunk.aggregate<RelevantChunk>([
        {
          $vectorSearch: {
            index: 'vector_index',
            path: 'embedding',
            queryVector: chatMessageEmbed,
            numCandidates: 100,
            limit: 5,
            filter: { user: toObjectId(userId), isDeleted: { $ne: true } },
          },
        },
        {
          $project: {
            content: 1,
            noteTitle: 1,
            score: { $meta: 'vectorSearchScore' },
          },
        },
      ]);

      const vectorContext = relevantChunks
        .map((chunk, i) => `[Related Note Chunk ${i + 1}] Title: ${chunk.noteTitle}\nContent: ${chunk.content}`)
        .join('\n\n');

      if (vectorContext) {
        contextParts.push(vectorContext);
      }
    } catch (embeddingErr) {
      logger.warn('Vector search embedding failed, falling back to text search context', {
        error: embeddingErr instanceof Error ? embeddingErr.message : embeddingErr,
      });

      if (contextParts.length === 0) {
        const MAX_FALLBACK_CHARS = 1500;
        const fallbackNotes = await Note.find({ user: userId, isDeleted: { $ne: true } })
          .sort({ updatedAt: -1 })
          .limit(5);
        const fallbackContext = fallbackNotes
          .map(
            (n, i) =>
              `[Note ${i + 1}] Title: ${n.title}\nContent: ${n.content.slice(0, MAX_FALLBACK_CHARS)}`
          )
          .join('\n\n');
        if (fallbackContext) {
          contextParts.push(fallbackContext);
        }
      }
    }

    const context = contextParts.join('\n\n');

    if (!context) {
      return { reply: "I couldn't find any notes in your workspace to answer that.", success: true };
    }

    const prompt = `You are an intelligent, helpful, and precise workspace AI assistant.
Your goal is to assist the user by answering questions, summarizing notes, and providing clear insights based on their notes.

Formatting & Structure Guidelines:
- Format your response using clean Markdown with distinct paragraphs and bullet points.
- When summarizing, use clear bullet points with bold section labels (e.g., **Topic Name**: explanation) for maximum clarity and readability.
- If the user is viewing an active note (labeled [Active Note Being Viewed by User]) and asks to "summarize this note", "explain this note", or asks about the current topic, focus directly and comprehensively on that active note.
- Be polite, direct, and structured.

<context>
${context}
</context>

<user_question>
${message}
</user_question>

Answer:`;

    const resp = await sendToGemni(prompt);
    return { reply: resp?.reply, success: true };
  } catch (e) {
    logger.error('Error in RAG pipeline', { error: e instanceof Error ? e.message : e });
    throw e;
  }
};

export const getTrashNotesOf = async (userId: MongooseIdOrString) => {
  try {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

    const expiredNotes = await Note.find(
      { user: toObjectId(userId), isDeleted: true, deletedAt: { $lt: threeDaysAgo } },
      { _id: 1 },
    );

    if (expiredNotes.length > 0) {
      const expiredIds = expiredNotes.map((n) => n._id);
      await Note.deleteMany({ _id: { $in: expiredIds }, user: toObjectId(userId), isDeleted: true });
      await NoteChunk.deleteMany({ noteId: { $in: expiredIds }, user: toObjectId(userId) });
    }

    const notes = await Note.find({
      user: toObjectId(userId),
      isDeleted: true,
      deletedAt: { $gte: threeDaysAgo },
    }).sort({ deletedAt: -1 });

    return { message: 'Trash notes fetched successfully', success: true, notes };
  } catch (e) {
    logger.error('Error fetching trash notes', { error: e instanceof Error ? e.message : e });
    throw e;
  }
};

export const restoreNoteOf = async (
  userId: MongooseIdOrString,
  noteId: MongooseIdOrString,
) => {
  try {
    const note = await Note.findOneAndUpdate(
      { _id: toObjectId(noteId), user: toObjectId(userId), isDeleted: true },
      { isDeleted: false, deletedAt: null },
      { returnDocument: 'after' },
    );

    if (!note) {
      throw new BadRequest('Note not found in trash');
    }

    await NoteChunk.updateMany(
      { noteId: note._id, user: toObjectId(userId) },
      { isDeleted: false },
    );

    return { message: 'Note restored successfully', success: true, note };
  } catch (e) {
    logger.error('Error restoring note', { error: e instanceof Error ? e.message : e });
    throw e;
  }
};

export const permanentDeleteNoteOf = async (
  userId: MongooseIdOrString,
  noteId: MongooseIdOrString,
) => {
  try {
    const note = await Note.findOneAndDelete({
      _id: toObjectId(noteId),
      user: toObjectId(userId),
      isDeleted: true,
    });

    if (!note) {
      throw new BadRequest('Note not found in trash');
    }

    await NoteChunk.deleteMany({ noteId: note._id, user: toObjectId(userId) });

    return { message: 'Note permanently deleted', success: true, note };
  } catch (e) {
    logger.error('Error permanently deleting note', { error: e instanceof Error ? e.message : e });
    throw e;
  }
};

export const emptyTrashOf = async (userId: MongooseIdOrString) => {
  try {
    const trashNotes = await Note.find({ user: toObjectId(userId), isDeleted: true }, { _id: 1 });
    const noteIds = trashNotes.map((n) => n._id);

    const [result] = await Promise.all([
      Note.deleteMany({ user: toObjectId(userId), isDeleted: true }),
      NoteChunk.deleteMany({ noteId: { $in: noteIds }, user: toObjectId(userId) }),
      Folder.deleteMany({ user: toObjectId(userId), isDeleted: true }),
    ]);

    return { message: 'Trash emptied successfully', success: true, notes: result };
  } catch (e) {
    logger.error('Error emptying trash', { error: e instanceof Error ? e.message : e });
    throw e;
  }
};
