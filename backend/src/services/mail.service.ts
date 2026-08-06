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

export const sendMail = async (to: string, token: string) => {
  try {
    const BASE_URL = process.env.BASE_URL || 'http://localhost:8000';
    const verifyLink = `${BASE_URL}/api/v1/auth/verify/${token}`;
    await transport.sendMail({
      from: '"Notes App"',
      to,
      subject: 'Verify your email — Notes App',
      html: HTML_VERIFY_EMAIL.replace(/{{VERIFY_URL}}/g, verifyLink),
    });
    logger.info(`Verification mail sent to ${to}`);
  } catch (e) {
    logger.error('Mail error', { message: e instanceof Error ? e.message : e });
    throw e;
  }
};

export const sendForgotPasswordMail = async (to: string, token: string) => {
  try {
    const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetLink = `${FRONTEND_URL}/reset-password/${token}`;
    await transport.sendMail({
      from: '"Notes App"',
      to,
      subject: 'Reset your password — Notes App',
      html: HTML_FORGOT_PASSWORD.replace(/{{RESET_URL}}/g, resetLink),
    });
    logger.info(`Password reset mail sent to ${to}`);
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
) => {
  try {
    await transport.sendMail({
      from: '"Notes App"',
      to,
      subject: 'Your password was reset — Notes App',
      html: HTML_PASSWORD_RESET_SUCCESS.replace(/{{USERNAME}}/g, username),
    });
    logger.info(`Password reset success mail sent to ${to}`);
  } catch (e) {
    logger.error('Password reset success mail error', {
      message: e instanceof Error ? e.message : e,
    });
    throw e;
  }
};

export const sendAccountVerifiedMail = async (to: string, username: string) => {
  try {
    await transport.sendMail({
      from: '"Notes App"',
      to,
      subject: 'Account verified — Notes App',
      html: HTML_ACCOUNT_VERIFIED.replace(/{{USERNAME}}/g, username),
    });
    logger.info(`Account verified mail sent to ${to}`);
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

export const sendNewLoginMail = async (options: NewLoginMailOptions) => {
  try {
    const BASE_URL = process.env.BASE_URL || 'http://localhost:8000';
    const resetLink = `${BASE_URL}/api/v1/auth/forgot-password`;
    const html = HTML_NEW_LOGIN.replace(/{{USERNAME}}/g, options.username)
      .replace(/{{LOGIN_TIME}}/g, options.time)
      .replace(/{{LOGIN_LOCATION}}/g, options.location)
      .replace(/{{LOGIN_DEVICE}}/g, options.device)
      .replace(/{{RESET_URL}}/g, resetLink);
    await transport.sendMail({
      from: '"Notes App"',
      to: options.to,
      subject: 'New login detected — Notes App',
      html,
    });
    logger.info(`New login mail sent to ${options.to}`);
  } catch (e) {
    logger.error('New login mail error', {
      message: e instanceof Error ? e.message : e,
    });
    throw e;
  }
};
