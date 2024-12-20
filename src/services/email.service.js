import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { verificationTemplate } from "../templates/verification.template.js";
import { passwordResetTemplate } from "../templates/password-reset.template.js";

// Default email templates
const defaultTemplates = {
  verification: verificationTemplate,
  passwordReset: passwordResetTemplate,
};

// Store custom templates
let customTemplates = { ...defaultTemplates };

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
  // Method to set custom email templates
  setTemplates: (templates) => {
    customTemplates = {
      ...defaultTemplates,
      ...templates,
    };
  },

  sendVerificationEmail: async (email, token, name) => {
    const template = customTemplates.verification(token, name);
    await sendEmail(email, template.subject, template.html);
  },

  sendPasswordResetEmail: async (email, token) => {
    const template = customTemplates.passwordReset(token);
    await sendEmail(email, template.subject, template.html);
  },
};
