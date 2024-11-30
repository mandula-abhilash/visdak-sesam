import bcrypt from "bcryptjs";
import { UserModel } from "../models/user.model.js";
import { emailService } from "../services/email.service.js";
import { generateTokens, verifyToken } from "../utils/token.utils.js";
import { setAuthCookies, clearAuthCookies } from "../utils/cookie.utils.js";
import crypto from "crypto";

// Register controller
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        status: "error",
        error: { code: 400, details: "Email already registered" },
      });
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await UserModel.create({
      name,
      email,
      password: hashedPassword,
      verificationToken,
      isVerified: false,
      role: "user",
    });

    await emailService.sendVerificationEmail(email, verificationToken);

    res.status(201).json({
      status: "success",
      data: { email: user.email },
      message: "Registration successful. Please verify your email.",
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      error: { code: 400, details: error.message },
    });
  }
};

// Login controller
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await UserModel.findOne({ email }).select("+password");
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        status: "error",
        error: { code: 401, details: "Invalid email or password" },
      });
    }

    if (!user.isVerified) {
      return res.status(401).json({
        status: "error",
        error: { code: 401, details: "Please verify your email first" },
      });
    }

    const tokenPayload = { userId: user._id, role: user.role };
    const { accessToken, refreshToken } = generateTokens(tokenPayload);

    // Set HTTP-only cookies
    setAuthCookies(res, accessToken, refreshToken);

    const { password: _, ...userWithoutPassword } = user.toObject();
    res.json({
      status: "success",
      data: { user: userWithoutPassword },
    });
  } catch (error) {
    res.status(401).json({
      status: "error",
      error: { code: 401, details: error.message },
    });
  }
};

// Verify Email controller
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    const user = await UserModel.findOne({ verificationToken: token });

    if (!user) {
      return res.status(400).json({
        status: "error",
        error: { code: 400, details: "Invalid or expired verification token" },
      });
    }

    await UserModel.findByIdAndUpdate(user._id, {
      isVerified: true,
      verificationToken: null,
    });

    res.json({
      status: "success",
      message: "Email verified successfully",
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      error: { code: 400, details: error.message },
    });
  }
};

// Forgot Password controller
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(404).json({
        status: "error",
        error: { code: 404, details: "No user found with this email" },
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    await UserModel.findByIdAndUpdate(user._id, {
      passwordResetToken: resetToken,
      passwordResetExpires: new Date(Date.now() + 3600000), // 1 hour
    });

    await emailService.sendPasswordResetEmail(email, resetToken);

    res.json({
      status: "success",
      message: "Password reset email sent",
    });
  } catch (error) {
    res.status(404).json({
      status: "error",
      error: { code: 404, details: error.message },
    });
  }
};

// Reset Password controller
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const user = await UserModel.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        status: "error",
        error: { code: 400, details: "Invalid or expired reset token" },
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await UserModel.findByIdAndUpdate(user._id, {
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpires: null,
    });

    res.json({
      status: "success",
      message: "Password reset successfully",
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      error: { code: 400, details: error.message },
    });
  }
};

// Refresh Token controller
export const refreshToken = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;

    if (!token) {
      return res.status(401).json({
        status: "error",
        error: { code: 401, details: "Refresh token not found" },
      });
    }

    const decoded = verifyToken(token, process.env.REFRESH_TOKEN_SECRET);
    const user = await UserModel.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        status: "error",
        error: { code: 401, details: "User not found" },
      });
    }

    const tokenPayload = { userId: user._id, role: user.role };
    const { accessToken, refreshToken: newRefreshToken } =
      generateTokens(tokenPayload);

    // Set new HTTP-only cookies
    setAuthCookies(res, accessToken, newRefreshToken);

    res.json({
      status: "success",
      message: "Tokens refreshed successfully",
    });
  } catch (error) {
    res.status(401).json({
      status: "error",
      error: { code: 401, details: error.message },
    });
  }
};

// Logout controller
export const logout = async (req, res) => {
  clearAuthCookies(res);

  res.json({
    status: "success",
    message: "Logged out successfully",
  });
};

export const session = async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.userId).select("-password");

    if (!user) {
      return res.status(404).json({
        status: "error",
        error: { code: 404, details: "User not found" },
      });
    }

    res.json({
      status: "success",
      data: { user },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      error: { code: 500, details: error.message },
    });
  }
};
