jest.mock('../src/utils/r2', () => ({
  isR2Configured: () => true,
  uploadToR2: jest.fn(async () => 'customers/product-images/image.webp'),
  getObjectUrl: key => `https://images.example/${key}`,
}));
const express = require('express');
const request = require('supertest');
const sharp = require('sharp');
const { uploadToR2 } = require('../src/utils/r2');
const app = express();
app.use('/products', require('../src/routes/products'));
app.use(require('../src/middleware/errorHandler').errorHandler);
afterEach(() => jest.clearAllMocks());

test('valid customer image uploads remain available and are decoded to WebP', async () => {
  const png = await sharp({ create: { width: 2, height: 2, channels: 3, background: 'red' } }).png().toBuffer();
  const result = await request(app).post('/products/upload-custom')
    .field('folder', 'customers/product-images').attach('file', png, 'sample.png');
  expect(result.status).toBe(200);
  expect(uploadToR2).toHaveBeenCalledWith(expect.any(Buffer), 'image/webp', 'image.webp', 'customers/product-images', '');
});
test('a forged image MIME type cannot upload arbitrary content', async () => {
  const log = jest.spyOn(console, 'error').mockImplementation(() => {});
  const result = await request(app).post('/products/upload-custom')
    .attach('file', Buffer.from('<script>alert(1)</script>'), { filename: 'fake.png', contentType: 'image/png' });
  expect(result.status).toBe(400);
  expect(uploadToR2).not.toHaveBeenCalled();
  log.mockRestore();
});
test('upload paths outside customer folders are rejected', async () => {
  const result = await request(app).post('/products/upload-custom')
    .field('folder', '../admin').attach('file', Buffer.from('content'), 'image.png');
  expect(result.status).toBe(400);
  expect(uploadToR2).not.toHaveBeenCalled();
});
