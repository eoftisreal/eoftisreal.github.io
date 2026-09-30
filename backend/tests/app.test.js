jest.mock('../src/middleware/auth', () => (req, _res, next) => {
  req.user = { id: 'user-id', isAdmin: true };
  next();
});

jest.mock('../src/models/Product', () => ({
  find: jest.fn(() => ({
    select: () => ({
      skip: () => ({
        limit: () => ({
          sort: () => ({
            lean: async () => [],
          }),
        }),
      }),
    }),
  })),
  countDocuments: jest.fn(async () => 0),
}));

// Mock mongoose connection state so dbCheck doesn't block routes in unit tests
jest.mock('mongoose', () => {
  const original = jest.requireActual('mongoose');
  return {
    ...original,
    connection: {
      ...original.connection,
      readyState: 1
    }
  };
});

const request = require('supertest');
const app = require('../src/app');

describe('app routes', () => {
  it('returns health status', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });

  it('lists products', async () => {
    const response = await request(app).get('/api/products');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ products: [], page: 1, limit: 12, total: 0, totalPages: 0 });
  });
});
