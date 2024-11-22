import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

/**
 * Factory function to create the email service.
 *
 * @param {Object} config - Configuration for the email service.
 * @param {string} config.appUrl - Base URL of the application (used for links in emails).
 * @param {Object} config.emailConfig - Email configuration settings.
 * @param {string} config.emailConfig.from - Sender email address for outgoing emails.
 * @param {string} config.emailConfig.region - AWS region for SES.
 * @param {Object} config.emailConfig.credentials - AWS SES credentials.
 * @returns {Object} Email service with methods to send emails.
 */
export const createEmailService = (config) => {
  const client = new SESClient({
    region: config.emailConfig.region,
    credentials: config.emailConfig.credentials,
  });

  /**
   * Sends a verification email to the user.
   *
   * @param {string} email - Recipient's email address.
   * @param {string} token - Email verification token.
   * @returns {Promise<void>} Resolves when the email is sent successfully.
   */
  const sendVerificationEmail = async (email, token) => {
    const verificationLink = `${config.appUrl}/auth/verify-email?token=${token}`;
    const command = new SendEmailCommand({
      Source: config.emailConfig.from,
      Destination: { ToAddresses: [email] },
      Message: {
        Subject: { Data: "Verify your email address" },
        Body: {
          Html: {
            Data: `
              <h1>Welcome!</h1>
              <p>Click the link below to verify your email:</p>
              <a href="${verificationLink}">Verify Email</a>
            `,
          },
        },
      },
    });
    await client.send(command);
  };

  /**
   * Sends a password reset email to the user.
   *
   * @param {string} email - Recipient's email address.
   * @param {string} token - Password reset token.
   * @returns {Promise<void>} Resolves when the email is sent successfully.
   */
  const sendPasswordResetEmail = async (email, token) => {
    const resetLink = `${config.appUrl}/auth/reset-password?token=${token}`;
    const command = new SendEmailCommand({
      Source: config.emailConfig.from,
      Destination: { ToAddresses: [email] },
      Message: {
        Subject: { Data: "Password Reset Request" },
        Body: {
          Html: {
            Data: `
              <h1>Password Reset</h1>
              <p>Click the link below to reset your password:</p>
              <a href="${resetLink}">Reset Password</a>
              <p>The link will expire in 1 hour.</p>
            `,
          },
        },
      },
    });
    await client.send(command);
  };

  return {
    sendVerificationEmail,
    sendPasswordResetEmail,
  };
};
