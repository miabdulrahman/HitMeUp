const jwt = require("jsonwebtoken");
const User = require("../models/user");

const JWT_SECRET = process.env.JWT_SECRET || "hitmeup_jwt_development_secret_2026";

/**
 * Protect middleware:
 * Requires a valid Bearer token in the Authorization header.
 * Attaches authenticated user object to `req.user`.
 */
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access denied. No authentication token provided."
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User associated with this token no longer exists."
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "User account has been deactivated."
      });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired authentication token.",
      error: error.message
    });
  }
};

/**
 * Role-Based Access Control (RBAC) middleware:
 * Restricts access to users having one of the specified roles.
 * Example usage: authorizeRoles("business", "admin")
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required before role verification."
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized to access this resource.`
      });
    }

    next();
  };
};

/**
 * Optional authentication middleware:
 * If a token is provided and valid, attaches `req.user`.
 * If no token is provided, continues with `req.user = null` instead of failing.
 * Highly useful for public endpoints and Member 5 AI logs (req.user?.id || null).
 */
const optionalAuth = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    req.user = user && user.isActive ? user : null;
  } catch {
    req.user = null;
  }

  next();
};

module.exports = {
  protect,
  authorizeRoles,
  optionalAuth,
  JWT_SECRET
};
