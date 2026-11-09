const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const Business = require("../models/Business");
const EmailOtp = require("../models/EmailOtp");
const { createBusinessRecord } = require("./businessController");
const { JWT_SECRET } = require("../middleware/authMiddleware");
const { sendOtpEmail } = require("../services/emailService");

const AUTH_COOKIE_NAME = "hitmeup_session";
const CSRF_COOKIE_NAME = "hitmeup_csrf";
const AUTH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

const getCookieOptions = (httpOnly) => ({
  httpOnly,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.COOKIE_SAME_SITE || (process.env.NODE_ENV === "production" ? "none" : "lax"),
  ...(process.env.COOKIE_DOMAIN ? { domain: process.env.COOKIE_DOMAIN } : {}),
  maxAge: AUTH_COOKIE_MAX_AGE
});

const setAuthCookies = (res, token) => {
  res.cookie(AUTH_COOKIE_NAME, token, getCookieOptions(true));
  res.cookie(CSRF_COOKIE_NAME, crypto.randomBytes(32).toString("hex"), getCookieOptions(false));
};

const clearAuthCookies = (res) => {
  res.clearCookie(AUTH_COOKIE_NAME, { ...getCookieOptions(true), maxAge: undefined });
  res.clearCookie(CSRF_COOKIE_NAME, { ...getCookieOptions(false), maxAge: undefined });
};

// Helper to generate signed JWT
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      email: user.email,
      businessId: user.businessId || null
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
};

/**
 * @desc    Send 6-digit OTP for email verification or password reset
 * @route   POST /api/auth/send-otp
 * @access  Public
 */
