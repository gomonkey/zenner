import { describe, it, expect } from 'vitest';
import {
  LoginRequestSchema,
  TokenResponseSchema,
  LogoutRequestSchema,
  LogoutResponseSchema,
} from '../auth.schema';

describe('auth.schema', () => {
  it('validates a valid LoginRequest', () => {
    const valid = { email: 'user@example.com', password: 'password123' };
    expect(LoginRequestSchema.parse(valid)).toEqual(valid);
  });

  it('rejects invalid email in LoginRequest', () => {
    const invalid = { email: 'not-an-email', password: 'password123' };
    expect(() => LoginRequestSchema.parse(invalid)).toThrow();
  });

  it('rejects empty password in LoginRequest', () => {
    const invalid = { email: 'user@example.com', password: '' };
    expect(() => LoginRequestSchema.parse(invalid)).toThrow();
  });

  it('validates TokenResponse', () => {
    const tokenData = { accessToken: 'jwt.token.value', tokenType: 'Bearer', expiresIn: 900 };
    expect(TokenResponseSchema.parse(tokenData)).toEqual(tokenData);
  });

  it('validates LogoutRequest defaults', () => {
    expect(LogoutRequestSchema.parse({})).toEqual({ allDevices: false });
    expect(LogoutRequestSchema.parse({ allDevices: true })).toEqual({ allDevices: true });
  });

  it('validates LogoutResponse', () => {
    const response = { message: 'Logged out successfully' };
    expect(LogoutResponseSchema.parse(response)).toEqual(response);
  });
});
