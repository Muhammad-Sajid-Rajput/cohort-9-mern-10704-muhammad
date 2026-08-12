import mongoose, { Document, Types } from 'mongoose';

export interface INoteChunk extends Document {
  noteId: Types.ObjectId;
  user: Types.ObjectId;
  content: string;
  embedding: number[];
  chunkIndex: number;
  noteTitle: string;
}

const noteChunkSchema = new mongoose.Schema<INoteChunk>(
  {
    noteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Note',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
    },
    embedding: {
      type: [Number],
      required: true,
    },
    chunkIndex: {
      type: Number,
      required: true,
    },
    noteTitle: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

noteChunkSchema.index({ user: 1, noteId: 1 });

export const NoteChunk = mongoose.model<INoteChunk>(
  'NoteChunk',
  noteChunkSchema,
);
