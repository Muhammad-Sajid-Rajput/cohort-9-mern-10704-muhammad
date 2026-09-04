import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';
import {
  HTML_ACCOUNT_VERIFIED,
  HTML_FORGOT_PASSWORD,
  HTML_NEW_LOGIN,
  HTML_PASSWORD_RESET_SUCCESS,
  HTML_VERIFY_EMAIL,
} from '../utils/constants';

const transport = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.APP_EMAIL,
    pass: process.env.APP_PASS,
  },
});

const escapeHtml = (str: string): string =>
  str.replace(/[&<>"']/g, (match) => {
    const escapeMap: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return escapeMap[match] || match;
  });

const getBaseUrl = (): string => {
  if (process.env.BASE_URL) return process.env.BASE_URL;
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  return `${protocol}://localhost:8000`;
};

const getFrontendUrl = (): string => {
  if (process.env.FRONTEND_URL) return process.env.FRONTEND_URL;
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  return `${protocol}://localhost:5173`;
};

export const sendMail = async (to: string, token: string): Promise<void> => {
  try {
    const baseUrl = getBaseUrl();
    const verifyLink = `${baseUrl}/api/v1/auth/verify/${encodeURIComponent(token)}`;
    await transport.sendMail({
      from: '"Notes App"',
      to,
      subject: 'Verify your email — Notes App',
      html: HTML_VERIFY_EMAIL.replace(/{{VERIFY_URL}}/g, verifyLink),
    });
    logger.info('Verification mail sent successfully');
  } catch (e) {
    logger.error('Mail error', { message: e instanceof Error ? e.message : e });
    throw e;
  }
};

export const sendForgotPasswordMail = async (to: string, token: string): Promise<void> => {
  try {
    const frontendUrl = getFrontendUrl();
    const resetLink = `${frontendUrl}/reset-password/${encodeURIComponent(token)}`;
    await transport.sendMail({
      from: '"Notes App"',
      to,
      subject: 'Reset your password — Notes App',
      html: HTML_FORGOT_PASSWORD.replace(/{{RESET_URL}}/g, resetLink),
    });
    logger.info('Password reset mail sent successfully');
  } catch (e) {
    logger.error('Forgot password mail error', {
      message: e instanceof Error ? e.message : e,
    });
    throw e;
  }
};

export const sendPasswordResetSuccessMail = async (
  to: string,
  username: string,
): Promise<void> => {
  try {
    const safeUsername = escapeHtml(username);
    await transport.sendMail({
      from: '"Notes App"',
      to,
      subject: 'Your password was reset — Notes App',
      html: HTML_PASSWORD_RESET_SUCCESS.replace(/{{USERNAME}}/g, safeUsername),
    });
    logger.info('Password reset success mail sent successfully');
  } catch (e) {
    logger.error('Password reset success mail error', {
      message: e instanceof Error ? e.message : e,
    });
    throw e;
  }
};

export const sendAccountVerifiedMail = async (to: string, username: string): Promise<void> => {
  try {
    const safeUsername = escapeHtml(username);
    await transport.sendMail({
      from: '"Notes App"',
      to,
      subject: 'Account verified — Notes App',
      html: HTML_ACCOUNT_VERIFIED.replace(/{{USERNAME}}/g, safeUsername),
    });
    logger.info('Account verified mail sent successfully');
  } catch (e) {
    logger.error('Account verified mail error', {
      message: e instanceof Error ? e.message : e,
    });
    throw e;
  }
};

export type NewLoginMailOptions = {
  to: string;
  username: string;
  time: string;
  location: string;
  device: string;
};

export const sendNewLoginMail = async (options: NewLoginMailOptions): Promise<void> => {
  try {
    const baseUrl = getBaseUrl();
    const resetLink = `${baseUrl}/api/v1/auth/forgot-password`;
    const html = HTML_NEW_LOGIN.replace(/{{USERNAME}}/g, escapeHtml(options.username))
      .replace(/{{LOGIN_TIME}}/g, escapeHtml(options.time))
      .replace(/{{LOGIN_LOCATION}}/g, escapeHtml(options.location))
      .replace(/{{LOGIN_DEVICE}}/g, escapeHtml(options.device))
      .replace(/{{RESET_URL}}/g, resetLink);
    await transport.sendMail({
      from: '"Notes App"',
      to: options.to,
      subject: 'New login detected — Notes App',
      html,
    });
    logger.info('New login mail sent successfully');
  } catch (e) {
    logger.error('New login mail error', {
      message: e instanceof Error ? e.message : e,
    });
    throw e;
  }
};
