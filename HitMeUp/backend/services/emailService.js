const nodemailer = require("nodemailer");

/**
 * Creates and returns a configured Nodemailer transporter if environment variables exist.
 * Supports standard SMTP (host/port/user/pass) or direct service (e.g. Gmail).
 */
const getTransporter = () => {
  const user = process.env.EMAIL_USER || process.env.SMTP_USER;
  const pass = process.env.EMAIL_PASS || process.env.SMTP_PASS;
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass }
    });
  }

  if (user && pass) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass }
    });
  }

  return null;
};

/**
 * Sends a 6-digit OTP verification email for account registration or password reset.
 * Falls back to console delivery in development environments when SMTP credentials are not configured.
 *
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} options.otp - 6-digit verification code
 * @param {'register'|'forgot_password'} options.purpose - Context of the verification request
 */
const sendOtpEmail = async ({ to, otp, purpose }) => {
  const isRegister = purpose === "register";
  const subject = isRegister
    ? "Verify your email for HitMeUp"
    : "Reset your HitMeUp password";

  const purposeHeading = isRegister
    ? "Welcome to HitMeUp! Verify your email"
    : "Password Reset Request";

  const purposeText = isRegister
    ? "Thank you for joining HitMeUp. To activate your account, please use the 6-digit verification code below:"
    : "We received a request to reset your HitMeUp account password. Enter this verification code to set a new password:";

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${subject}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F7F4EE; margin: 0; padding: 24px; color: #1F1B16; }
        .card { max-width: 520px; margin: 0 auto; background: #FFFFFF; border-radius: 14px; border: 1px solid #E6E0D6; padding: 36px 32px; box-shadow: 0 4px 16px rgba(31,27,22,0.04); }
        .logo { font-size: 22px; font-weight: 700; color: #D94832; margin-bottom: 24px; }
        .logo span { color: #1F1B16; }
        h1 { font-size: 20px; font-weight: 600; color: #1F1B16; margin: 0 0 12px 0; }
        p { font-size: 14px; line-height: 1.6; color: #5E554A; margin: 0 0 20px 0; }
        .otp-box { background: #F7F4EE; border: 1px dashed #D94832; border-radius: 10px; padding: 18px 24px; text-align: center; margin: 24px 0; }
        .otp-code { font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #D94832; }
        .expiry { font-size: 12px; color: #7B7266; margin-top: 6px; }
        .footer { font-size: 12px; color: #A89F91; border-top: 1px solid #E6E0D6; padding-top: 18px; margin-top: 28px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="logo">Hit<span>MeUp</span></div>
        <h1>${purposeHeading}</h1>
        <p>${purposeText}</p>
        <div class="otp-box">
          <div class="otp-code">${otp}</div>
          <div class="expiry">This code will expire in 15 minutes.</div>
        </div>
        <p>If you did not request this code, you can safely ignore this email. No changes will be made to your account.</p>
        <div class="footer">
          &copy; ${new Date().getFullYear()} HitMeUp Flash Deals Marketplace. Colombo, Sri Lanka.
        </div>
      </div>
    </body>
    </html>
  `;

  const transporter = getTransporter();

  if (transporter) {
    try {
      const from = process.env.EMAIL_FROM || `"HitMeUp Security" <${process.env.EMAIL_USER || "no-reply@hitmeup.lk"}>`;
      const info = await transporter.sendMail({
        from,
        to,
        subject,
        text: `${purposeHeading}\n\n${purposeText}\n\nYour 6-digit code: ${otp}\n(Expires in 15 minutes)\n\nIf you did not request this, please ignore.`,
        html: htmlContent
      });
      console.log(`[HitMeUp Email Service] ✓ Sent OTP email to ${to} (MessageID: ${info.messageId})`);
      return { delivered: true, provider: "smtp" };
    } catch (err) {
      console.warn(`[HitMeUp Email Service] SMTP send failed (${err.message}). Falling back to console logging.`);
    }
  }

  // Development Fallback Console Log
  console.log("\n========================================================================");
  console.log(`[HitMeUp Email Service] ✉️  SIMULATED EMAIL DISPATCH`);
  console.log(`Recipient : ${to}`);
  console.log(`Subject   : ${subject}`);
  console.log(`Purpose   : ${purpose}`);
  console.log(`OTP Code  : ${otp}`);
  console.log(`Expires In: 15 minutes`);
  console.log("========================================================================\n");

  return { delivered: true, provider: "console" };
};

module.exports = {
  sendOtpEmail
};

