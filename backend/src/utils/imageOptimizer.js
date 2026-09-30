const sharp = require('sharp');

/**
 * Validates if the buffer is a valid, recognizable image.
 */
async function validateImage(fileBuffer) {
  try {
    const metadata = await sharp(fileBuffer).metadata();
    const validFormats = ['jpeg', 'jpg', 'png', 'webp', 'heif', 'avif'];
    if (!validFormats.includes(metadata.format)) {
      throw new Error(`Unsupported image format: ${metadata.format}`);
    }

    // Prevent zip bomb or overly large dimension images
    if (metadata.width > 8000 || metadata.height > 8000) {
      throw new Error(`Image dimensions too large: ${metadata.width}x${metadata.height}`);
    }

    return true;
  } catch (error) {
    throw new Error(`Invalid image file: ${error.message}`);
  }
}

async function optimizeImage(fileBuffer) {
  await validateImage(fileBuffer);
  try {
    const optimizedBuffer = await sharp(fileBuffer)
      .rotate() // auto-orient based on EXIF
      .resize({
        width: 1920,
        height: 1920,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 80 }) // strips metadata by default
      .toBuffer();

    return {
      buffer: optimizedBuffer,
      mimeType: 'image/webp',
      extension: 'webp',
    };
  } catch (error) {
    console.error('Error optimizing image:', error);
    throw new Error('Failed to optimize image');
  }
}

async function generateProductVariants(fileBuffer) {
  await validateImage(fileBuffer);
  try {
    const s = sharp(fileBuffer).rotate(); // auto-orient

    const [thumbnailData, cardData, productData] = await Promise.all([
      s.clone().resize({ width: 400, fit: 'inside', withoutEnlargement: true }).webp({ quality: 75 }).toBuffer({ resolveWithObject: true }),
      s.clone().resize({ width: 800, fit: 'inside', withoutEnlargement: true }).webp({ quality: 80 }).toBuffer({ resolveWithObject: true }),
      s.clone().resize({ width: 1600, fit: 'inside', withoutEnlargement: true }).webp({ quality: 82 }).toBuffer({ resolveWithObject: true }),
    ]);

    return {
      thumbnail: { buffer: thumbnailData.data, width: thumbnailData.info.width, mimeType: 'image/webp', extension: 'webp' },
      card: { buffer: cardData.data, width: cardData.info.width, mimeType: 'image/webp', extension: 'webp' },
      product: { buffer: productData.data, width: productData.info.width, mimeType: 'image/webp', extension: 'webp' },
    };
  } catch (error) {
    console.error('Error generating product variants:', error);
    throw new Error('Failed to generate product image variants');
  }
}

module.exports = {
  validateImage,
  optimizeImage,
  generateProductVariants
};
