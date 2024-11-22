import { Router } from 'express';
import { AuthService } from './auth.service';
import { DatabaseAdapter, EmailAdapter, AuthConfig } from './types';
import { MongooseAdapter } from './adapters/mongoose.adapter';
import { SESAdapter } from './adapters/ses.adapter';
import { createAuthController } from './controllers/auth.controller';
import { createAuthMiddleware } from './middleware/auth.middleware';

export const createAuthModule = (config: AuthConfig) => {
  let dbAdapter: DatabaseAdapter;
  let emailAdapter: EmailAdapter;

  // Initialize database adapter (example with mongoose)
  dbAdapter = new MongooseAdapter(process.env.MONGODB_URI!);

  // Initialize email adapter based on config
  if (config.emailConfig.provider === 'ses') {
    emailAdapter = new SESAdapter(config);
  } else {
    throw new Error('Email provider not supported');
  }

  const authService = new AuthService(dbAdapter, emailAdapter, config);
  const authController = createAuthController(authService);
  const { protect, requireAdmin } = createAuthMiddleware(config);

  const router = Router();

  router.post('/register', authController.register);
  router.post('/login', authController.login);
  router.get('/verify-email', authController.verifyEmail);
  router.post('/forgot-password', authController.forgotPassword);
  router.post('/reset-password', authController.resetPassword);
  router.post('/refresh-token', authController.refreshToken);

  return {
    router,
    middleware: {
      protect,
      requireAdmin,
    },
    service: authService,
  };
};

export * from './types';
export * from './adapters/mongoose.adapter';
export * from './adapters/ses.adapter';