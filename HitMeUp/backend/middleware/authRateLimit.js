const windows = new Map();

const removeExpiredWindows = (now) => {
    if (windows.size < 1000) return;
    for (const [key, window] of windows) {
        if (window.resetAt <= now) windows.delete(key);
    }
};

const createAuthRateLimit = ({ windowMs, max, message }) => (req, res, next) => {
    const email = typeof req.body?.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";
    const key = `${req.ip || req.socket.remoteAddress || "unknown"}:${email}:${req.path}`;
    const now = Date.now();
    removeExpiredWindows(now);
    const current = windows.get(key);

    if (!current || current.resetAt <= now) {
        windows.set(key, { count: 1, resetAt: now + windowMs });
        return next();
    }

    if (current.count >= max) {
        res.set("Retry-After", String(Math.ceil((current.resetAt - now) / 1000)));
        return res.status(429).json({ success: false, message });
    }

    current.count += 1;
    return next();
};

module.exports = {
    loginRateLimit: createAuthRateLimit({
        windowMs: 15 * 60 * 1000,
        max: 10,
        message: "Too many login attempts. Please try again later."
    }),
    registerRateLimit: createAuthRateLimit({
        windowMs: 15 * 60 * 1000,
        max: 5,
        message: "Too many registration attempts. Please try again later."
    }),
    otpSendRateLimit: createAuthRateLimit({
        windowMs: 15 * 60 * 1000,
        max: 5,
        message: "Too many code requests. Please try again later."
    }),
    otpVerifyRateLimit: createAuthRateLimit({
        windowMs: 15 * 60 * 1000,
        max: 10,
        message: "Too many verification attempts. Please request a new code later."
    }),
    passwordResetRateLimit: createAuthRateLimit({
        windowMs: 15 * 60 * 1000,
        max: 5,
        message: "Too many password reset attempts. Please try again later."
    })
};