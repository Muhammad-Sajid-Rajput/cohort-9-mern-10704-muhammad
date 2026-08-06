import { User } from '../models/user';
import { userLoginBody, userRegisterBody } from '../types/user.types';
import { BadRequest, UnAuthorizedRequest } from '../utils/appError';
import crypto from 'crypto';
import { getExpiryInMs, isExpired } from '../utils/constants';
import { RefreshToken } from '../models/refresh';
import {
  sendAccountVerifiedMail,
  sendForgotPasswordMail,
  sendMail,
  sendNewLoginMail,
  sendPasswordResetSuccessMail,
} from './mail.service';
import { logger } from '../utils/logger';

import type { Request } from 'express';
import mongoose from 'mongoose';
import geoip from 'geoip-lite';
import { signJwtToken } from '../utils/jwt';

export const createUser = async (body: userRegisterBody) => {
  try {
    const { email, password, username } = body;
    const userExists = await User.findOne({ email });

    if (userExists) {
      if (userExists.isEmailVerified) {
        throw new BadRequest('User already exists');
      }

      const rawToken = crypto.randomBytes(32).toString('hex');
      const hashToken = crypto
        .createHash('sha256')
        .update(rawToken)
        .digest('hex');
      userExists.passwordTokenHash = hashToken;
      userExists.resetPasswordExpires = new Date(
        Date.now() + getExpiryInMs({ minutes: 10 }),
      );
      await userExists.save();

      await sendMail(email, rawToken);
      logger.info('Verification email sent to user');
      return {
        user: {
          _id: userExists._id,
          email: userExists.email,
          username: userExists.username,
        },
        message: 'Verification email sent — check your inbox',
      };
    }
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashToken = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    const newUser = await User.create({
      username,
      email,
      password,
      isEmailVerified: false,
      passwordTokenHash: hashToken,
      resetPasswordExpires: new Date(
        Date.now() + getExpiryInMs({ minutes: 10 }),
      ),
    });

    await sendMail(email, rawToken);

    return {
      user: {
        _id: newUser._id,
        email: newUser.email,
        username: newUser.username,
      },
      message: 'Verification email sent — check your inbox',
    };
  } catch (e) {
    logger.error('User creation error', {
      message: e instanceof Error ? e.message : e,
    });
    throw e;
  }
};

export const verifyEmail = async (rawToken: string) => {
  try {
    const hashedToken = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    const user = await User.findOne({
      passwordTokenHash: hashedToken,
    });

    if (!user) {
      logger.error('No user exists with this token');
      throw new UnAuthorizedRequest('Invalid token');
    }
    if (!user.resetPasswordExpires) {
      throw new UnAuthorizedRequest('Token missing expiry');
    }
    const isExpiredToken = isExpired(user.resetPasswordExpires);
    if (isExpiredToken) {
      logger.info('Token expired for user verification');
      throw new UnAuthorizedRequest('Token expired');
    }

    user.isEmailVerified = true;
    user.passwordTokenHash = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    await sendAccountVerifiedMail(user.email, user.username);
    return user;
  } catch (e) {
    logger.error('Email verification error', {
      message: e instanceof Error ? e.message : e,
    });
    throw e;
  }
};

export const login = async (body: userLoginBody, req: Request) => {
  try {
    const { email, password } = body;
    const userExists = await User.findOne({ email }).select('+password');
    if (!userExists || !userExists.isEmailVerified) {
      throw new UnAuthorizedRequest('User not found or account not verified');
    }

    const isPasswordCorrect = await userExists.comparePassword(password);
    if (!isPasswordCorrect) {
      throw new UnAuthorizedRequest('Invalid email or password');
    }

    const { token } = signJwtToken({ userId: String(userExists._id) }, '1h');

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');
    await RefreshToken.create({
      userId: userExists._id,
      token: hashedToken,
      expiresAt: new Date(Date.now() + getExpiryInMs({ days: 7 })),
    });

    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.ip || '';
    const geo = geoip.lookup(ip);
    const location = geo ? `${geo.city}, ${geo.country}` : 'Unknown location';
    const device = req.headers['user-agent'] ?? 'Unknown device';

    sendNewLoginMail({
      to: userExists.email,
      username: userExists.username,
      time: new Date().toUTCString(),
      location,
      device,
    }).catch((e) =>
      logger.error('Login mail failed', { message: e.message }),
    );

    logger.info('User logged in successfully', { location, device });
    return {
      jwtToken: token,
      refreshToken: rawToken,
    };
  } catch (e) {
    logger.error('Login error', {
      message: e instanceof Error ? e.message : e,
    });
    throw e;
  }
};

