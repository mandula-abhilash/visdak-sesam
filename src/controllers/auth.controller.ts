import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { UserModel } from '../models/user.model';
import { TokenService } from '../utils/token';
import { EmailService } from '../services/email.service';
import { createSuccessResponse, createErrorResponse } from '../utils/response';

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json(
        createErrorResponse(400, 'Email already registered')
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const user = await UserModel.create({
      name,
      email,
      password: hashedPassword,
      verificationToken,
    });

    await EmailService.sendVerificationEmail(email, verificationToken);

    return res.status(201).json(
      createSuccessResponse(
        { email: user.email },
        'Registration successful. Please check your email to verify your account.'
      )
    );
  } catch (error) {
    return res.status(500).json(
      createErrorResponse(500, 'Registration failed')
    );
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await UserModel.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json(
        createErrorResponse(401, 'Invalid credentials')
      );
    }

    if (!user.isVerified) {
      return res.status(401).json(
        createErrorResponse(401, 'Please verify your email before logging in')
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json(
        createErrorResponse(401, 'Invalid credentials')
      );
    }

    const tokenPayload = { userId: user._id, role: user.role };
    const accessToken = TokenService.generateAccessToken(tokenPayload);
    const refreshToken = TokenService.generateRefreshToken(tokenPayload);

    return res.json(
      createSuccessResponse({
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      })
    );
  } catch (error) {
    return res.status(500).json(
      createErrorResponse(500, 'Login failed')
    );
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.query;

    const user = await UserModel.findOne({ verificationToken: token });
    if (!user) {
      return res.status(400).json(
        createErrorResponse(400, 'Invalid verification token')
      );
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    return res.json(
      createSuccessResponse(null, 'Email verified successfully')
    );
  } catch (error) {
    return res.status(500).json(
      createErrorResponse(500, 'Email verification failed')
    );
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(404).json(
        createErrorResponse(404, 'User not found')
      );
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = new Date(Date.now() + 3600000); // 1 hour
    await user.save();

    await EmailService.sendPasswordResetEmail(email, resetToken);

    return res.json(
      createSuccessResponse(null, 'Password reset email sent')
    );
  } catch (error) {
    return res.status(500).json(
      createErrorResponse(500, 'Failed to send password reset email')
    );
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    const user = await UserModel.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json(
        createErrorResponse(400, 'Invalid or expired reset token')
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return res.json(
      createSuccessResponse(null, 'Password reset successful')
    );
  } catch (error) {
    return res.status(500).json(
      createErrorResponse(500, 'Password reset failed')
    );
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    const decoded = TokenService.verifyToken(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET!
    );

    const user = await UserModel.findById(decoded.userId);
    if (!user) {
      return res.status(404).json(
        createErrorResponse(404, 'User not found')
      );
    }

    const tokenPayload = { userId: user._id, role: user.role };
    const accessToken = TokenService.generateAccessToken(tokenPayload);

    return res.json(
      createSuccessResponse({ accessToken })
    );
  } catch (error) {
    return res.status(401).json(
      createErrorResponse(401, 'Invalid refresh token')
    );
  }
};