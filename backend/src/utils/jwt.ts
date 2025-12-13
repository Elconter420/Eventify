import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_min_32_chars_long_here';

export interface TokenPayload {
  userId: string;
  email: string;
}

export interface PasswordResetTokenPayload {
  userId: string;
  email: string;
  purpose: 'password_reset';
}

export const generateToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { 
    expiresIn: '24h' 
  });
};

export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
};

export const generatePasswordResetToken = (payload: Omit<PasswordResetTokenPayload, 'purpose'>): string => {
  return jwt.sign({ ...payload, purpose: 'password_reset' }, JWT_SECRET, {
    expiresIn: '1h',
  });
};

export const verifyPasswordResetToken = (token: string): PasswordResetTokenPayload => {
  return jwt.verify(token, JWT_SECRET) as PasswordResetTokenPayload;
};