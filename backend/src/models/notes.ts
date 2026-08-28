import mongoose, { Document, Types } from 'mongoose';

export enum NoteTag {
  WORK = 'work',
  PERSONAL = 'personal',
  LIFE = 'life',
}

export interface INote extends Document {
  title: string;
  content: string;
  user: Types.ObjectId;
  folder?: Types.ObjectId | null;
  tags: NoteTag[];
  isDeleted: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const noteSchema = new mongoose.Schema<INote>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    folder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Folder',
      default: null,
    },
    tags: {
      type: [String],
      enum: Object.values(NoteTag),
      default: [],
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

noteSchema.index({ title: 'text', content: 'text', tags: 'text' });
noteSchema.index({ user: 1, createdAt: -1 });
noteSchema.index({ user: 1, tags: 1 });
noteSchema.index({ user: 1, folder: 1, isDeleted: 1 });
noteSchema.index({ user: 1, isDeleted: 1, deletedAt: -1 });

export const Note = mongoose.model<INote>('Note', noteSchema);
