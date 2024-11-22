import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

export class EmailService {
  private static client = new SESClient({
    region: process.env.AWS_REGION,
  });

  static async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verificationLink = `${process.env.APP_URL}/auth/verify-email?token=${token}`;
    
    const command = new SendEmailCommand({
      Source: process.env.SES_EMAIL_FROM,
      Destination: {
        ToAddresses: [email],
      },
      Message: {
        Subject: {
          Data: 'Verify your email address',
        },
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

  static async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetLink = `${process.env.APP_URL}/auth/reset-password?token=${token}`;
    
    const command = new SendEmailCommand({
      Source: process.env.SES_EMAIL_FROM,
      Destination: {
        ToAddresses: [email],
      },
      Message: {
        Subject: {
          Data: 'Reset your password',
        },
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