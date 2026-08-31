import mongoose, { Document, Types } from 'mongoose';

export interface IFolder extends Document {
  name: string;
  user: Types.ObjectId;
  parentFolder: Types.ObjectId | null;
  isDeleted: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const folderSchema = new mongoose.Schema<IFolder>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 100,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    parentFolder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Folder',
      default: null,
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

folderSchema.index({ user: 1, parentFolder: 1, isDeleted: 1 });
folderSchema.index({ user: 1, name: 1 });

export const Folder = mongoose.model<IFolder>('Folder', folderSchema);
