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
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
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
  });

  describe('createUser', () => {
    const body = {
      email: 'yaqoobahmed45700@gmail.com',
      password: '123',
      username: 'muhammadYaqoobHalepoto',
    };

    it('should throw if verified user exists', async () => {
      vi.mocked(User.findOne).mockResolvedValue({
        isEmailVerified: true,
      } as any);

      await expect(createUser(body)).rejects.toThrow('User already exists');
    });

    it('should resend verification if user not verified', async () => {
      const save = vi.fn();
      const fakeUser = {
        isEmailVerified: false,
        save,
        email: 'yaqoobahmed45700@gmail.com',
        username: 'muhammadYaqoobHalepoto',
      };

      vi.mocked(User.findOne).mockResolvedValue(fakeUser as any);
      vi.mocked(constants.getExpiryInMs).mockReturnValue(1000);

      const res = await createUser(body);

      expect(save).toHaveBeenCalled();
      expect(mail.sendMail).toHaveBeenCalled();
      expect(res.user).toEqual({
        _id: undefined,
        email: 'yaqoobahmed45700@gmail.com',
        username: 'muhammadYaqoobHalepoto',
      });
    });

    it('should create new user if not exists', async () => {
      vi.mocked(User.findOne).mockResolvedValue(null);

      const fakeUser = {
        _id: '1',
        email: 'yaqoobahmed45700@gmail.com',
        username: 'muhammadYaqoobHalepoto',
      };
      vi.mocked(User.create).mockResolvedValue(fakeUser as any);

      const res = await createUser(body);

      expect(User.create).toHaveBeenCalled();
      expect(mail.sendMail).toHaveBeenCalled();
      expect(res.user).toEqual({
        _id: '1',
        email: 'yaqoobahmed45700@gmail.com',
        username: 'muhammadYaqoobHalepoto',
      });
    });
  });

  describe('verifyEmail', () => {
    it('should verify email with valid token', async () => {
      const save = vi.fn();
      const fakeUser = {
        username: 'muhammadYaqoobHalepoto',
        email: 'yaqoobahmed45700@gmail.com',
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
        'yaqoobahmed45700@gmail.com',
        'muhammadYaqoobHalepoto',
      );
      expect(res).toEqual({
        username: 'muhammadYaqoobHalepoto',
        email: 'yaqoobahmed45700@gmail.com',
        isEmailVerified: true,
        resetPasswordExpires: undefined,
        save: expect.any(Function),
      });
    });

    it('should throw error if token is invalid', async () => {
      vi.mocked(User.findOne).mockResolvedValue(null);

      await expect(verifyEmail('invalid')).rejects.toThrow('Invalid token');
    });

    it('should throw error if token is expired', async () => {
      const fakeUser = {
        username: 'muhammadYaqoobHalepoto',
        resetPasswordExpires: new Date(Date.now() - 10000),
      };
      vi.mocked(User.findOne).mockResolvedValue(fakeUser as any);
      vi.mocked(constants.isExpired).mockReturnValue(true);

      await expect(verifyEmail('expired')).rejects.toThrow('Token expired');
    });
  });

  describe('login', () => {
    const body = { email: 'yaqoobahmed45700@gmail.com', password: '123' };
    const req = {
      headers: { 'x-forwarded-for': '1.2.3.4', 'user-agent': 'chrome' },
      ip: '1.2.3.4',
    } as any;

    it('should login successfully with correct credentials', async () => {
      const comparePassword = vi.fn().mockResolvedValue(true);
      const fakeUser = {
        _id: 'userid',
        email: 'yaqoobahmed45700@gmail.com',
        username: 'muhammadYaqoobHalepoto',
        isEmailVerified: true,
        comparePassword,
      };

      const select = vi.fn().mockResolvedValue(fakeUser);
      vi.mocked(User.findOne).mockReturnValue({ select } as any);
      vi.mocked(jwt.signJwtToken).mockReturnValue({
        token: 'jwt-token',
      } as any);
      vi.mocked(RefreshToken.create).mockResolvedValue({} as any);
      vi.mocked(geoip.lookup).mockReturnValue({
        city: 'NY',
        country: 'USA',
      } as any);

      const res = await login(body, req);

      expect(res.jwtToken).toBe('jwt-token');
      expect(res.refreshToken).toBeDefined();
      expect(mail.sendNewLoginMail).toHaveBeenCalled();
    });

    it('should throw error for invalid credentials', async () => {
      const comparePassword = vi.fn().mockResolvedValue(false);
      const fakeUser = {
        isEmailVerified: true,
        comparePassword,
      };
      const select = vi.fn().mockResolvedValue(fakeUser);
      vi.mocked(User.findOne).mockReturnValue({ select } as any);

      await expect(login(body, req)).rejects.toThrow(
        'Invalid email or password',
      );
    });
  });

  describe('logout', () => {
    it('should delete refresh token', async () => {
      vi.mocked(RefreshToken.deleteOne).mockResolvedValue({
        deletedCount: 1,
      } as any);
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

    it('should throw error if refresh token is expired', async () => {
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
        email: 'yaqoobahmed45700@gmail.com',
        isEmailVerified: true,
        save,
      } as any);

      const res = await forgot('yaqoobahmed45700@gmail.com');

      expect(save).toHaveBeenCalled();
      expect(mail.sendForgotPasswordMail).toHaveBeenCalled();
      expect(res.success).toBe(true);
    });
  });

  describe('changePassword', () => {
    it('should change password with valid token', async () => {
      const save = vi.fn();
      const fakeUser = {
        email: 'yaqoobahmed45700@gmail.com',
        username: 'muhammadYaqoobHalepoto',
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
      const select = vi
        .fn()
        .mockResolvedValue({ username: 'muhammadYaqoobHalepoto' });
      vi.mocked(User.findById).mockReturnValue({ select } as any);

      const res = await getUserDataById('some-id');

      expect(User.findById).toHaveBeenCalledWith('some-id');
      expect(select).toHaveBeenCalledWith('-password');
      expect(res).toEqual({ username: 'muhammadYaqoobHalepoto' });
    });
  });
});
