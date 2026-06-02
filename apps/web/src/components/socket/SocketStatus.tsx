import { useSelector } from "react-redux";
import type { RootState } from "../../store/store";

const SocketStatus = () => {
    const { isConnected, socketId } = useSelector(
        (state: RootState) => state.socket
    );

    return (
        <div>
            {isConnected ? `Connected: ${socketId}` : "Disconnected"}
        </div>
    );
};

export default SocketStatus;