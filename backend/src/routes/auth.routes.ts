import { Router } from 'express';
import { zodMiddleware } from '../middlewares/zodMiddleware';
import {
  changePasswordAfterForgot,
  deleteUser,
  forgotUserCredentials,
  getRefreshToken,
  loginUser,
  logoutUser,
  me,
  registerUser,
  verifyUser,
} from '../controllers/auth';
import {
  passwordAndConfirmPasswordValidation,
  userForgotPasswordZodValidation,
  userLoginSchemaZodValidation,
  userRegisterSchemaZodValidation,
} from '../schemas/user.zod';
import { validationJwtMiddleware } from '../middlewares/validator';

export const authRoute = Router();

authRoute.post(
  '/signup',
  zodMiddleware(userRegisterSchemaZodValidation),
  registerUser,
);
authRoute.post(
  '/signin',
  zodMiddleware(userLoginSchemaZodValidation),
  loginUser,
);
authRoute.get('/verify/:token', verifyUser);

authRoute.post('/refreshToken', getRefreshToken);

authRoute.post(
  '/forgotPassword',
  zodMiddleware(userForgotPasswordZodValidation),
  forgotUserCredentials,
);

authRoute.post(
  '/resetPassword/:token',
  zodMiddleware(passwordAndConfirmPasswordValidation),
  changePasswordAfterForgot,
);

authRoute.get('/me', validationJwtMiddleware, me);

authRoute.post('/logout', logoutUser);
authRoute.delete('/deleteUser', validationJwtMiddleware, deleteUser);
