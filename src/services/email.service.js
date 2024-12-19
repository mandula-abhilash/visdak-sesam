import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const sesClient = new SESClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const sendEmail = async (to, subject, html) => {
  const command = new SendEmailCommand({
    Source: process.env.SES_EMAIL_FROM,
    Destination: { ToAddresses: [to] },
    Message: {
      Subject: { Data: subject },
      Body: { Html: { Data: html } },
    },
  });
  await sesClient.send(command);
};

export const emailService = {
  sendVerificationEmail: async (email, token) => {
    await sendEmail(
      email,
      "Verify your email address",
      `<h1>Welcome!</h1>
       <p>Please verify your email address by clicking the link below:</p>
       <a href="${process.env.APP_URL}/api/auth/verify-email?token=${token}">Verify Email</a>`
    );
  },

  sendPasswordResetEmail: async (email, token) => {
    await sendEmail(
      email,
      "Reset your password",
      `<h1>Password Reset Request</h1>
       <p>Click the link below to reset your password:</p>
       <a href="${process.env.APP_URL}/api/auth/reset-password?token=${token}">Reset Password</a>
       <p>This link will expire in 1 hour.</p>`
    );
  },
};
