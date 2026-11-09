const express = require("express");
const multer = require("multer");
const { fromBuffer } = require("file-type");
const cloudinary = require("../config/cloudinary");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_UPLOADS_PER_HOUR = 20;
const MAX_UPLOAD_BYTES_PER_HOUR = 50 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif"
]);
const ALLOWED_FOLDERS = new Set([
  "deals",
  "stores/logos",
  "stores/covers"
]);
const userUploadWindows = new Map();

// Base64 image uploads need a larger JSON parser than normal API requests.
router.use(express.json({ limit: "15mb" }));

// Configure Multer for memory storage (file buffer in memory)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE
  },
  // Validate the actual bytes after Multer has buffered the file. The client
  // supplied MIME type is not trusted.
  fileFilter: (req, file, cb) => cb(null, true)
});

const removeExpiredQuotaWindows = (now) => {
  if (userUploadWindows.size < 1000) return;
  for (const [userId, window] of userUploadWindows) {
    if (window.resetAt <= now) userUploadWindows.delete(userId);
  }
};

const consumeUploadQuota = (userId, bytes) => {
  const now = Date.now();
  removeExpiredQuotaWindows(now);
  let window = userUploadWindows.get(userId);

  if (!window || window.resetAt <= now) {
    window = { count: 0, bytes: 0, resetAt: now + 60 * 60 * 1000 };
    userUploadWindows.set(userId, window);
  }

  if (
    window.count >= MAX_UPLOADS_PER_HOUR ||
    window.bytes + bytes > MAX_UPLOAD_BYTES_PER_HOUR
  ) {
    return { allowed: false, retryAfter: Math.ceil((window.resetAt - now) / 1000) };
  }

  window.count += 1;
  window.bytes += bytes;
  return { allowed: true };
};

const validateImageBuffer = async (buffer) => {
  if (!buffer || buffer.length === 0 || buffer.length > MAX_FILE_SIZE) {
    const error = new Error("Image must be between 1 byte and 10 MB");
    error.statusCode = 400;
    throw error;
  }

  const detectedType = await fromBuffer(buffer);
  if (!detectedType || !ALLOWED_MIME_TYPES.has(detectedType.mime)) {
    const error = new Error("Only valid JPEG, PNG, WebP, or GIF images are allowed");
    error.statusCode = 400;
    throw error;
  }
};

const decodeBase64Image = (value) => {
  const match = /^data:image\/[a-z0-9.+-]+;base64,([a-z0-9+/=\s]+)$/i.exec(value);
  if (!match) return null;

  const buffer = Buffer.from(match[1].replace(/\s/g, ""), "base64");
  return buffer.length > 0 ? buffer : null;
};

const uploadBuffer = (buffer, folder) => new Promise((resolve, reject) => {
  const uploadStream = cloudinary.uploader.upload_stream(
    {
      folder: `hitmeup/${folder}`,
      format: "webp",
      resource_type: "image"
    },
    (error, result) => (error ? reject(error) : resolve(result))
  );
  uploadStream.end(buffer);
});

/**
 * @desc    Upload an image to Cloudinary (converts / saves as WebP format)
 * @route   POST /api/upload
 * @access  Private (Sellers and admins)
 */
router.post("/", protect, authorizeRoles("seller", "admin"), (req, res, next) => {
  upload.single("image")(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || "Failed to process uploaded file"
      });
    }

    try {
      const folder = typeof req.body.folder === "string" ? req.body.folder.trim() : "";
      if (!ALLOWED_FOLDERS.has(folder)) {
        return res.status(400).json({
          success: false,
          message: "Invalid upload folder"
        });
      }

      let imageBuffer = req.file?.buffer;

      // Option 1: File provided via multipart/form-data
      // Option 2: Image provided as Base64 Data URL in JSON body
      if (!imageBuffer && typeof req.body.image === "string") {
        imageBuffer = decodeBase64Image(req.body.image);
      }

      if (!imageBuffer) {
        return res.status(400).json({
          success: false,
          message: "No image file or valid image data URL provided"
        });
      }

      await validateImageBuffer(imageBuffer);

      const quota = consumeUploadQuota(String(req.user._id), imageBuffer.length);
      if (!quota.allowed) {
        res.set("Retry-After", String(quota.retryAfter));
        return res.status(429).json({
          success: false,
          message: "Upload quota exceeded. Please try again later."
        });
      }

      const result = await uploadBuffer(imageBuffer, folder);
      return res.status(200).json({
        success: true,
        message: "Image uploaded and converted to WebP successfully",
        url: result.secure_url,
        public_id: result.public_id,
        format: result.format
      });
    } catch (uploadError) {
      console.error("Cloudinary upload controller error:", uploadError);
      return res.status(uploadError.statusCode || 500).json({
        success: false,
        message: uploadError.message || "Failed to upload image"
      });
    }
  });
});

module.exports = router;

