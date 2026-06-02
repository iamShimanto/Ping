import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface SocketState {
    isConnected: boolean;
    socketId: string | null;
}

const initialState: SocketState = {
    isConnected: false,
    socketId: null,
};

const socketSlice = createSlice({
    name: "socket",
    initialState,
    reducers: {
        setSocketConnected: (state, action: PayloadAction<boolean>) => {
            state.isConnected = action.payload;
        },

        setSocketId: (state, action: PayloadAction<string | null>) => {
            state.socketId = action.payload;
        },

        resetSocketState: () => initialState,
    },
});

export const { setSocketConnected, setSocketId, resetSocketState } =
    socketSlice.actions;

export default socketSlice.reducer;