import jwt from 'jsonwebtoken';
import { StringValue } from 'ms';
import mongoose from 'mongoose';

export type AccessPayload = {
  userId: string | mongoose.Types.ObjectId;
};

// Alias for backward compatibility
export type AcsessPayload = AccessPayload;

export type tokenResult = {
  token: string;
};

export const signJwtToken = (
  payload: AccessPayload,
  expiresIn: StringValue,
): tokenResult => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT secret not found');
  }
  const token = jwt.sign(payload, secret, {
    expiresIn,
    algorithm: 'HS256',
    issuer: '10pInternship-notesApp',
  });
  return { token };
};

export const verifyJwtToken = (token: string): AccessPayload => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT secret not found');
  }
  const decoded = jwt.verify(token, secret) as AccessPayload;
  return decoded;
};
