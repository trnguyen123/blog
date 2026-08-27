const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io = null;

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || '*',
      credentials: true
    }
  });

  // Middleware xác thực: mỗi client connect phải gửi kèm JWT token,
  // dùng chung logic decode với verifyToken (auth.middleware.js)
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;

      if (!token) {
        return next(new Error('Unauthorized'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      socket.user = {
        id: decoded.id,
        email: decoded.email,
        roles: decoded.roles || []
      };

      next();
    } catch (error) {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const { id, roles } = socket.user;

    // Room riêng cho từng user -> emit thông báo đích danh
    socket.join(`user:${id}`);

    // Room theo role -> broadcast cho tất cả admin / author đang online
    if (roles.includes('admin') || roles.includes('super_admin')) {
      socket.join('role:admin');
    }

    if (roles.includes('author')) {
      socket.join('role:author');
    }
  });

  return io;
}

function getIO() {
  if (!io) {
    throw new Error('Socket.io chưa được khởi tạo. Gọi initSocket(server) trước khi dùng.');
  }
  return io;
}

function emitToUser(userId, event, payload) {
  try {
    getIO().to(`user:${userId}`).emit(event, payload);
  } catch (err) {
    console.error('[socket] emitToUser lỗi:', err.message);
  }
}

function emitToRole(role, event, payload) {
  try {
    getIO().to(`role:${role}`).emit(event, payload);
  } catch (err) {
    console.error('[socket] emitToRole lỗi:', err.message);
  }
}

module.exports = {
  initSocket,
  getIO,
  emitToUser,
  emitToRole
};