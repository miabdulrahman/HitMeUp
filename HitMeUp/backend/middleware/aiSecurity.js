const windows = new Map();

const MAX_WINDOW_ENTRIES = 10000;
const WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS = 20;

const cleanup = (now) => {
    if (windows.size < MAX_WINDOW_ENTRIES) return;
    for (const [key, window] of windows) {
        if (window.resetAt <= now) windows.delete(key);
    }
};

const aiRateLimit = (req, res, next) => {
    const identity = req.user?._id
        ? `user:${req.user._id}`
        : `ip:${req.ip || req.socket.remoteAddress || "unknown"}`;
    const key = `${identity}:${req.path}`;
    const now = Date.now();
    cleanup(now);
    const current = windows.get(key);

    if (!current || current.resetAt <= now) {
        windows.set(key, { count: 1, resetAt: now + WINDOW_MS });
        return next();
    }

    if (current.count >= MAX_REQUESTS) {
        res.set("Retry-After", String(Math.ceil((current.resetAt - now) / 1000)));
        return res.status(429).json({
            success: false,
            message: "Too many AI requests. Please try again later."
        });
    }

    current.count += 1;
    return next();
};

const isNonEmptyString = (value, maxLength) =>
    typeof value === "string" && value.trim().length > 0 && value.length <= maxLength;

const validateAIRequest = (feature) => (req, res, next) => {
    const body = req.body || {};
    let valid = true;

    switch (feature) {
        case "generate-deal":
            valid = ["businessName", "businessType", "productOrService", "targetCustomers"]
                .every((field) => isNonEmptyString(body[field], 500)) &&
                Number.isFinite(Number(body.originalPrice)) && Number(body.originalPrice) > 0;
            break;
        case "recommend-deals":
            valid = isNonEmptyString(body.userPreferences, 2000) &&
                (!body.availableDeals || (Array.isArray(body.availableDeals) && body.availableDeals.length <= 50));
            break;
        case "detect-fraud":
            valid = isNonEmptyString(body.activityType, 100) &&
                body.activityData !== null && body.activityData !== undefined &&
                JSON.stringify(body.activityData).length <= 10000;
            break;
        case "food-safety":
            valid = isNonEmptyString(body.productName, 300) &&
                (!body.productDescription || isNonEmptyString(body.productDescription, 3000));
            break;
        case "targeting":
            valid = isNonEmptyString(body.dealTitle, 300) &&
                (!body.dealDescription || isNonEmptyString(body.dealDescription, 3000)) &&
                (!body.category || isNonEmptyString(body.category, 100)) &&
                (!body.price || Number.isFinite(Number(body.price))) &&
                (!body.discount || Number.isFinite(Number(body.discount)));
            break;
        case "insights":
            valid = Object.keys(body).length === 0;
            break;
        default:
            valid = false;
    }

    if (!valid) {
        return res.status(400).json({
            success: false,
            message: "Invalid AI request payload"
        });
    }

    return next();
};

module.exports = { aiRateLimit, validateAIRequest };