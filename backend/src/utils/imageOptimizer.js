const sharp = require('sharp');

/**
 * Optimizes an image buffer using sharp.
 * Resizes to a maximum width/height of 1920px (maintaining aspect ratio)
 * and converts to WebP format.
 *
 * @param {Buffer} fileBuffer - The original image buffer.
 * @returns {Promise<{ buffer: Buffer, mimeType: string, extension: string }>}
 */
async function optimizeImage(fileBuffer) {
  try {
    const input = sharp(fileBuffer, { limitInputPixels: 40 * 1000 * 1000, failOn: 'error' });
    const metadata = await input.metadata();
    if (!['jpeg', 'png', 'webp', 'avif', 'heif'].includes(metadata.format)) {
      throw new Error('Unsupported image format');
    }
    const optimizedBuffer = await input.rotate()
      .resize({
        width: 1920,
        height: 1920,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 80 })
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

module.exports = {
  optimizeImage,
};