export const logout = async (rawRefreshToken: string) => {
  try {
    const hashedToken = crypto
      .createHash('sha256')
      .update(rawRefreshToken)
      .digest('hex');

    await RefreshToken.deleteOne({ token: hashedToken });
    logger.info('User logged out successfully');
  } catch (e) {
    logger.error('Logout error', {
      message: e instanceof Error ? e.message : e,
    });
    throw e;
  }
};

export const refreshAccessToken = async (rawRefreshToken: string) => {
  try {
    const hashedToken = crypto
      .createHash('sha256')
      .update(rawRefreshToken)
      .digest('hex');

    const storedToken = await RefreshToken.findOne({ token: hashedToken });

    if (!storedToken) {
      throw new UnAuthorizedRequest('Invalid refresh token');
    }

    if (isExpired(storedToken.expiresAt)) {
      await RefreshToken.deleteOne({ token: hashedToken });
      throw new UnAuthorizedRequest(
        'Refresh token expired, please login again',
      );
    }

    const { token: newJwtToken } = signJwtToken(
      { userId: String(storedToken.userId) },
      '15m',
    );
    logger.info('Access token refreshed successfully');
    return { jwtToken: newJwtToken };
  } catch (e) {
    logger.error('Token refresh error', {
      message: e instanceof Error ? e.message : e,
    });
    throw e;
  }
};

export const forgot = async (email: string) => {
  try {
    const userExists = await User.findOne({ email });
    if (!userExists || !userExists.isEmailVerified) {
      return { message: 'Email sent to account if it exists', success: true };
    }
    const rawToken = crypto.randomBytes(32).toString('hex');

    const hashedToken = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');
    userExists.passwordTokenHash = hashedToken;
    userExists.resetPasswordExpires = new Date(
      Date.now() + getExpiryInMs({ minutes: 10 }),
    );
    await userExists.save();

    await sendForgotPasswordMail(email, rawToken);
    logger.info('Password reset email sent');
    return {
      message: 'Email sent to account if it exists',
      success: true,
    };
  } catch (e) {
    logger.error('Forgot password error', {
      message: e instanceof Error ? e.message : e,
    });
    throw e;
  }
};

export const changePassword = async (rawToken: string, password: string) => {
  try {
    const hashedToken = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');
    const user = await User.findOne({
      passwordTokenHash: hashedToken,
    });
    if (!user || !user.isEmailVerified) {
      return { message: 'Email sent to account if it exists', success: true };
    }
    if (isExpired(user.resetPasswordExpires as Date)) {
      throw new UnAuthorizedRequest('Token is expired');
    }
    user.password = password;
    user.passwordTokenHash = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    
    // Revoke all refresh tokens on password change
    await RefreshToken.deleteMany({ userId: user._id });

    await sendPasswordResetSuccessMail(user.email, user.username);
    logger.info('Password changed successfully');
    return {
      message: 'Password changed successfully',
      success: true,
    };
  } catch (e) {
    logger.error('Change password error', {
      message: e instanceof Error ? e.message : e,
    });
    throw e;
  }
};

export const getUserDataById = async (
  userId: string | mongoose.Types.ObjectId,
) => {
  try {
    const user = await User.findById(userId).select('-password');
    return user;
  } catch (e) {
    logger.error('Error fetching user by ID', {
      message: e instanceof Error ? e.message : e,
    });
    throw e;
  }
};

export const deleteUserFromDb = async (
  userId: string | mongoose.Types.ObjectId,
) => {
  try {
    // Revoke all refresh tokens on account deletion
    await RefreshToken.deleteMany({ userId });
    const user = await User.findByIdAndDelete(userId);
    return user;
  } catch (e) {
    logger.error('Error deleting user', {
      message: e instanceof Error ? e.message : e,
    });
    throw e;
  }
};
