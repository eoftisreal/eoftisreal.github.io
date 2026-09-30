require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('../src/models/Order');

async function migrate() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  try {
    console.log('Auditing existing active orders for missing/invalid amounts...');
    const invalidOrders = await Order.find({
      'payment.status': { $in: ['pending', 'awaiting_verification'] },
      $or: [
        { uniquePaymentAmount: { $exists: false } },
        { uniquePaymentAmount: null },
        { uniquePaymentAmount: { $lte: 0 } },
      ]
    });

    if (invalidOrders.length > 0) {
      console.error(`Found ${invalidOrders.length} active orders with missing or invalid amounts:`);
      invalidOrders.forEach(o => console.error(`  - Order ID: ${o._id}, Amount: ${o.uniquePaymentAmount}`));
      process.exitCode = 1;
    }

    console.log('Auditing existing duplicate uniquePaymentAmount across active payment statuses...');
    const duplicates = await Order.aggregate([
      { $match: { 'payment.status': { $in: ['pending', 'awaiting_verification'] } } },
      { $group: { _id: '$uniquePaymentAmount', count: { $sum: 1 }, docs: { $push: '$_id' } } },
      { $match: { count: { $gt: 1 } } }
    ]);

    if (duplicates.length > 0) {
      console.error(`Found ${duplicates.length} unique payment amounts with duplicates. Manual reconciliation required.`);
      for (const dup of duplicates) {
         console.error(`  - Amount ${dup._id} is duplicated in Order IDs: ${dup.docs.join(', ')}`);
      }
      process.exitCode = 1;
    } else {
      console.log('No duplicates found.');
    }

    if (process.exitCode === 1) {
      console.log('Migration halted due to conflicts. Please resolve the above issues first.');
      return;
    }

    console.log('Creating new strict unique index...');
    // Create new index
    await Order.collection.createIndex(
      { uniquePaymentAmount: 1 },
      {
        unique: true,
        partialFilterExpression: { 'payment.status': { $in: ['pending', 'awaiting_verification'] } },
        name: 'uniquePaymentAmount_1'
      }
    );
    console.log('New index created successfully');

    // Drop old index if it exists
    await Order.collection.dropIndex('uniquePaymentAmount_1_payment.status_1').catch(() => console.log('Old index not found (already dropped or named differently)'));
    console.log('Old index handled');

  } catch (error) {
    console.error('Error during migration:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

migrate();
