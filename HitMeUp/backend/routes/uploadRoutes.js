const express = require("express");
const multer = require("multer");
const cloudinary = require("../config/cloudinary");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Configure Multer for memory storage (file buffer in memory)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB max
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  }
});

/**
 * @desc    Upload an image to Cloudinary (converts / saves as WebP format)
 * @route   POST /api/upload
 * @access  Private (Authenticated users: sellers, customers, admin)
 */
router.post("/", protect, (req, res, next) => {
  upload.single("image")(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || "Failed to process uploaded file"
      });
    }

    try {
      const folder = (req.body.folder || "general").trim();
      const targetFolder = `hitmeup/${folder}`;

      // Option 1: File provided via multipart/form-data
      if (req.file) {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: targetFolder,
            format: "webp", // Enforce WebP format
            resource_type: "image"
          },
          (error, result) => {
            if (error) {
              console.error("Cloudinary stream upload error:", error);
              return res.status(500).json({
                success: false,
                message: "Cloudinary upload failed",
                error: error.message
              });
            }

            return res.status(200).json({
              success: true,
              message: "Image uploaded and converted to WebP successfully",
              url: result.secure_url,
              public_id: result.public_id,
              format: result.format
            });
          }
        );

        uploadStream.end(req.file.buffer);
        return;
      }

      // Option 2: Image provided as Base64 Data URL in JSON body
      const base64Data = req.body.image;
      if (base64Data && typeof base64Data === "string" && base64Data.startsWith("data:image/")) {
        const result = await cloudinary.uploader.upload(base64Data, {
          folder: targetFolder,
          format: "webp", // Enforce WebP format
          resource_type: "image"
        });

        return res.status(200).json({
          success: true,
          message: "Image uploaded and converted to WebP successfully",
          url: result.secure_url,
          public_id: result.public_id,
          format: result.format
        });
      }

      return res.status(400).json({
        success: false,
        message: "No image file or valid image data URL provided"
      });
    } catch (uploadError) {
      console.error("Cloudinary upload controller error:", uploadError);
      return res.status(500).json({
        success: false,
        message: "Failed to upload image to Cloudinary",
        error: uploadError.message
      });
    }
  });
});

module.exports = router;

