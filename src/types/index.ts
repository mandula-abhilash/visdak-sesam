import { Request } from 'express';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
  isVerified: boolean;
  verificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface TokenPayload {
  userId: string;
  role: string;
}

export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
  error?: {
    code: number;
    details?: string;
  };
}

export interface AuthConfig {
  jwtSecret: string;
  refreshTokenSecret: string;
  accessTokenExpiry: string;
  refreshTokenExpiry: string;
  emailConfig: {
    provider: 'ses' | 'smtp';
    from: string;
    region?: string;
    credentials?: {
      accessKeyId: string;
      secretAccessKey: string;
    };
    smtp?: {
      host: string;
      port: number;
      auth: {
        user: string;
        pass: string;
      };
    };
  };
  appUrl: string;
}

export interface DatabaseAdapter {
  findUserByEmail(email: string): Promise<User | null>;
  findUserById(id: string): Promise<User | null>;
  findUserByVerificationToken(token: string): Promise<User | null>;
  findUserByResetToken(token: string, expiryDate: Date): Promise<User | null>;
  createUser(userData: Partial<User>): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | null>;
}

export interface EmailAdapter {
  sendVerificationEmail(email: string, token: string): Promise<void>;
  sendPasswordResetEmail(email: string, token: string): Promise<void>;
}

export interface AuthRequest extends Request {
  user?: TokenPayload;
}