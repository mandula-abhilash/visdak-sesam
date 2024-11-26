import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

/**
 * Factory function to create an SES adapter for sending emails.
 *
 * @param {Object} config - Configuration for the SES adapter.
 * @param {Object} config.emailConfig - Email configuration.
 * @param {string} config.emailConfig.region - AWS SES region.
 * @param {Object} config.emailConfig.credentials - AWS SES credentials.
 * @param {string} config.emailConfig.from - Sender email address.
 * @param {string} config.appUrl - Base application URL for email links.
 *
 * @returns {Object} SES adapter with email functions.
 */
export const createSESAdapter = (config) => {
  // Initialize SES client
  const client = new SESClient({
    region: config.emailConfig.region,
    credentials: config.emailConfig.credentials,
  });

  /**
   * Sends a verification email to the user.
   *
   * @param {string} email - Recipient's email address.
   * @param {string} token - Verification token.
   * @returns {Promise<void>} - Resolves when the email is sent.
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
              <p>Please verify your email address by clicking the link below:</p>
              <a href="${verificationLink}">Verify Email</a>
            `,
          },
        },
      },
    });

    try {
      await client.send(command);
      console.log(`Verification email sent to ${email}`);
    } catch (error) {
      console.error(
        `Failed to send verification email to ${email}:`,
        error.message
      );
      throw new Error("Failed to send verification email");
    }
  };

  /**
   * Sends a password reset email to the user.
   *
   * @param {string} email - Recipient's email address.
   * @param {string} token - Password reset token.
   * @returns {Promise<void>} - Resolves when the email is sent.
   */
  const sendPasswordResetEmail = async (email, token) => {
    const resetLink = `${config.appUrl}/auth/reset-password?token=${token}`;

    const command = new SendEmailCommand({
      Source: config.emailConfig.from,
      Destination: { ToAddresses: [email] },
      Message: {
        Subject: { Data: "Reset your password" },
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

    try {
      await client.send(command);
      console.log(`Password reset email sent to ${email}`);
    } catch (error) {
      console.error(
        `Failed to send password reset email to ${email}:`,
        error.message
      );
      throw new Error("Failed to send password reset email");
    }
  };

  return {
    sendVerificationEmail,
    sendPasswordResetEmail,
  };
};
