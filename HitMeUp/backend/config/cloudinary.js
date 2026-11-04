const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "pkffijen",
  api_key: process.env.CLOUDINARY_API_KEY || "552223562897121",
  api_secret: process.env.CLOUDINARY_API_SECRET || "536iKLzTTfdiE8FYUxrTrioKf_g",
  secure: true
});

module.exports = cloudinary;

