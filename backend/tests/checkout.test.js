jest.mock('../src/middleware/auth', () => (req, _res, next) => { req.user = { id: 'user-id' }; next(); });
jest.mock('../src/models/Cart', () => ({ findOne: jest.fn(), findOneAndUpdate: jest.fn() }));
jest.mock('../src/models/Order', () => ({ find: jest.fn(), create: jest.fn() }));
jest.mock('../src/models/Setting', () => ({ find: jest.fn() }));
jest.mock('../src/models/OrderStatusHistory', () => ({ create: jest.fn() }));
const express = require('express');
const request = require('supertest');
const Cart = require('../src/models/Cart');
const Order = require('../src/models/Order');
const Setting = require('../src/models/Setting');
const app = express();
app.use(express.json());
app.use('/checkout', require('../src/routes/checkout'));
app.use(require('../src/middleware/errorHandler').errorHandler);
const payload = { shippingAddress: { line1: 'Test Road', city: 'Patna', state: 'Bihar', postalCode: '800001', country: 'India' } };
beforeEach(() => {
  jest.clearAllMocks();
  Cart.findOne.mockReturnValue({ populate: async () => ({ items: [{ productId: { id: 'product-id', title: 'Shirt', price: 100, isActive: true }, quantity: 1 }] }) });
  Setting.find.mockResolvedValue([{ key: 'enableTax', value: false }, { key: 'enableDeliveryCharge', value: false }]);
  Order.create.mockImplementation(async data => ({ ...data, _id: 'order-id' }));
});
test('creates the same manual-UPI order response expected by the new payment tab', async () => {
  Order.find.mockReturnValue({ select: () => ({ lean: async () => [] }) });
  const response = await request(app).post('/checkout/create').send(payload);
  expect(response.status).toBe(201);
  expect(response.body.order).toMatchObject({ _id: 'order-id', status: 'pending_payment', payment: { provider: 'manual_upi', status: 'pending' } });
  expect(response.body.order.uniquePaymentAmount).toBeGreaterThan(100);
  expect(response.body.order.uniquePaymentAmount).toBeLessThan(101);
});
test('exhausted fractional payment slots return 503 instead of looping forever', async () => {
  Order.find.mockReturnValue({ select: () => ({ lean: async () => Array.from({ length: 99 }, (_, i) => ({ uniquePaymentAmount: (10001 + i) / 100 })) }) });
  const response = await request(app).post('/checkout/create').send(payload);
  expect(response.status).toBe(503);
  expect(Order.find).toHaveBeenCalledTimes(1);
  expect(Order.create).not.toHaveBeenCalled();
  expect(Cart.findOneAndUpdate).not.toHaveBeenCalled();
});
test('deleted products return a useful conflict without creating an order', async () => {
  Cart.findOne.mockReturnValue({ populate: async () => ({ items: [{ productId: null, quantity: 1 }] }) });
  expect((await request(app).post('/checkout/create').send(payload)).status).toBe(409);
  expect(Order.create).not.toHaveBeenCalled();
});
