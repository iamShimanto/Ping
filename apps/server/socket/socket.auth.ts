import jwt from "jsonwebtoken";
import type { Socket } from "socket.io";
import { env } from "@repo/config";

export interface JwtPayload {
  userId: string;
  role: string;
  iat: number;
  exp: number;
}

export interface AuthenticatedSocket extends Socket {
  userId: string;
  role: string;
}

const extractToken = (socket: Socket): string | null => {
  const cookieHeader = socket.handshake.headers.cookie;
  if (cookieHeader) {
    const match = cookieHeader.match(/jwt_access=([^;]+)/);
    if (match?.[1]) return match[1];
  }

  if (socket.handshake.auth?.token) {
    return socket.handshake.auth.token;
  }

  const authHeader = socket.handshake.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  return null;
};

export const socketAuthMiddleware = (
  socket: Socket,
  next: (err?: Error) => void,
): void => {
  try {
    const token = extractToken(socket);

    if (!token) {
      return next(new Error("AUTH_TOKEN_MISSING"));
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    socket.data.userId = decoded.userId;
    socket.data.role = decoded.role;

    console.log(`Socket authenticated: ${decoded.userId} (${socket.id})`);

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      console.log(`Socket auth failed: token expired (${socket.id})`);
      return next(new Error("AUTH_TOKEN_EXPIRED"));
    }

    if (error instanceof jwt.JsonWebTokenError) {
      console.log(`Socket auth failed: invalid token (${socket.id})`); 
      return next(new Error("AUTH_TOKEN_INVALID"));
    }
    console.error("Socket auth unexpected error", error);
    next(new Error("AUTH_FAILED"));
  }
};
