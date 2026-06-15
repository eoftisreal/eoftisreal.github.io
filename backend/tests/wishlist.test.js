const request = require('supertest');
const app = require('../src/app');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../src/models/User');
const Product = require('../src/models/Product');
const Wishlist = require('../src/models/Wishlist');
const jwt = require('../src/utils/jwt');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
  await Product.deleteMany({});
  await Wishlist.deleteMany({});
});

describe('Wishlist API', () => {
  let user, token, product1, product2;

  beforeEach(async () => {
    user = await User.create({ email: 'test@test.com', password: 'password', role: 'user' });
    token = jwt.signAccessToken({ sub: user._id, role: user.role });

    product1 = await Product.create({ title: 'P1', handle: 'p1', price: 10, category: 'Cat1', artistName: 'Artist 1', description: 'Desc 1' });
    product2 = await Product.create({ title: 'P2', handle: 'p2', price: 20, category: 'Cat1', artistName: 'Artist 2', description: 'Desc 2' });
  });

  it('should return empty wishlist for new user', async () => {
    const res = await request(app)
      .get('/api/wishlist')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('should add to wishlist', async () => {
    const res = await request(app)
      .post('/api/wishlist/add')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product1._id.toString() });

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0]._id.toString()).toBe(product1._id.toString());
  });

  it('should remove from wishlist', async () => {
    await request(app)
      .post('/api/wishlist/add')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product1._id.toString() });

    const res = await request(app)
      .post('/api/wishlist/remove')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product1._id.toString() });

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(0);
  });

  it('should sync wishlist', async () => {
    const res = await request(app)
      .post('/api/wishlist/sync')
      .set('Authorization', `Bearer ${token}`)
      .send({ productIds: [product1._id.toString(), product2._id.toString()] });

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
  });
});
