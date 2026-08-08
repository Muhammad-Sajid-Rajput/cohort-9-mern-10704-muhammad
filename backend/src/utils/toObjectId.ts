import mongoose from 'mongoose';

export const toObjectId = (id: string | mongoose.Types.ObjectId) =>
  typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id;
