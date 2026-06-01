import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { socketAuthMiddleware } from '../socket/socket.auth';
import { env } from './envConfig';


let io: Server | null = null;

export const initSocketServer = (HttpServer: HttpServer) => {
  io = new Server(HttpServer, {
    cors: {
      origin: [
        env.CLIENT_URL1,
        env.CLIENT_URL2,
        env.CLIENT_URL3,
        env.CLIENT_URL4,
      ].filter(Boolean),
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 20_000,
    pingInterval: 25_000,
    maxHttpBufferSize: 1e6,
    transports: ['websocket', 'polling'],
  })

  io.use(socketAuthMiddleware)

  io.on('connection', (socket) => {
    console.log(`New socket connected: ${socket.id} (User ID: ${socket.data.userId})`)

    socket.on('disconnect', (reason) => {
      console.log(`Socket disconnected: ${socket.id} (User ID: ${socket.data.userId}) Reason: ${reason})`)
    })
  })
  console.log('Socket.IO server initialized');
  return io;
}

export const getIo = (): Server => {
  if (!io) {
    throw new Error('Socket.IO server not initialized');
  }
  return io;
}

export const closeSocketServer = async (): Promise<void> => {
  if (!io) return;

  await new Promise<void>((resolve, reject) => {
    io!.close((err) => (err ? reject(err) : resolve()))
  });
  io = null;
  console.log('Socket.IO server closed');
}
