import { type ReactNode, useEffect } from "react";
import { useDispatch } from "react-redux";
import { socket } from "../socket/socket";
import {
    resetSocketState,
    setSocketConnected,
    setSocketId,
} from "../store/slices/socketSlice";

interface SocketProviderProps {
    children: ReactNode;
}

const SocketProvider = ({ children }: SocketProviderProps) => {
    const dispatch = useDispatch();

    useEffect(() => {
        socket.connect();

        const handleConnect = () => {
            dispatch(setSocketConnected(true));
            dispatch(setSocketId(socket.id || null));
            console.log("Socket connected:", socket.id);
        };

        const handleDisconnect = () => {
            dispatch(setSocketConnected(false));
            dispatch(setSocketId(null));
            console.log("Socket disconnected");
        };

        socket.on("connect", handleConnect);
        socket.on("disconnect", handleDisconnect);

        return () => {
            socket.off("connect", handleConnect);
            socket.off("disconnect", handleDisconnect);
            socket.disconnect();
            dispatch(resetSocketState());
        };
    }, [dispatch]);

    return children;
};

export default SocketProvider;