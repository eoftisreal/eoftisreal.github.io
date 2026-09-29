jest.mock('../src/config/db', () => jest.fn());
jest.mock('../src/app', () => {
  const app = require('express')();
  app.use(require('express').json());
  app.get('/', (_req, res) => res.type('html').send('<html>shop</html>'));
  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
  app.post('/api/echo', (req, res) => res.status(201).json({ body: req.body, query: req.query }));
  app.get('/api/hang', () => {});
  return app;
});

const http = require('http');
const originalCreateServer = http.createServer;
let server;
jest.spyOn(http, 'createServer').mockImplementation((...args) => {
  server = originalCreateServer(...args);
  return server;
});
const handler = require('../src/appwrite-entry');
const connectDb = require('../src/config/db');
function invoke(path, options = {}) {
  const res = {
    binary: (body, status, headers) => ({ body, status, headers }),
    json: (body, status, headers) => ({ body, status, headers }),
    text: (body, status, headers) => ({ body, status, headers }),
  };
  return handler({ req: { path, method: 'GET', headers: {}, ...options }, res, log: jest.fn(), error: jest.fn() });
}
afterAll(async () => {
  if (server) {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
  jest.restoreAllMocks();
});

test('HTML and liveness do not initialize MongoDB', async () => {
  expect((await invoke('/')).status).toBe(200);
  expect((await invoke('/api/health')).status).toBe(200);
  expect(connectDb).not.toHaveBeenCalled();
});
test('DB failure returns no-store 503 and next invocation can reconnect', async () => {
  connectDb.mockRejectedValueOnce(new Error('database unavailable'));
  const failed = await invoke('/api/echo', { method: 'POST' });
  expect(failed.status).toBe(503);
  expect(failed.headers['cache-control']).toBe('no-store');
  connectDb.mockResolvedValueOnce(undefined);
  const result = await invoke('/api/echo', {
    method: 'POST', queryString: 'name=hello%20world',
    headers: { 'content-type': 'application/json' },
    bodyBinary: Buffer.from('{"order":"retained"}'),
  });
  expect(result.status).toBe(201);
  expect(JSON.parse(result.body)).toEqual({ body: { order: 'retained' }, query: { name: 'hello world' } });
  expect(connectDb).toHaveBeenCalledTimes(2);
});
test('hanging upstream requests fail within the configured deadline', async () => {
  process.env.PROXY_TIMEOUT_MS = '1000';
  const result = await invoke('/api/hang');
  delete process.env.PROXY_TIMEOUT_MS;
  expect(result.status).toBe(504);
  expect(result.body).toBe('Gateway Timeout');
});
