const mongoose = require('mongoose');
const env = require('./env');

let listenersAttached = false;

function maskMongoUri(uri) {
  return uri.replace(/\/\/([^/@]+)@/, '//***:***@');
}

function attachConnectionListeners() {
  if (listenersAttached) {
    return;
  }

  listenersAttached = true;

  mongoose.connection.on('error', (error) => {
    // eslint-disable-next-line no-console
    console.error('MongoDB connection error', error.message);
  });

  mongoose.connection.on('disconnected', () => {
    // eslint-disable-next-line no-console
    console.warn('MongoDB disconnected');
  });
}

async function connectDb() {
  mongoose.set('strictQuery', true);
  attachConnectionListeners();

  try {
    await mongoose.connect(env.mongoUri, {
      serverSelectionTimeoutMS: 10000,
    });
  } catch (error) {
    const wrappedError = new Error(`Failed to connect to MongoDB at ${maskMongoUri(env.mongoUri)}: ${error.message}`);
    wrappedError.statusCode = 500;
    wrappedError.cause = error;
    throw wrappedError;
  }
}

module.exports = connectDb;
