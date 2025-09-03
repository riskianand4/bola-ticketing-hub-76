const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { getDB } = require('../config/database');

class SocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map();
  }

  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:8080",
        methods: ["GET", "POST"],
        credentials: true
      }
    });

    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication error'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const db = getDB();
        const result = await db.query(
          'SELECT id, email, full_name FROM users WHERE id = $1 AND deleted_at IS NULL',
          [decoded.userId]
        );

        if (result.rows.length === 0) {
          return next(new Error('User not found'));
        }

        socket.user = result.rows[0];
        next();
      } catch (error) {
        next(new Error('Authentication error'));
      }
    });

    this.io.on('connection', (socket) => {
      console.log(`User ${socket.user.email} connected`);
      this.connectedUsers.set(socket.user.id, socket.id);

      // Join user to their personal room
      socket.join(`user_${socket.user.id}`);

      // Handle match updates subscription
      socket.on('subscribe_match', (matchId) => {
        socket.join(`match_${matchId}`);
        console.log(`User ${socket.user.email} subscribed to match ${matchId}`);
      });

      // Handle live commentary
      socket.on('live_commentary', async (data) => {
        try {
          const db = getDB();
          await db.query(
            'INSERT INTO live_commentary (match_id, user_id, message, timestamp) VALUES ($1, $2, $3, NOW())',
            [data.match_id, socket.user.id, data.message]
          );

          // Broadcast to all users watching this match
          this.io.to(`match_${data.match_id}`).emit('new_commentary', {
            user: socket.user.full_name || socket.user.email,
            message: data.message,
            timestamp: new Date()
          });
        } catch (error) {
          console.error('Live commentary error:', error);
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`User ${socket.user.email} disconnected`);
        this.connectedUsers.delete(socket.user.id);
      });
    });

    console.log('Socket.IO initialized');
  }

  // Send notification to specific user
  sendToUser(userId, event, data) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
    }
  }

  // Send notification to all users in a room
  sendToRoom(room, event, data) {
    this.io.to(room).emit(event, data);
  }

  // Broadcast match updates
  broadcastMatchUpdate(matchId, update) {
    this.io.to(`match_${matchId}`).emit('match_update', update);
  }

  // Broadcast news updates
  broadcastNews(newsData) {
    this.io.emit('new_news', newsData);
  }

  // Send push notification to user
  async sendNotification(userId, notification) {
    try {
      const db = getDB();
      
      // Save notification to database
      await db.query(
        'INSERT INTO notifications (user_id, title, message, type, created_at) VALUES ($1, $2, $3, $4, NOW())',
        [userId, notification.title, notification.message, notification.type || 'info']
      );

      // Send real-time notification
      this.sendToUser(userId, 'notification', notification);
    } catch (error) {
      console.error('Send notification error:', error);
    }
  }

  // Get connected users count
  getConnectedUsersCount() {
    return this.connectedUsers.size;
  }

  // Get users in specific room
  getUsersInRoom(room) {
    const roomSockets = this.io.sockets.adapter.rooms.get(room);
    return roomSockets ? roomSockets.size : 0;
  }
}

module.exports = new SocketService();