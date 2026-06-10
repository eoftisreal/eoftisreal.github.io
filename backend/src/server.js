const app = require('./app');
const env = require('./config/env');
const connectDb = require('./config/db');

async function start() {
  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`Backend listening on :${env.port}`);
  });

  try {
    await connectDb();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to connect to database on startup. Server is still running.', error.message);
  }
}

start().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start backend', error);
  process.exit(1);
});
