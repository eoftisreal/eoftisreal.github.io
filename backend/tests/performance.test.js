const express = require('express');
const request = require('supertest');
const fs = require('fs');
const os = require('os');
const path = require('path');
const zlib = require('zlib');
const staticFiles = require('../src/middleware/staticFiles');

describe('static asset delivery', () => {
  let root, app;
  const source = 'console.log("payment tab still works");';
  beforeAll(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'appwrite-static-'));
    fs.writeFileSync(path.join(root, 'app-12345678.js'), source);
    fs.writeFileSync(path.join(root, 'app-12345678.js.br'), zlib.brotliCompressSync(source));
    fs.writeFileSync(path.join(root, 'app-12345678.js.gz'), zlib.gzipSync(source));
    fs.writeFileSync(path.join(root, 'sw.js'), source);
    fs.writeFileSync(path.join(root, 'index.html'), '<html>Shop</html>');
    app = express();
    app.use(staticFiles(root));
  });
  afterAll(() => fs.rmSync(root, { recursive: true, force: true }));
  it('negotiates gzip, keeps JS MIME type and immutable hashed-asset caching', async () => {
    const res = await request(app).get('/app-12345678.js').set('Accept-Encoding', 'gzip');
    expect(res.status).toBe(200);
    expect(res.headers['content-encoding']).toBe('gzip');
    expect(res.headers['content-type']).toMatch(/javascript/);
    expect(res.headers.vary).toContain('Accept-Encoding');
    expect(res.headers['cache-control']).toContain('immutable');
    expect(res.text).toBe(source);
  });
  it('respects encoding quality and identity requests', async () => {
    const res = await request(app).get('/app-12345678.js').set('Accept-Encoding', 'br;q=0,gzip;q=0,identity;q=1');
    expect(res.status).toBe(200);
    expect(res.headers['content-encoding']).toBeUndefined();
    expect(res.text).toBe(source);
  });
  it('supports Brotli HEAD and conditional requests', async () => {
    const res = await request(app).head('/app-12345678.js').set('Accept-Encoding', 'br');
    expect(res.status).toBe(200);
    expect(res.headers['content-encoding']).toBe('br');
    expect(res.text).toBeUndefined();
    const cached = await request(app).get('/app-12345678.js').set('Accept-Encoding', 'br').set('If-None-Match', res.headers.etag);
    expect(cached.status).toBe(304);
  });
  it('revalidates HTML and service worker instead of making them immutable', async () => {
    for (const url of ['/', '/sw.js']) {
      const res = await request(app).get(url);
      expect(res.headers['cache-control']).toBe('public, max-age=0, must-revalidate');
    }
  });
  it('returns 404 for missing assets', async () => {
    expect((await request(app).get('/missing.js')).status).toBe(404);
  });
});

describe('public response cache', () => {
  let app, reads;
  beforeEach(() => {
    jest.resetModules();
    reads = 0;
    app = express();
    app.use(require('../src/middleware/cache'));
    app.use('/api', require('../src/middleware/responseCache'));
    app.get('/api/products', (_req, res) => {
      reads++;
      res.set('Cache-Control', 'public, max-age=120');
      res.json({ reads });
    });
    app.get('/api/wishlist', (_req, res) => res.json({ reads: ++reads }));
    app.post('/api/products', (_req, res) => res.sendStatus(201));
    app.post('/api/products/fail', (_req, res) => res.sendStatus(400));
  });
  it('preserves public headers on hits and invalidates only successful catalogue writes', async () => {
    const first = await request(app).get('/api/products');
    await request(app).post('/api/products/fail');
    const hit = await request(app).get('/api/products');
    expect(hit.body).toEqual(first.body);
    expect(hit.headers['x-cache']).toBe('HIT');
    expect(hit.headers['cache-control']).toBe(first.headers['cache-control']);
    await request(app).post('/api/products');
    expect((await request(app).get('/api/products')).body.reads).toBe(2);
  });
  it('never caches wishlist or authenticated catalogue requests', async () => {
    for (const url of ['/api/wishlist', '/api/products']) {
      const a = await request(app).get(url).set('Authorization', 'Bearer token');
      const b = await request(app).get(url).set('Authorization', 'Bearer token');
      expect(a.body.reads).not.toBe(b.body.reads);
      expect(b.headers['x-cache']).toBeUndefined();
    }
    expect((await request(app).get('/api/wishlist')).headers['cache-control']).toBe('no-store');
  });
  it('evicts least recently used entries when the entry limit is exceeded', async () => {
    await request(app).get('/api/products?page=1');
    for (let i = 2; i <= 201; i++) await request(app).get(`/api/products?page=${i}`);
    expect((await request(app).get('/api/products?page=1')).headers['x-cache']).toBe('MISS');
  });
});
