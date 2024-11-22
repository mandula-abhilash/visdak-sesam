import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { DatabaseAdapter, EmailAdapter, AuthConfig, User, TokenPayload } from './types';
import { TokenService } from './utils/token';

export class AuthService {
  constructor(
    private db: DatabaseAdapter,
    private email: EmailAdapter,
    private config: AuthConfig
  ) {}

  async register(name: string, email: string, password: string): Promise<User> {
    const existingUser = await this.db.findUserByEmail(email);
    if (existingUser) {
      throw new Error('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const user = await this.db.createUser({
      name,
      email,
      password: hashedPassword,
      verificationToken,
      isVerified: false,
      role: 'user',
    });

    await this.email.sendVerificationEmail(email, verificationToken);
    return user;
  }

  async login(email: string, password: string): Promise<{
    user: Omit<User, 'password'>;
    accessToken: string;
    refreshToken: string;
  }> {
    const user = await this.db.findUserByEmail(email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    if (!user.isVerified) {
      throw new Error('Please verify your email before logging in');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    const tokenPayload: TokenPayload = { userId: user.id, role: user.role };
    const tokenService = new TokenService(this.config);

    const { password: _, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
      accessToken: tokenService.generateAccessToken(tokenPayload),
      refreshToken: tokenService.generateRefreshToken(tokenPayload),
    };
  }

  async verifyEmail(token: string): Promise<void> {
    const user = await this.db.findUserByVerificationToken(token);
    if (!user) {
      throw new Error('Invalid verification token');
    }

    await this.db.updateUser(user.id, {
      isVerified: true,
      verificationToken: undefined,
    });
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.db.findUserByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const passwordResetExpires = new Date(Date.now() + 3600000); // 1 hour

    await this.db.updateUser(user.id, {
      passwordResetToken: resetToken,
      passwordResetExpires,
    });

    await this.email.sendPasswordResetEmail(email, resetToken);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await this.db.findUserByResetToken(token, new Date());
    if (!user) {
      throw new Error('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.db.updateUser(user.id, {
      password: hashedPassword,
      passwordResetToken: undefined,
      passwordResetExpires: undefined,
    });
  }

  async refreshToken(refreshToken: string): Promise<string> {
    const tokenService = new TokenService(this.config);
    const decoded = tokenService.verifyRefreshToken(refreshToken);

    const user = await this.db.findUserById(decoded.userId);
    if (!user) {
      throw new Error('User not found');
    }

    return tokenService.generateAccessToken({ userId: user.id, role: user.role });
  }
}