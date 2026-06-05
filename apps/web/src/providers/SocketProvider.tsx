import { type ReactNode, useEffect, useCallback } from "react";
import { socket } from "../socket/socket";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  resetSocketState,
  setSocketConnected,
  setSocketId,
} from "../store/slices/socketSlice";
import { conversationApi, type Message } from "../api/conversation/conversationApi";
import { toast } from "@repo/ui";

interface Props {
  children: ReactNode;
}

const SocketProvider = ({ children }: Props) => {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);

  const handleConnect = useCallback(() => {
    dispatch(setSocketConnected(true));
    dispatch(setSocketId(socket.id ?? null));
  }, [dispatch]);

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

  const handleMessageReceived = useCallback(
    (message: Message) => {
      const conversationId = message.conversation;
      dispatch(
        conversationApi.util.updateQueryData("getMessages", { conversationId }, (draft) => {
          const exists = draft.messages.some((m) => m._id === message._id);
          if (!exists) draft.messages.push(message);
        })
      );
      // Also refresh conversation list so lastMessage updates
      dispatch(conversationApi.util.invalidateTags(["Conversations"]));
    },
    [dispatch],
  );

  const handleMessageDeleted = useCallback(
    ({ messageId, conversationId }: { messageId: string; conversationId: string }) => {
      dispatch(
        conversationApi.util.updateQueryData("getMessages", { conversationId }, (draft) => {
          const msg = draft.messages.find((m) => m._id === messageId);
          if (msg) {
            msg.isDeleted = true;
            msg.content = "This message was deleted";
          }
        })
      );
    },
    [dispatch],
  );

  useEffect(() => {
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);
    socket.on("message:received", handleMessageReceived);
    socket.on("message:deleted", handleMessageDeleted);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
      socket.off("message:received", handleMessageReceived);
      socket.off("message:deleted", handleMessageDeleted);
    };
  }, [handleConnect, handleDisconnect, handleConnectError, handleMessageReceived, handleMessageDeleted]);

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
