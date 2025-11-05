/**
 * Email Service
 * Handles sending emails using Nodemailer
 */

import nodemailer from 'nodemailer';

/**
 * Create email transporter
 * Configure based on environment (Gmail, SendGrid, or other SMTP)
 */
const createTransporter = () => {
  // For development: Use Gmail or Ethereal (test email service)
  // For production: Use SendGrid, AWS SES, or other professional service
  
  if (process.env.EMAIL_SERVICE === 'gmail') {
    // Gmail configuration
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD, // Use App Password, not regular password
      },
    });
  } else if (process.env.EMAIL_SERVICE === 'smtp') {
    // Custom SMTP configuration
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  } else {
    // Default: Use Ethereal (fake SMTP for development/testing)
    // Emails won't actually be sent, but you can preview them
    console.warn('⚠️  No email service configured. Using test mode (emails will not be sent).');
    console.warn('📧  To enable emails, configure EMAIL_SERVICE in .env file');
    return null;
  }
};

/**
 * Send an email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @param {string} options.text - Plain text content (optional)
 * @returns {Promise<Object>}
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  const transporter = createTransporter();

  if (!transporter) {
    // Test mode: Log email instead of sending
    console.log('\n📧 ========== TEST EMAIL (Not Actually Sent) ==========');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`HTML Content: ${html.substring(0, 200)}...`);
    console.log('====================================================\n');
    
    return {
      success: true,
      messageId: 'test-mode-' + Date.now(),
      testMode: true,
    };
  }

  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || 'LinkedIn Clone'}" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
    text: text || stripHtml(html), // Fallback to plain text
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.messageId);
    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

/**
 * Strip HTML tags for plain text version
 * @param {string} html - HTML content
 * @returns {string} Plain text
 */
const stripHtml = (html) => {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
};

/**
 * Send password reset email with professional template
 * @param {string} email - User email
 * @param {string} resetUrl - Password reset URL
 * @param {string} userName - User's name
 * @returns {Promise<Object>}
 */
