import type { NextFunction, Request, Response } from 'express';

import {
  passwordAndConfirmPasswordType,
  userForgotPasswordBody,
  userLoginBody,
  userRegisterBody,
} from '../types/user.types';
import {
  changePassword,
  createUser,
  deleteUserFromDb,
  forgot,
  getUserDataById,
  login,
  logout,
  refreshAccessToken,
  verifyEmail,
} from '../services/user.services';
import { HTTPSTATUS } from '../utils/enums';
import { BadRequest, UnAuthorizedRequest } from '../utils/appError';
import { asyncHandler } from '../middlewares/asyncHandler';

export const registerUser = asyncHandler(
  async (req: Request, res: Response, nextFn: NextFunction) => {
    const userRegisterBodyData = req.body as userRegisterBody;
    const registerData = await createUser(userRegisterBodyData);
    return res.status(HTTPSTATUS.CREATED).json({
      user: registerData.user,
      message: registerData.message,
      success: true,
    });
  },
);

export const verifyUser = asyncHandler(
  async (req: Request, res: Response, nextFn: NextFunction) => {
    const token = req.params.token;
    if (!token) {
      throw new UnAuthorizedRequest('No token provided');
    }
    const verifiedUser = await verifyEmail(token as string);
    res.status(HTTPSTATUS.OK).json({
      message: `User ${verifiedUser?.username} verified!`,
      success: true,
    });
  },
);

export const loginUser = asyncHandler(
  async (req: Request, res: Response, nextFn: NextFunction) => {
    const body = req.body as userLoginBody;
    const { jwtToken, refreshToken } = await login(body, req);
    res.cookie('refreshToken', refreshToken, {
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.cookie('token', jwtToken, {
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 15 * 60 * 1000,
    });

    res
      .status(HTTPSTATUS.OK)
      .json({ success: true, message: 'User logged in successfully' });
  },
);

export const logoutUser = asyncHandler(
  async (req: Request, res: Response, nextFn: NextFunction) => {
    const rawRefreshToken = req.cookies.refreshToken;

    if (rawRefreshToken) {
      await logout(rawRefreshToken);
    }

    res.clearCookie('token');
    res.clearCookie('refreshToken');

    res
      .status(HTTPSTATUS.OK)
      .json({ success: true, message: 'Logged out successfully' });
  },
);

export const getRefreshToken = asyncHandler(
  async (req: Request, res: Response, nextFn: NextFunction) => {
    const rawRefreshToken = req.cookies.refreshToken;

    if (!rawRefreshToken) {
      throw new UnAuthorizedRequest('No refresh token provided');
    }

    const { jwtToken } = await refreshAccessToken(rawRefreshToken);

    res.cookie('token', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    });

    res.status(HTTPSTATUS.OK).json({ success: true });
  },
);

export const forgotUserCredentials = asyncHandler(
  async (req: Request, res: Response, nextFn: NextFunction) => {
    const { email } = req.body as userForgotPasswordBody;
    const { message, success } = await forgot(email);
    return res.status(HTTPSTATUS.OK).json({
      message,
      success,
    });
  },
);

export const changePasswordAfterForgot = asyncHandler(
  async (req: Request, res: Response, nextFn: NextFunction) => {
    const token = req.params.token;
    if (!token) {
      throw new BadRequest('Token is required');
    }
    const { password, confirmPassword } =
      req.body as passwordAndConfirmPasswordType;
    if (password.trim() !== confirmPassword.trim()) {
      throw new BadRequest('Passwords do not match');
    }
    const { message, success } = await changePassword(
      token as string,
      password,
    );
    return res.status(HTTPSTATUS.OK).json({
      message,
      success,
    });
  },
);

export const me = asyncHandler(
  async (req: Request, res: Response, nextFn: NextFunction) => {
    const userId = req.userId;
    if (!userId) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        message: 'Invalid request — user ID does not exist',
        success: false,
      });
    }

    const user = await getUserDataById(userId);
    return res.status(HTTPSTATUS.OK).json({
      user,
    });
  },
);

export const deleteUser = asyncHandler(
  async (req: Request, res: Response, nextFn: NextFunction) => {
    const userId = req.userId;
    if (!userId) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        message: 'Invalid request — user ID does not exist',
        success: false,
      });
    }

    const deletedUser = await deleteUserFromDb(userId);
    if (!deletedUser) {
      return res.status(HTTPSTATUS.NOT_FOUND).json({
        message: 'User not found',
        success: false,
      });
    }

    res.clearCookie('token');
    res.clearCookie('refreshToken');
    return res.status(HTTPSTATUS.OK).json({
      message: 'User deleted successfully',
      success: true,
    });
  },
);
