/**
 * Converts any image File/Blob to a WebP format file using HTML5 Canvas before uploading
 * @param {File} file - Original input image file (JPEG, PNG, etc.)
 * @param {Object} options - { maxWidth, maxHeight, quality }
 * @returns {Promise<File>} Converted .webp File
 */
export async function convertToWebP(
  file,
  { maxWidth = 1600, maxHeight = 1600, quality = 0.85 } = {}
) {
  if (!file) throw new Error("No image file provided for conversion");

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error("Failed to read image file"));
    };

    reader.onload = (event) => {
      const img = new Image();

      img.onerror = () => {
        reject(new Error("Failed to decode image"));
      };

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Downscale proportionally if larger than maximum dimension
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        // Clear and draw image
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Convert canvas drawing directly into an image/webp Blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("WebP conversion failed on canvas"));
              return;
            }

            const cleanBaseName = (file.name || "image").replace(/\.[^/.]+$/, "");
            const webpFile = new File([blob], `${cleanBaseName}.webp`, {
              type: "image/webp",
              lastModified: Date.now(),
            });

            resolve(webpFile);
          },
          "image/webp",
          quality
        );
      };

      img.src = event.target.result;
    };

    reader.readAsDataURL(file);
  });
}