export const sendPasswordResetEmail = async (email, resetUrl, userName = 'User') => {
  const subject = 'Reset Your Password - LinkedIn Clone';
  
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background-color: #f3f2ef;
        }
        .email-container {
          max-width: 600px;
          margin: 40px auto;
          background-color: #ffffff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #0a66c2 0%, #004182 100%);
          padding: 40px 30px;
          text-align: center;
        }
        .logo {
          font-size: 32px;
          font-weight: bold;
          color: #ffffff;
          margin-bottom: 10px;
        }
        .header-subtitle {
          color: #ffffff;
          font-size: 14px;
          opacity: 0.9;
        }
        .content {
          padding: 40px 30px;
        }
        .greeting {
          font-size: 20px;
          font-weight: 600;
          color: #000000;
          margin-bottom: 20px;
        }
        .message {
          font-size: 16px;
          color: #333333;
          line-height: 1.6;
          margin-bottom: 30px;
        }
        .button-container {
          text-align: center;
          margin: 35px 0;
        }
        .reset-button {
          display: inline-block;
          background-color: #0a66c2;
          color: #ffffff !important;
          text-decoration: none;
          padding: 14px 40px;
          border-radius: 24px;
          font-weight: 600;
          font-size: 16px;
          transition: background-color 0.3s;
        }
        .reset-button:hover {
          background-color: #004182;
        }
        .alternative-link {
          margin-top: 20px;
          padding: 20px;
          background-color: #f3f2ef;
          border-radius: 4px;
          word-break: break-all;
        }
        .alternative-text {
          font-size: 13px;
          color: #666666;
          margin-bottom: 10px;
        }
        .link-text {
          font-size: 12px;
          color: #0a66c2;
          word-break: break-all;
        }
        .security-info {
          margin-top: 30px;
          padding: 20px;
          background-color: #fff5e6;
          border-left: 4px solid #ffa500;
          border-radius: 4px;
        }
        .security-title {
          font-weight: 600;
          color: #d97706;
          margin-bottom: 10px;
          font-size: 14px;
        }
        .security-text {
          font-size: 13px;
          color: #666666;
          line-height: 1.5;
        }
        .footer {
          background-color: #f3f2ef;
          padding: 30px;
          text-align: center;
        }
        .footer-text {
          font-size: 13px;
          color: #666666;
          line-height: 1.5;
          margin-bottom: 15px;
        }
        .expiry-warning {
          display: inline-block;
          margin-top: 15px;
          padding: 10px 20px;
          background-color: #fff0f0;
          border: 1px solid #ffcccc;
          border-radius: 4px;
          font-size: 13px;
          color: #cc0000;
          font-weight: 500;
        }
        .social-links {
          margin-top: 20px;
        }
        .social-link {
          display: inline-block;
          margin: 0 10px;
          color: #0a66c2;
          text-decoration: none;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <!-- Header -->
        <div class="header">
          <div class="logo">🔗 LinkedIn Clone</div>
          <div class="header-subtitle">Professional Network</div>
        </div>

        <!-- Content -->
        <div class="content">
          <div class="greeting">Hi ${userName},</div>
          
          <div class="message">
            We received a request to reset your password. Click the button below to create a new password for your account.
          </div>

          <!-- Reset Button -->
          <div class="button-container">
            <a href="${resetUrl}" class="reset-button">Reset Your Password</a>
          </div>

          <div class="expiry-warning">
            ⏱️ This link will expire in 1 hour
          </div>

          <!-- Alternative Link -->
          <div class="alternative-link">
            <div class="alternative-text">If the button above doesn't work, copy and paste this link into your browser:</div>
            <div class="link-text">${resetUrl}</div>
          </div>

          <!-- Security Information -->
          <div class="security-info">
            <div class="security-title">🔒 Security Notice</div>
            <div class="security-text">
              • If you didn't request this password reset, please ignore this email or contact support if you have concerns.<br>
              • Your password will not be changed unless you click the reset link above.<br>
              • Never share this email or link with anyone.<br>
              • For security reasons, this link is single-use and will expire in 1 hour.
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="footer">
          <div class="footer-text">
            This is an automated message from LinkedIn Clone.<br>
            Please do not reply to this email.
          </div>
          
          <div class="footer-text">
            © ${new Date().getFullYear()} LinkedIn Clone. All rights reserved.
          </div>

          <div class="social-links">
            <a href="#" class="social-link">Help Center</a>
            <span style="color: #cccccc;">|</span>
            <a href="#" class="social-link">Privacy Policy</a>
            <span style="color: #cccccc;">|</span>
            <a href="#" class="social-link">Terms of Service</a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Hi ${userName},

    We received a request to reset your password for LinkedIn Clone.

    Reset your password by clicking this link:
    ${resetUrl}

    This link will expire in 1 hour.

    If you didn't request this password reset, please ignore this email.

    Thanks,
    LinkedIn Clone Team
  `;

  return await sendEmail({ to: email, subject, html, text });
};

/**
 * Send welcome email to new users
 * @param {string} email - User email
 * @param {string} userName - User's name
 * @returns {Promise<Object>}
 */
export const sendWelcomeEmail = async (email, userName) => {
  const subject = 'Welcome to LinkedIn Clone! 🎉';
  
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to LinkedIn Clone</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background-color: #f3f2ef;
        }
        .email-container {
          max-width: 600px;
          margin: 40px auto;
          background-color: #ffffff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #0a66c2 0%, #004182 100%);
          padding: 40px 30px;
          text-align: center;
        }
        .logo {
          font-size: 32px;
          font-weight: bold;
          color: #ffffff;
          margin-bottom: 10px;
        }
        .content {
          padding: 40px 30px;
        }
        .welcome-title {
          font-size: 24px;
          font-weight: 600;
          color: #000000;
          text-align: center;
          margin-bottom: 20px;
        }
        .message {
          font-size: 16px;
          color: #333333;
          line-height: 1.6;
          margin-bottom: 25px;
        }
        .footer {
          background-color: #f3f2ef;
          padding: 30px;
          text-align: center;
          font-size: 13px;
          color: #666666;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <div class="logo">🔗 LinkedIn Clone</div>
        </div>
        <div class="content">
          <div class="welcome-title">Welcome to LinkedIn Clone, ${userName}! 🎉</div>
          <div class="message">
            Thank you for joining our professional network. We're excited to have you on board!
          </div>
          <div class="message">
            Start connecting with professionals, sharing your experiences, and growing your network.
          </div>
        </div>
        <div class="footer">
          © ${new Date().getFullYear()} LinkedIn Clone. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({ to: email, subject, html });
};

export default {
  sendEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
};
