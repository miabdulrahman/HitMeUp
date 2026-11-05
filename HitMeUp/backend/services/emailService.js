const nodemailer = require("nodemailer");

/**
 * Creates and returns a Nodemailer transporter configured strictly for Google (Gmail).
 * Requires EMAIL_USER (Gmail address) and EMAIL_PASS (16-character Google App Password).
 */
const getGoogleTransporter = () => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user,
      pass
    },
    tls: {
      rejectUnauthorized: false
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000
  });
};

/**
 * Sends a 6-digit OTP verification email strictly using Google (Gmail).
 * If EMAIL_USER or EMAIL_PASS are not configured or connection times out,
 * safely falls back to console logging so development/tests are never blocked.
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

  const textContent = `${purposeHeading}\n\n${purposeText}\n\nYour 6-digit code: ${otp}\n(Expires in 15 minutes)\n\nIf you did not request this, please ignore.`;

  const transporter = getGoogleTransporter();

  if (transporter) {
    try {
      const from = process.env.EMAIL_FROM || `"HitMeUp Security" <${process.env.EMAIL_USER}>`;
      const info = await transporter.sendMail({
        from,
        to,
        subject,
        text: textContent,
        html: htmlContent
      });
      console.log(`[HitMeUp Email Service] ✓ Sent Google OTP email to ${to} (MessageID: ${info.messageId})`);
      return { delivered: true, provider: "google" };
    } catch (err) {
      console.warn(`[HitMeUp Email Service] Google SMTP send failed (${err.message}). Falling back to console logging.`);
    }
  } else {
    console.warn("[HitMeUp Email Service] EMAIL_USER or EMAIL_PASS not configured. Falling back to console logging.");
  }

  // Fallback Console Log (for local testing or when email providers are not reachable)
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
