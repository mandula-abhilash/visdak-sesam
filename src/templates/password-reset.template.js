import { styles } from "./styles.js";

export const passwordResetTemplate = (token) => ({
  subject: "Reset your password",
  html: `
    <div style="${styles.container}">
      <div style="${styles.header}">
        <h1 style="${styles.title}">Reset Your Password 🔐</h1>
      </div>
      
      <div style="${styles.content}">
        <p>We received a request to reset your password. Click the button below to create a new password:</p>
        
        <div style="text-align: center;">
          <a href="${process.env.APP_URL}/api/auth/reset-password?token=${token}" 
             style="${styles.button}">
            Reset Password
          </a>
        </div>
        
        <p style="${styles.note}">
          If you didn't request this password reset, you can safely ignore this email.
          <br><br>
          If the button above doesn't work, copy and paste this link into your browser:
          <br>
          <a href="${process.env.APP_URL}/api/auth/reset-password?token=${token}" 
             style="${styles.link}">
            ${process.env.APP_URL}/api/auth/reset-password?token=${token}
          </a>
        </p>
        
        <p style="${styles.note}">
          This password reset link will expire in 1 hour for security reasons.
        </p>
      </div>
      
      <div style="${styles.footer}">
        <p>This email was sent automatically. Please do not reply to this email.</p>
      </div>
    </div>
  `,
});
