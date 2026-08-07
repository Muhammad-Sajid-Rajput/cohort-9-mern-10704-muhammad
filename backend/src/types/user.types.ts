import z from 'zod';
import {
  passwordAndConfirmPasswordValidation,
  userForgotPasswordZodValidation,
  userLoginSchemaZodValidation,
  userRegisterSchemaZodValidation,
} from '../schemas/user.zod';

export type userRegisterBody = z.infer<typeof userRegisterSchemaZodValidation>;
export type userLoginBody = z.infer<typeof userLoginSchemaZodValidation>;
export type userForgotPasswordBody = z.infer<
  typeof userForgotPasswordZodValidation
>;
export type passwordAndConfirmPasswordType = z.infer<
  typeof passwordAndConfirmPasswordValidation
>;
