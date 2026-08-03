// app.ts
import express from 'express';
import mongoose from 'mongoose';
import morgan from 'morgan';
import { Server, Socket } from 'socket.io';
import { createServer, Server as HttpServer } from 'http';
import authRoutes from './interfaces/Routers/admin/admin-auth-router';
import ClientRouter from './interfaces/Routers/admin/client-router';
import AdminRouter from './interfaces/Routers/admin/admin-router';
import EmployeeRouter from './interfaces/Routers/admin/employee-router';
import cors from 'cors';
import { createClient } from 'redis';
import employee from './interfaces/Routers/emplopyee/employee-auth-router';
import ComplaintRouter from './interfaces/Routers/common/complaint-router';
import NotificationRouter from './interfaces/Routers/common/notification-router';
import { errorHandler } from './middleware/error-handle';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import ChatRouter from './interfaces/Routers/common/chat-router';
import VideoCallRouter from './interfaces/Routers/common/video-call-router';
import VideoCallHistoryController from './interfaces/Routers/common/videocall-history-router';
import LocationRouter from './interfaces/Routers/common/location-router';
import ChatMessage from './infrastructure/db/models/chat.model';
import jwt from 'jsonwebtoken';
import path from 'path';
import { NotificationRepository } from './infrastructure/Services/notification-service';
import EmployeeModel from './infrastructure/db/models/employee.model';
import { AdminModel } from './infrastructure/db/models/Admin/admin.model';
import { config } from './config';

const app = express();
export let ioInstance: Server | undefined;

// Middleware
app.use(express.json());
app.use(morgan('dev'));

// Configure CORS to handle multiple origins
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = config.clientUrl.split(',').map(url => url.trim());
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

app.use(cors(corsOptions));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: true,
}));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads', express.static(path.join(__dirname, 'Uploads')));


// Socket.IO setup
export const setSocketInstance = (io: Server) => {
  ioInstance = io;
};

export const getSocketInstance = (): Server => {
  if (!ioInstance) {
    throw new Error('Socket.IO instance not initialized');
  }
  return ioInstance;
};

export const setupSocket = (httpServer: HttpServer) => {

  const allowedOrigins = config.clientUrl
    .split(',')
    .map(url => url.trim())
    .concat([`http://localhost:${config.port}`])
    .filter(Boolean);

  const io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  setSocketInstance(io);
  console.log('[app.ts] Socket.IO setup complete');

  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error: token required'));
    }
    try {
      const decoded = jwt.verify(token, config.jwtSecret, { ignoreExpiration: true }) as { userId?: string; id?: string; email?: string; role?: string };
      const userId = decoded.userId || decoded.id;
      if (!userId) {
        return next(new Error('Authentication error: invalid token payload'));
      }
      socket.data.userId = userId;
      socket.data.role = decoded.role || 'employee';
      next();
    } catch (err: unknown) {
      if (err instanceof Error) {
        next(new Error('Invalid token: ' + err.message));
      } else {
        next(new Error('Invalid token'));
      }
    }
  });

  io.on('connection', (socket: Socket) => {
    socket.on('join_user_room', (userId: string, callback?: (response: { success: boolean; room?: string; error?: string }) => void) => {
      try {
        if (userId !== socket.data.userId) {
          callback?.({ success: false, error: 'Unauthorized' });
          return;
        }
        socket.join(`user_${userId}`);
        callback?.({ success: true, room: `user_${userId}` });
      } catch (err) {
        console.error('[app.ts] Error joining user room:', err);
        callback?.({ success: false, error: 'Failed to join room' });
      }
    });

    socket.on('send_message', async (message, callback) => {
      try {
        const messagePayload = message?.data ?? message;
        io.to(`user_${messagePayload.receiverId}`).emit('new_message', messagePayload);
        callback({ success: true, messageId: messagePayload._id });
        socket.emit('message_delivered', { messageId: messagePayload._id });

        const recipientSockets = await io.in(`user_${messagePayload.receiverId}`).fetchSockets();
        const isRecipientActive = recipientSockets.some(s =>
          s.data.currentConversationId === messagePayload.conversationId
        );

        if (isRecipientActive) {
          await ChatMessage.updateOne(
            { _id: messagePayload._id },
            { $set: { isRead: true } }
          );
          io.to(messagePayload.conversationId).emit('message_read', {
            messageId: messagePayload._id
          });
        }
        // Notification is created on the HTTP save path in chat-controller.saveMessage,
        // so we skip creating it here to avoid duplicate notifications.
      } catch (err: unknown) {
        let message = 'Unknown error';
        if (err instanceof Error) {
          message = err.message;
        } else if (typeof err === 'string') {
          message = err;
        } else {
          message = JSON.stringify(err);
        }
        callback?.({
          success: false,
          error: 'Failed to process message',
          details: message
        });
      }

    });

    socket.on('mark_messages_read', async (
      data: { conversationId: string; userId: string },
      callback?: (response: { success: boolean; error?: string }) => void
    ) => {
      try {
        const { conversationId, userId } = data;
        if (userId !== socket.data.userId) {
          callback?.({ success: false, error: 'Unauthorized' });
          return;
        }

        await ChatMessage.updateMany(
          { conversationId, receiverId: userId, isRead: false },
          { isRead: true }
        );
        io.to(conversationId).emit('messages_read', { conversationId });
        callback?.({ success: true });
      } catch (err: unknown) {
        console.error('[app.ts] Error marking messages as read:', err);
        callback?.({
          success: false,
          error: err instanceof Error ? err.message : 'An unknown error occurred'
        });
      }
    });

    socket.on('typing', ({ conversationId, userId }) => {
      if (userId !== socket.data.userId) return;
      const [user1, user2] = conversationId.split('_');
      const receiverId = user1 === userId ? user2 : user1;
      io.to(`user_${receiverId}`).emit('receive_typing', { conversationId, userId });
    });

    socket.on('disconnect', () => {
      console.log('[app.ts] Client disconnected:', socket.id);
    });
  });

  return io;
};

// MongoDB connection
mongoose.connect(config.mongoUri)
  .then(() => console.log('[app.ts] DB connected'))
  .catch(err => console.error('[app.ts] MongoDB connection error:', err));

// Routes
app.use('/api/admin', authRoutes);
app.use('/api/employee', employee);
app.use('/api/admin', ClientRouter);
app.use('/api/admin', AdminRouter);
app.use('/api/admin', EmployeeRouter);
app.use('/api/common', ComplaintRouter);
app.use('/api/notification', NotificationRouter);
app.use('/api/chat', ChatRouter);
app.use('/api/video-call', VideoCallRouter);
app.use('/api/video-call-history', VideoCallHistoryController);
app.use('/api/location', LocationRouter);
app.use('/uploads', express.static(path.join(__dirname, '../Uploads')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  errorHandler(err, req, res, next);
});

export default app;
