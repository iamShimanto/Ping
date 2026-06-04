import { type ReactNode, useEffect, useCallback } from "react";
import { socket } from "../socket/socket";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  resetSocketState,
  setSocketConnected,
  setSocketId,
} from "../store/slices/socketSlice";
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
      // Not authenticated — disconnect cleanly, route guard will redirect
      socket.disconnect();
      return;
    }

    toast.error("Real-time connection failed. Retrying…", "Socket");
  }, []);

  useEffect(() => {
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
    };
  }, [handleConnect, handleDisconnect, handleConnectError]);

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