const sendOtp = async (req, res) => {
  try {
    const { email, purpose } = req.body;

    if (!email || !purpose) {
      return res.status(400).json({
        success: false,
        message: "Email and purpose are required"
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const validPurposes = ["register", "forgot_password"];

    if (!validPurposes.includes(purpose)) {
      return res.status(400).json({
        success: false,
        message: "Purpose must be either 'register' or 'forgot_password'"
      });
    }

    // Purpose-specific user existence checks
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (purpose === "register" && existingUser) {
      return res.status(400).json({
        success: false,
        message: "An account with this email already exists. Please log in."
      });
    }

    if (purpose === "forgot_password" && !existingUser) {
      return res.status(404).json({
        success: false,
        message: "No account found with this email address. Please register or check your spelling."
      });
    }

    // Generate an unpredictable 6-digit code.
    const otp = String(crypto.randomInt(100000, 1000000));

    // Store or update in EmailOtp collection
    await EmailOtp.findOneAndUpdate(
      { email: normalizedEmail, purpose },
      { otp, verified: false, attempts: 0, createdAt: new Date() },
      { upsert: true, returnDocument: "after" }
    );

    // Send email or log to console
    const emailResult = await sendOtpEmail({
      to: normalizedEmail,
      otp,
      purpose
    });

    return res.status(200).json({
      success: true,
      message: `A 6-digit verification code has been sent to ${normalizedEmail}`,
      ...(emailResult?.provider === "console" && { simulated: true })
    });
  } catch (error) {
    console.error("Send OTP Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send verification code. Please try again.",
      error: error.message
    });
  }
};

/**
 * @desc    Verify 6-digit OTP code
 * @route   POST /api/auth/verify-otp
 * @access  Public
 */
const verifyOtp = async (req, res) => {
  try {
    const { email, otp, purpose } = req.body;

    if (!email || !otp || !purpose) {
      return res.status(400).json({
        success: false,
        message: "Email, otp, and purpose are required"
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const cleanOtp = String(otp).trim();
    const otpRecord = await EmailOtp.findOneAndUpdate(
      {
        email: normalizedEmail,
        purpose,
        otp: cleanOtp,
        verified: false,
        attempts: { $lt: 5 },
        createdAt: { $gte: new Date(Date.now() - 15 * 60 * 1000) }
      },
      { $set: { verified: true } },
      { returnDocument: "after" }
    );

    if (!otpRecord) {
      await EmailOtp.updateOne(
        {
          email: normalizedEmail,
          purpose,
          verified: false,
          attempts: { $lt: 5 },
          otp: { $ne: cleanOtp },
          createdAt: { $gte: new Date(Date.now() - 15 * 60 * 1000) }
        },
        { $inc: { attempts: 1 } }
      );
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification code. Please request a new one."
      });
    }

    return res.status(200).json({
      success: true,
      message: "Verification code confirmed successfully"
    });
  } catch (error) {
    console.error("Verify OTP Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to verify code",
      error: error.message
    });
  }
};

/**
 * @desc    Reset password using verified OTP code
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email, otp, and newPassword are required"
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long"
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const cleanOtp = String(otp).trim();
    const otpRecord = await EmailOtp.findOneAndDelete({
      email: normalizedEmail,
      purpose: "forgot_password",
      otp: cleanOtp,
      attempts: { $lt: 5 },
      createdAt: { $gte: new Date(Date.now() - 15 * 60 * 1000) }
    });

    if (!otpRecord) {
      await EmailOtp.updateOne(
        {
          email: normalizedEmail,
          purpose: "forgot_password",
          attempts: { $lt: 5 },
          otp: { $ne: cleanOtp },
          createdAt: { $gte: new Date(Date.now() - 15 * 60 * 1000) }
        },
        { $inc: { attempts: 1 } }
      );
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification code. Please request a new one."
      });
    }

    const user = await User.findOne({ email: normalizedEmail }).select("+password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User account not found"
      });
    }

    user.password = newPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Your password has been reset successfully. You can now log in with your new password."
    });
  } catch (error) {
    console.error("Reset Password Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to reset password",
      error: error.message
    });
  }
};

/**
 * @desc    Register a new user (Customer or Business) with Email OTP verification
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      phone,
      otp,
      businessName,
      businessCategory,
      category,
      city,
      address,
      description,
      location
    } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long"
      });
    }

    const normalizedRole = (role || "").toLowerCase();
    if (!["seller", "buyer", "business", "customer"].includes(normalizedRole)) {
      return res.status(400).json({
        success: false,
        message: "Role must be either customer (buyer) or business (seller)"
      });
    }

    const userRole = normalizedRole;
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "An account with this email already exists"
      });
    }

    // Registration requires a successfully verified registration OTP.
    if (!otp) {
      return res.status(400).json({
        success: false,
        message: "A verified email code is required to register"
      });
    }

    const otpRecord = await EmailOtp.findOne({
      email: normalizedEmail,
      purpose: "register",
      createdAt: { $gte: new Date(Date.now() - 15 * 60 * 1000) }
    });
    if (
      !otpRecord ||
      !otpRecord.verified ||
      otpRecord.otp !== String(otp).trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification code. Please request a new code."
      });
    }

    await EmailOtp.deleteOne({ _id: otpRecord._id });

    // Create user
    const user = await User.create({
      name,
      email: normalizedEmail,
      password,
      role: userRole,
      phone: phone || "",
      isEmailVerified: true
    });

    let business = null;
    // If registering as merchant (business / seller), initialize business profile using Business model & businessController
    if (userRole === "business" || userRole === "seller") {
      const bName = (businessName && businessName.trim()) ? businessName.trim() : `${name}'s Store`;
      const bCategory = businessCategory || category || "Retail";
      const bPhone = (phone && phone.trim()) ? phone.trim() : "+94 77 000 0000";
      const bCity = (city && city.trim()) ? city.trim() : (address?.city || "Colombo");

      business = await createBusinessRecord({
        ownerId: user._id,
        name: bName,
        category: bCategory,
        phone: bPhone,
        email: user.email,
        description: description || `Welcome to ${bName}. Discover limited-time flash deals and discounts.`,
        address: typeof address === "object" ? address : { city: bCity, country: "Sri Lanka" },
        location,
        status: "active"
      });

      // Link businessId to User
      user.businessId = business._id;
      await user.save();
    }

    const token = generateToken(user);
    setAuthCookies(res, token);

    return res.status(201).json({
      success: true,
      message: (userRole === "business" || userRole === "seller")
        ? "Merchant account and storefront registered successfully"
        : "User account registered successfully",
      user: user.toSafeObject(),
      business: business || undefined
    });
  } catch (error) {
    console.error("Register Error:", error);

    if (error?.name === "ValidationError") {
      const validationMessage = Object.values(error.errors)
        .map((entry) => entry.message)
        .join(" ");
      return res.status(400).json({
        success: false,
        message: validationMessage || "Please check the registration details."
      });
    }

    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists."
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error during registration",
    });
  }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    // Find user with password included for verification
    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "This account has been deactivated. Please contact support."
      });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    // If business user doesn't have businessId linked yet, check if one exists in Business model
    if ((user.role === "seller" || user.role === "business") && !user.businessId) {
      const business = await Business.findOne({ ownerId: user._id });
      if (business) {
        user.businessId = business._id;
        await user.save();
      }
    }

    const token = generateToken(user);
    setAuthCookies(res, token);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: user.toSafeObject()
    });
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during login",
      error: error.message
    });
  }
};

/**
 * @desc    Get current user profile (with business details if business role)
 * @route   GET /api/auth/me
 * @access  Private (Authenticated users)
 */
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate("businessId")
      .select("-password");

    return res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error("GetMe Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve user profile",
      error: error.message
    });
  }
};

/**
 * @desc    Update current user profile (name, phone, avatar)
 * @route   PUT /api/auth/profile
 * @access  Private (Authenticated users)
 */
const updateProfile = async (req, res) => {
  try {
    const { name, phone, avatar, coverImage } = req.body;

    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (avatar !== undefined) user.avatar = avatar;
    if (coverImage !== undefined) user.coverImage = coverImage;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: user.toSafeObject()
    });
  } catch (error) {
    console.error("Update Profile Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error: error.message
    });
  }
};

/**
 * @desc    Change password (authenticated)
 * @route   PUT /api/auth/change-password
 * @access  Private (Authenticated users)
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required"
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long"
      });
    }

    const user = await User.findById(req.user._id).select("+password");

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect"
      });
    }

    user.password = newPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully"
    });
  } catch (error) {
    console.error("Change Password Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to change password",
      error: error.message
    });
  }
};

const logout = (req, res) => {
  clearAuthCookies(res);
  return res.status(204).send();
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  sendOtp,
  verifyOtp,
  resetPassword,
  logout,
  setAuthCookies,
  generateToken
};
