require('dotenv').config();

const http = require('http');
const app = require('./src/app');
const { testConnection } = require('./src/config/db');
const { initSocket } = require('./src/sockets/socketServer');

const PORT = Number(process.env.PORT) || 8000;

async function startServer() {
  try {
    await testConnection();
    console.log('✅ MySQL connected successfully');

    // Socket.io cần gắn vào http.Server, không gắn thẳng vào Express app được
    const server = http.createServer(app);
    initSocket(server);

    server.listen(PORT, () => {
      console.log(`✅ Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server');
    console.error(error.message);
    process.exit(1);
  }
}

startServer();