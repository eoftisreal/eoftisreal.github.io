const mongoose = require('mongoose');
const User = require('../src/models/User');
const env = require('../src/config/env');

async function makeAdmin() {
  const email = process.argv[2];
  const roleArg = process.argv[3];

  const role = (roleArg === 'master_admin') ? 'master_admin' : 'admin';

  if (!email) {
    console.error('Error: Please provide an email address.');
    console.error('Usage: npm run make-admin <email> [admin|master_admin]');
    process.exit(1);
  }

  try {
    await mongoose.connect(env.mongoUri);
    console.log('Connected to MongoDB.');

    // Upsert the user to ensure they exist, then set isAdmin to true and update role
    const user = await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      { $set: { isAdmin: true, role }, $setOnInsert: { email: email.toLowerCase() } },
      { new: true, upsert: true }
    );

    console.log(`Success! User ${user.email} is now a ${role}.`);
    process.exit(0);
  } catch (error) {
    console.error('An error occurred:', error);
    process.exit(1);
  }
}

makeAdmin();
