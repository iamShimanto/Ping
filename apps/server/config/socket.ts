import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { socketAuthMiddleware } from "../socket/socket.auth";
import { env } from "@repo/config";
import User from "../models/auth/auth.models";
import ConversationModel from "../models/conversation/conversation.models";
import CallLog from "../models/call/callLog.model";
import { sendPushToUser } from "../utils/pushNotification";

let io: Server | null = null;

// Track online users
const onlineUsers = new Map<string, Set<string>>();

// Track active calls: conversationId -> { callerId, calleeId, startedAt }
const activeCalls = new Map<string, { callerId: string; calleeId: string; callType: "audio" | "video"; startedAt: Date }>();

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

// True when userId is a participant of the conversation (invalid ids → false).
const isParticipant = async (conversationId: string, userId: string): Promise<boolean> => {
  try {
    return (await ConversationModel.exists({ _id: conversationId, participants: userId })) !== null;
  } catch {
    return false;
  }
};

// True when every userId in the list participates in the conversation.
const areParticipants = async (conversationId: string, userIds: string[]): Promise<boolean> => {
  try {
    const conv = await ConversationModel.findOne(
      { _id: conversationId, participants: { $all: userIds } },
      { _id: 1 },
    ).lean();
    return conv !== null;
  } catch {
    return false;
  }
};

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

  // ── Typing indicators (only participants of the conversation)
  socket.on(
    "typing:start",
    async ({ conversationId }: { conversationId: string }) => {
      if (!(await isParticipant(conversationId, userId))) return;
      socket.to(conversationId).emit("typing:start", { userId, conversationId });
    }
  );

  socket.on(
    "typing:stop",
    async ({ conversationId }: { conversationId: string }) => {
      if (!(await isParticipant(conversationId, userId))) return;
      socket.to(conversationId).emit("typing:stop", { userId, conversationId });
    }
  );

  // ── Message read receipts (only participants of the conversation)
  socket.on(
    "message:read",
    async ({
      messageId,
      conversationId,
    }: {
      messageId: string;
      conversationId: string;
    }) => {
      if (!(await isParticipant(conversationId, userId))) return;
      socket.to(conversationId).emit("message:read", { messageId, userId, conversationId });
    }
  );

  // ── WebRTC call signaling
  // Caller identity is NEVER taken from the client: it is derived from the
  // authenticated socket (socket.data.userId) and looked up in the DB, and
  // both parties must be participants of the conversation.

  socket.on("call:initiate", async (data: { conversationId: string; to: string; callType?: "audio" | "video" }) => {
    const { conversationId, to } = data;
    const callType = data.callType ?? "audio";
    if (!conversationId || !to || to === userId) return;
    if (!(await areParticipants(conversationId, [userId, to]))) return;

    const caller = await User.findById(userId).select("fullName avatar").lean();
    if (!caller) return;

    const outgoing = {
      conversationId,
      to,
      from: userId,
      callerName: caller.fullName,
      callerAvatar: caller.avatar ?? null,
      callType,
    };

    // Record call start — will be saved as "missed" unless answered/ended properly
    activeCalls.set(conversationId, { callerId: userId, calleeId: to, callType, startedAt: new Date() });
    const sockets = onlineUsers.get(to);
    if (sockets) sockets.forEach((sid) => io!.to(sid).emit("call:incoming", outgoing));

    // Push to offline callee
    if (!sockets || sockets.size === 0) {
      const callTypeLabel = callType === "video" ? "Video" : "Audio";
      sendPushToUser(to, {
        title: `📞 Incoming ${callTypeLabel} Call`,
        body: `${caller.fullName} is calling you`,
        icon: caller.avatar ?? "/icon-192.png",
        data: { conversationId, type: "call" },
      }).catch(() => {});
    }
  });

  socket.on("call:offer", async (data: { conversationId: string; to: string; offer: object }) => {
    if (!(await areParticipants(data.conversationId, [userId, data.to]))) return;
    const sockets = onlineUsers.get(data.to);
    if (sockets) sockets.forEach((sid) => io!.to(sid).emit("call:offer", { ...data, from: userId }));
  });

  socket.on("call:answer", async (data: { conversationId: string; to: string; answer: object }) => {
    if (!(await areParticipants(data.conversationId, [userId, data.to]))) return;
    const sockets = onlineUsers.get(data.to);
    if (sockets) sockets.forEach((sid) => io!.to(sid).emit("call:answer", { ...data, from: userId }));
  });

  socket.on("call:ice-candidate", async (data: { conversationId: string; to: string; candidate: object }) => {
    if (!(await areParticipants(data.conversationId, [userId, data.to]))) return;
    const sockets = onlineUsers.get(data.to);
    if (sockets) sockets.forEach((sid) => io!.to(sid).emit("call:ice-candidate", { ...data, from: userId }));
  });

  socket.on("call:reject", async (data: { conversationId: string; to: string }) => {
    if (!(await areParticipants(data.conversationId, [userId, data.to]))) return;
    const sockets = onlineUsers.get(data.to);
    if (sockets) sockets.forEach((sid) => io!.to(sid).emit("call:rejected", { ...data, from: userId }));
    // Save rejected call log
    const active = activeCalls.get(data.conversationId);
    if (active && (userId === active.calleeId || userId === active.callerId)) {
      CallLog.create({ conversationId: data.conversationId, caller: active.callerId, callee: active.calleeId, callType: active.callType, status: "rejected", startedAt: active.startedAt, durationSec: 0 }).catch(() => {});
      activeCalls.delete(data.conversationId);
    }
  });

  socket.on("call:end", async (data: { conversationId: string; to: string }) => {
    if (!(await areParticipants(data.conversationId, [userId, data.to]))) return;
    const sockets = onlineUsers.get(data.to);
    if (sockets) sockets.forEach((sid) => io!.to(sid).emit("call:ended", { ...data, from: userId }));
    // Save completed or missed call log
    const active = activeCalls.get(data.conversationId);
    if (active && (userId === active.calleeId || userId === active.callerId)) {
      const endedAt = new Date();
      const durationSec = Math.round((endedAt.getTime() - active.startedAt.getTime()) / 1000);
      const status = durationSec > 2 ? "completed" : "missed";
      CallLog.create({ conversationId: data.conversationId, caller: active.callerId, callee: active.calleeId, callType: active.callType, status, startedAt: active.startedAt, endedAt, durationSec }).catch(() => {});
      activeCalls.delete(data.conversationId);
    }
  });

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

    // Register handlers FIRST, synchronously: the DB work below awaits, and
    // any event the client emits in that window would otherwise be dropped
    // silently (no listener registered yet) — e.g. a call started the
    // instant the socket connects would never ring.
    registerSocketHandlers(socket);

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
