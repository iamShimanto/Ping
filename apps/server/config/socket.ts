import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { socketAuthMiddleware } from "../socket/socket.auth";
import { env } from "@repo/config";
import User from "../models/auth/auth.models";
import ConversationModel from "../models/conversation/conversation.models";

let io: Server | null = null;

// Track online users
const onlineUsers = new Map<string, Set<string>>();

const addOnlineUser = (userId: string, socketId: string) => {
  if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
  onlineUsers.get(userId)!.add(socketId);
};

const removeOnlineUser = (userId: string, socketId: string) => {
  const sockets = onlineUsers.get(userId);
  if (!sockets) return;
  sockets.delete(socketId);
  if (sockets.size === 0) onlineUsers.delete(userId);
};

export const isUserOnline = (userId: string): boolean =>
  onlineUsers.has(userId) && onlineUsers.get(userId)!.size > 0;

export const getOnlineUsers = (): string[] => Array.from(onlineUsers.keys());

const registerSocketHandlers = (socket: Socket) => {
  const userId = socket.data.userId as string;

  // ── Join conversation rooms 
  socket.on("conversation:join", async (conversationId: string) => {
    try {
      const conv = await ConversationModel.findOne({
        _id: conversationId,
        participants: userId,
      });
      if (!conv) return;
      socket.join(conversationId);
    } catch {
      // ignore
    }
  });

  socket.on("conversation:leave", (conversationId: string) => {
    socket.leave(conversationId);
  });

  // ── Typing indicators
  socket.on(
    "typing:start",
    ({ conversationId }: { conversationId: string }) => {
      socket.to(conversationId).emit("typing:start", { userId, conversationId });
    }
  );

  socket.on(
    "typing:stop",
    ({ conversationId }: { conversationId: string }) => {
      socket.to(conversationId).emit("typing:stop", { userId, conversationId });
    }
  );

  // ── Message read receipts
  socket.on(
    "message:read",
    ({
      messageId,
      conversationId,
    }: {
      messageId: string;
      conversationId: string;
    }) => {
      socket.to(conversationId).emit("message:read", { messageId, userId, conversationId });
    }
  );

  // ── Disconnect
  socket.on("disconnect", async (reason) => {
    removeOnlineUser(userId, socket.id);

    // Only broadcast offline if no more sockets for this user
    if (!isUserOnline(userId)) {
      try {
        await User.findByIdAndUpdate(userId, {
          status: "offline",
          lastSeen: new Date(),
        });
      } catch {
        // ignore
      }

      // Notify all rooms this socket was in
      socket.broadcast.emit("user:offline", {
        userId,
        lastSeen: new Date(),
      });
    }

    console.log(
      `Socket disconnected: ${socket.id} (userId: ${userId}) — ${reason}`
    );
  });
};

export const initSocketServer = (httpServer: HttpServer): Server => {
  io = new Server(httpServer, {
    cors: {
      origin: [
        env.CLIENT_URL1,
        env.CLIENT_URL2,
        env.CLIENT_URL3,
        env.CLIENT_URL4,
      ].filter(Boolean),
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: 20_000,
    pingInterval: 25_000,
    maxHttpBufferSize: 1e6,
    transports: ["websocket", "polling"],
  });

  io.use(socketAuthMiddleware);

  io.on("connection", async (socket) => {
    const userId = socket.data.userId as string;

    addOnlineUser(userId, socket.id);

    // Mark user as online in DB
    try {
      await User.findByIdAndUpdate(userId, { status: "online" });
    } catch {
      // ignore
    }

    // Auto-join all conversation rooms for this user
    try {
      const conversations = await ConversationModel.find(
        { participants: userId },
        { _id: 1 }
      );
      const roomIds = conversations.map((c) => String(c._id));
      if (roomIds.length) socket.join(roomIds);
    } catch {
      // ignore
    }

    // Broadcast online status to everyone
    socket.broadcast.emit("user:online", { userId });

    console.log(`Socket connected: ${socket.id} (userId: ${userId})`);

    registerSocketHandlers(socket);
  });

  console.log("Socket.IO server initialized");
  return io;
};

export const getIo = (): Server => {
  if (!io) throw new Error("Socket.IO server not initialized");
  return io;
};

export const closeSocketServer = async (): Promise<void> => {
  if (!io) return;
  await new Promise<void>((resolve, reject) => {
    io!.close((err) => (err ? reject(err) : resolve()));
  });
  io = null;
  console.log("Socket.IO server closed");
};
