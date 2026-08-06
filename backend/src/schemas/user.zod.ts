import z from 'zod';

const emailSchema = z
  .string()
  .min(1)
  .trim()
  .max(255)
  .email('Invalid email address');
const passwordSchema = z.string().min(5).max(255).trim();
const usernameSchema = z.string().min(2).max(255).trim();

export const userRegisterSchemaZodValidation = z.object({
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const userLoginSchemaZodValidation = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const userForgotPasswordZodValidation = z.object({ email: emailSchema });
export const passwordAndConfirmPasswordValidation = z.object({
  password: passwordSchema,
  confirmPassword: passwordSchema,
});
