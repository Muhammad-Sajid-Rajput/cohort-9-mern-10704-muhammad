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
  tags: NoteTag[];
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
    tags: {
      type: [String],
      enum: Object.values(NoteTag),
      default: [],
    },
  },
  { timestamps: true },
);

noteSchema.index({ title: 'text', content: 'text', tags: 'text' });
noteSchema.index({ user: 1, createdAt: -1 });
noteSchema.index({ user: 1, tags: 1 });

export const Note = mongoose.model<INote>('Note', noteSchema);
