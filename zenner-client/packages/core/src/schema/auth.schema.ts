import { z } from 'zod';

export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const TokenResponseSchema = z.object({
  accessToken: z.string(),
  tokenType: z.string().default('Bearer'),
  expiresIn: z.number(),
});
export type TokenResponse = z.infer<typeof TokenResponseSchema>;

export const LogoutRequestSchema = z.object({
  allDevices: z.boolean().default(false),
});
export type LogoutRequest = z.infer<typeof LogoutRequestSchema>;

export const LogoutResponseSchema = z.object({
  message: z.string(),
});
export type LogoutResponse = z.infer<typeof LogoutResponseSchema>;
