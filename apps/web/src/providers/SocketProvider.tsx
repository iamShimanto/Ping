import { type ReactNode, useEffect, useCallback } from "react";
import { socket } from "../socket/socket";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  resetSocketState,
  setSocketConnected,
  setSocketId,
} from "../store/slices/socketSlice";
import { setUser } from "../store/slices/authSlice";
import { setTyping } from "../store/slices/chatSlice";
import { setIncomingCall } from "../store/slices/callSlice";
import { conversationApi } from "../api/conversation/conversationApi";
import { callApi } from "../api/call/callApi";
import { toast } from "@repo/ui";

interface Props {
  children: ReactNode;
}

const SocketProvider = ({ children }: Props) => {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const currentUser = useAppSelector((s) => s.auth.user);

  const handleDisconnect = useCallback(
    (reason: string) => {
      dispatch(setSocketConnected(false));
      dispatch(setSocketId(null));
      console.log("[Socket] Disconnected:", reason);
    },
    [dispatch],
  );

  const handleConnectError = useCallback((err: Error) => {
    console.warn("[Socket] Connect error:", err.message);

    if (err.message === "AUTH_TOKEN_EXPIRED") {
      setTimeout(() => {
        if (!socket.connected) socket.connect();
      }, 3000);
      return;
    }

    if (err.message === "AUTH_TOKEN_MISSING" || err.message === "AUTH_TOKEN_INVALID") {
      socket.disconnect();
      return;
    }

    toast.error("Real-time connection failed. Retrying…", "Socket");
  }, []);

  const handleMessageReceived = useCallback(() => {
    dispatch(conversationApi.util.invalidateTags(["Conversations"]));
  }, [dispatch]);

  // When socket connects, server sets us online in DB — sync Redux state too
  const handleConnect = useCallback(() => {
    dispatch(setSocketConnected(true));
    dispatch(setSocketId(socket.id ?? null));
    if (currentUser) {
      dispatch(setUser({ ...currentUser, status: "online" }));
    }
  }, [dispatch, currentUser]);

  const handleTypingStart = useCallback(
    ({ userId, conversationId }: { userId: string; conversationId: string }) => {
      dispatch(setTyping({ conversationId, userId, isTyping: true }));
    },
    [dispatch],
  );

  const handleTypingStop = useCallback(
    ({ userId, conversationId }: { userId: string; conversationId: string }) => {
      dispatch(setTyping({ conversationId, userId, isTyping: false }));
    },
    [dispatch],
  );

  const handleIncomingCall = useCallback(
    (data: { conversationId: string; to: string; from: string; callerName: string; callerAvatar: string | null; callType?: "audio" | "video" }) => {
      if (!currentUser || data.to !== currentUser.userId) return;
      dispatch(setIncomingCall({
        conversationId: data.conversationId,
        peerId: data.from,
        peerName: data.callerName,
        peerAvatar: data.callerAvatar,
        callType: data.callType ?? "audio",
      }));
    },
    [dispatch, currentUser],
  );

  useEffect(() => {
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);
    socket.on("message:received", handleMessageReceived);
    socket.on("typing:start", handleTypingStart);
    socket.on("typing:stop", handleTypingStop);
    socket.on("call:incoming", handleIncomingCall);

    const invalidateCallLogs = () => dispatch(callApi.util.invalidateTags(["CallLogs"]));
    socket.on("call:ended", invalidateCallLogs);
    socket.on("call:rejected", invalidateCallLogs);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
      socket.off("message:received", handleMessageReceived);
      socket.off("typing:start", handleTypingStart);
      socket.off("typing:stop", handleTypingStop);
      socket.off("call:incoming", handleIncomingCall);
      socket.off("call:ended", invalidateCallLogs);
      socket.off("call:rejected", invalidateCallLogs);
    };
  }, [handleConnect, handleDisconnect, handleConnectError, handleMessageReceived, handleTypingStart, handleTypingStop, handleIncomingCall]);

  // Connect when authenticated, disconnect when logged out
  useEffect(() => {
    if (isAuthenticated) {
      if (!socket.connected) socket.connect();
    } else {
      if (socket.connected) socket.disconnect();
      dispatch(resetSocketState());
    }
  }, [isAuthenticated, dispatch]);

  return <>{children}</>;
};

export default SocketProvider;
