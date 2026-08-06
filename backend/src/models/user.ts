import mongoose, { Document } from 'mongoose';
import { comparePassword, hashPassword } from '../utils/bcrypt';

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
  profilePicture?: string;
  passwordTokenHash?: string;
  resetPasswordExpires?: Date;
  isEmailVerified: boolean;
  comparePassword(value: string): Promise<boolean>;
  omitPassword(): Omit<IUser, 'password'>;
}

const userSchema = new mongoose.Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      trim: true,
      select: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    profilePicture: {
      type: String,
      required: false,
      default: null,
    },
    passwordTokenHash: {
      type: String,
      default: undefined,
    },
    resetPasswordExpires: {
      type: Date,
      default: undefined,
    },
  },
  { timestamps: true },
);

userSchema.pre('save', async function () {
  if (this.isModified('password') && this.password) {
    this.password = await hashPassword(this.password);
  }
});

userSchema.methods.comparePassword = async function (password: string) {
  return await comparePassword(password, this.password);
};

userSchema.methods.omitPassword = function (): Omit<IUser, 'password'> {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

export const User = mongoose.model<IUser>('User', userSchema);
