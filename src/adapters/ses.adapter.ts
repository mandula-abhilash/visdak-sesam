import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { EmailAdapter, AuthConfig } from '../types';

export class SESAdapter implements EmailAdapter {
  private client: SESClient;
  private config: AuthConfig;

  constructor(config: AuthConfig) {
    this.config = config;
    this.client = new SESClient({
      region: config.emailConfig.region,
      credentials: config.emailConfig.credentials,
    });
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verificationLink = `${this.config.appUrl}/auth/verify-email?token=${token}`;
    
    const command = new SendEmailCommand({
      Source: this.config.emailConfig.from,
      Destination: { ToAddresses: [email] },
      Message: {
        Subject: { Data: 'Verify your email address' },
        Body: {
          Html: {
            Data: `
              <h1>Welcome!</h1>
              <p>Please verify your email address by clicking the link below:</p>
              <a href="${verificationLink}">Verify Email</a>
            `,
          },
        },
      },
    });

    await this.client.send(command);
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetLink = `${this.config.appUrl}/auth/reset-password?token=${token}`;
    
    const command = new SendEmailCommand({
      Source: this.config.emailConfig.from,
      Destination: { ToAddresses: [email] },
      Message: {
        Subject: { Data: 'Reset your password' },
        Body: {
          Html: {
            Data: `
              <h1>Password Reset Request</h1>
              <p>Click the link below to reset your password:</p>
              <a href="${resetLink}">Reset Password</a>
              <p>This link will expire in 1 hour.</p>
            `,
          },
        },
      },
    });

    await this.client.send(command);
  }
}