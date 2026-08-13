import { it, expect, vi, beforeEach, describe } from 'vitest';

vi.mock('../models/user.js');
vi.mock('../models/refresh.js');
vi.mock('../utils/constants.js');
vi.mock('../utils/jwt.js');
vi.mock('../services/mail.service.js', () => ({
  sendMail: vi.fn().mockResolvedValue(true),
  sendAccountVerifiedMail: vi.fn().mockResolvedValue(true),
  sendForgotPasswordMail: vi.fn().mockResolvedValue(true),
  sendNewLoginMail: vi.fn().mockResolvedValue(true),
  sendPasswordResetSuccessMail: vi.fn().mockResolvedValue(true),
}));
vi.mock('../utils/logger.js', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));
vi.mock('geoip-lite');

import { User } from '../models/user.js';
import { RefreshToken } from '../models/refresh.js';
import * as constants from '../utils/constants.js';
import * as jwt from '../utils/jwt.js';
import * as mail from '../services/mail.service.js';
import geoip from 'geoip-lite';

import {
  createUser,
  verifyEmail,
  login,
  logout,
  refreshAccessToken,
  forgot,
  changePassword,
  getUserDataById,
} from '../services/user.services.js';

describe('User Services', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(constants.getExpiryInMs).mockReturnValue(600_000);
  });

  describe('createUser', () => {
    const body = {
      email: 'user@example.com',
      password: 'password123',
      username: 'testuser',
    };

    it('should throw if verified user exists', async () => {
      vi.mocked(User.findOne).mockResolvedValue({ isEmailVerified: true } as any);

      await expect(createUser(body)).rejects.toThrow('User already exists');
    });

    it('should resend verification if user not verified', async () => {
      const save = vi.fn();
      const fakeUser = {
        _id: 'existing-id',
        isEmailVerified: false,
        save,
        email: 'user@example.com',
        username: 'testuser',
      };

      vi.mocked(User.findOne).mockResolvedValue(fakeUser as any);

      const res = await createUser(body);

      expect(save).toHaveBeenCalled();
      expect(mail.sendMail).toHaveBeenCalled();
      expect(res.user).toEqual({
        _id: 'existing-id',
        email: 'user@example.com',
        username: 'testuser',
      });
    });

    it('should create new user if not exists', async () => {
      vi.mocked(User.findOne).mockResolvedValue(null);

      const fakeUser = { _id: '1', email: 'user@example.com', username: 'testuser' };
      vi.mocked(User.create).mockResolvedValue(fakeUser as any);

      const res = await createUser(body);

      expect(User.create).toHaveBeenCalled();
      expect(mail.sendMail).toHaveBeenCalledWith('user@example.com', expect.any(String));
      expect(res.user).toEqual({
        _id: '1',
        email: 'user@example.com',
        username: 'testuser',
      });
    });
  });

  describe('verifyEmail', () => {
    it('should verify email with valid token', async () => {
      const save = vi.fn();
      const fakeUser = {
        username: 'testuser',
        email: 'user@example.com',
        resetPasswordExpires: new Date(Date.now() + 10000),
        isEmailVerified: false,
        save,
      };

      vi.mocked(User.findOne).mockResolvedValue(fakeUser as any);
      vi.mocked(constants.isExpired).mockReturnValue(false);

      const res = await verifyEmail('some-token');

      expect(fakeUser.isEmailVerified).toBe(true);
      expect(save).toHaveBeenCalled();
      expect(mail.sendAccountVerifiedMail).toHaveBeenCalledWith(
        'user@example.com',
        'testuser',
      );
      expect(res).toEqual({
        username: 'testuser',
        email: 'user@example.com',
        isEmailVerified: true,
        resetPasswordExpires: undefined,
        save: expect.any(Function),
      });
    });

    it('should throw if token is invalid', async () => {
      vi.mocked(User.findOne).mockResolvedValue(null);

      await expect(verifyEmail('invalid')).rejects.toThrow('Invalid token');
    });

    it('should throw if token is expired', async () => {
      const fakeUser = {
        username: 'testuser',
        resetPasswordExpires: new Date(Date.now() - 10000),
      };
      vi.mocked(User.findOne).mockResolvedValue(fakeUser as any);
      vi.mocked(constants.isExpired).mockReturnValue(true);

      await expect(verifyEmail('expired')).rejects.toThrow('Token expired');
    });
  });

  describe('login', () => {
    const body = { email: 'user@example.com', password: 'password123' };
    const req = {
      headers: { 'user-agent': 'chrome' },
      ip: '1.2.3.4',
    } as any;

    it('should login successfully with correct credentials', async () => {
      const comparePassword = vi.fn().mockResolvedValue(true);
      const fakeUser = {
        _id: 'userid',
        email: 'user@example.com',
        username: 'testuser',
        isEmailVerified: true,
        comparePassword,
      };

      const select = vi.fn().mockResolvedValue(fakeUser);
      vi.mocked(User.findOne).mockReturnValue({ select } as any);
      vi.mocked(jwt.signJwtToken).mockReturnValue({ token: 'jwt-token' } as any);
      vi.mocked(RefreshToken.create).mockResolvedValue({} as any);
      vi.mocked(geoip.lookup).mockReturnValue({ city: 'NY', country: 'USA' } as any);

      const res = await login(body, req);

      expect(res.jwtToken).toBe('jwt-token');
      expect(res.refreshToken).toBeDefined();
      expect(mail.sendNewLoginMail).toHaveBeenCalled();
    });

    it('should throw for unverified user', async () => {
      const fakeUser = { isEmailVerified: false, comparePassword: vi.fn() };
      const select = vi.fn().mockResolvedValue(fakeUser);
      vi.mocked(User.findOne).mockReturnValue({ select } as any);

      await expect(login(body, req)).rejects.toThrow(
        'User not found or account not verified',
      );
    });

    it('should throw for invalid credentials', async () => {
      const comparePassword = vi.fn().mockResolvedValue(false);
      const fakeUser = { isEmailVerified: true, comparePassword };
      const select = vi.fn().mockResolvedValue(fakeUser);
      vi.mocked(User.findOne).mockReturnValue({ select } as any);

      await expect(login(body, req)).rejects.toThrow('Invalid email or password');
    });
  });

  describe('logout', () => {
    it('should delete refresh token', async () => {
      vi.mocked(RefreshToken.deleteOne).mockResolvedValue({ deletedCount: 1 } as any);

      await logout('some-refresh-token');

      expect(RefreshToken.deleteOne).toHaveBeenCalled();
    });
  });

  describe('refreshAccessToken', () => {
    it('should return new jwt token for valid refresh token', async () => {
      vi.mocked(RefreshToken.findOne).mockResolvedValue({
        userId: 'userid',
        expiresAt: new Date(Date.now() + 10000),
      } as any);
      vi.mocked(constants.isExpired).mockReturnValue(false);
      vi.mocked(jwt.signJwtToken).mockReturnValue({ token: 'new-jwt' } as any);

      const res = await refreshAccessToken('valid-refresh');

      expect(res.jwtToken).toBe('new-jwt');
    });

    it('should throw if refresh token is expired', async () => {
      vi.mocked(RefreshToken.findOne).mockResolvedValue({
        token: 'expired-hash',
        expiresAt: new Date(Date.now() - 10000),
      } as any);
      vi.mocked(constants.isExpired).mockReturnValue(true);

      await expect(refreshAccessToken('expired-refresh')).rejects.toThrow(
        'Refresh token expired',
      );
    });
  });

  describe('forgot', () => {
    it('should send forgot password email if user exists', async () => {
      const save = vi.fn();
      vi.mocked(User.findOne).mockResolvedValue({
        email: 'user@example.com',
        isEmailVerified: true,
        save,
      } as any);

      const res = await forgot('user@example.com');

      expect(save).toHaveBeenCalled();
      expect(mail.sendForgotPasswordMail).toHaveBeenCalled();
      expect(res.success).toBe(true);
    });
  });

  describe('changePassword', () => {
    it('should change password with valid token', async () => {
      const save = vi.fn();
      const fakeUser = {
        email: 'user@example.com',
        username: 'testuser',
        password: 'old-pass',
        passwordTokenHash: 'some-hash',
        isEmailVerified: true,
        resetPasswordExpires: new Date(Date.now() + 10000),
        save,
      };
      vi.mocked(User.findOne).mockResolvedValue(fakeUser as any);
      vi.mocked(constants.isExpired).mockReturnValue(false);

      const res = await changePassword('valid-token', 'new-pass');

      expect(fakeUser.save).toHaveBeenCalled();
      expect(mail.sendPasswordResetSuccessMail).toHaveBeenCalled();
      expect(res.success).toBe(true);
    });
  });

  describe('getUserDataById', () => {
    it('should return user data without password', async () => {
      const select = vi.fn().mockResolvedValue({ username: 'testuser' });
      vi.mocked(User.findById).mockReturnValue({ select } as any);

      const res = await getUserDataById('some-id');

      expect(User.findById).toHaveBeenCalledWith('some-id');
      expect(select).toHaveBeenCalledWith('-password');
      expect(res).toEqual({ username: 'testuser' });
    });
  });
});
