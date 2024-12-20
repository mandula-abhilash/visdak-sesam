import { styles } from "./styles.js";

export const verificationTemplate = (token, name) => ({
  subject: "Verify your email address",
  html: `
    <div style="${styles.container}">
      <div style="${styles.header}">
        <h1 style="${styles.title}">Welcome ${name}! 👋</h1>
      </div>
      
      <div style="${styles.content}">
        <p>Thank you for signing up! Please verify your email address to get started.</p>
        
        <div style="text-align: center;">
          <a href="${process.env.CLIENT_URL}/auth/verify-email?token=${token}" 
             style="${styles.button}">
            Verify Email Address
          </a>
        </div>
        
        <p style="${styles.note}">
          If the button above doesn't work, copy and paste this link into your browser:
          <br>
          <a href="${process.env.CLIENT_URL}/auth/verify-email?token=${token}" 
             style="${styles.link}">
            ${process.env.CLIENT_URL}/auth/verify-email?token=${token}
          </a>
        </p>
      </div>
      
      <div style="${styles.footer}">
        <p>This email was sent automatically. Please do not reply to this email.</p>
      </div>
    </div>
  `,
});
