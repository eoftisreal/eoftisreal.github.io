require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('./src/models/Order');

async function migrate() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  try {
    console.log('Auditing existing duplicate uniquePaymentAmount across active payment statuses...');

    const duplicates = await Order.aggregate([
      { $match: { 'payment.status': { $in: ['pending', 'awaiting_verification'] } } },
      { $group: { _id: '$uniquePaymentAmount', count: { $sum: 1 }, docs: { $push: '$_id' } } },
      { $match: { count: { $gt: 1 } } }
    ]);

    if (duplicates.length > 0) {
      console.log(`Found ${duplicates.length} unique payment amounts with duplicates. Resolving...`);
      for (const dup of duplicates) {
         // Keep the first one, assign new amounts to the rest
         const docsToUpdate = dup.docs.slice(1);
         for (const docId of docsToUpdate) {
             const order = await Order.findById(docId);
             let isUnique = false;
             let newAmount = order.total;
             let attempts = 0;
             while(!isUnique && attempts < 100) {
                 attempts++;
                 const fraction = Math.floor(Math.random() * 99) + 1;
                 newAmount = Number((order.total + fraction / 100).toFixed(2));
                 const exists = await Order.findOne({ uniquePaymentAmount: newAmount, 'payment.status': { $in: ['pending', 'awaiting_verification'] } });
                 if (!exists) {
                     isUnique = true;
                 }
             }
             if (isUnique) {
                 order.uniquePaymentAmount = newAmount;
                 await order.save();
                 console.log(`Updated duplicate order ${docId} with new amount ${newAmount}`);
             } else {
                 console.error(`Failed to generate new amount for order ${docId}`);
             }
         }
      }
    } else {
      console.log('No duplicates found.');
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
  } finally {
    await mongoose.disconnect();
  }
}

migrate();
