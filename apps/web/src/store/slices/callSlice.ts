import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type CallStatus = "idle" | "calling" | "incoming" | "connected";
export type CallType = "audio" | "video";

interface CallState {
  status: CallStatus;
  callType: CallType;
  conversationId: string | null;
  peerId: string | null;
  peerName: string;
  peerAvatar: string | null;
  peerOnline: boolean;
  isMuted: boolean;
  isCameraOff: boolean;
}

const initialState: CallState = {
  status: "idle",
  callType: "audio",
  conversationId: null,
  peerId: null,
  peerName: "",
  peerAvatar: null,
  peerOnline: false,
  isMuted: false,
  isCameraOff: false,
};

const callSlice = createSlice({
  name: "call",
  initialState,
  reducers: {
    startOutgoingCall(state, action: PayloadAction<{
      conversationId: string; peerId: string; peerName: string;
      peerAvatar: string | null; peerOnline: boolean; callType: CallType;
    }>) {
      state.status = "calling";
      state.callType = action.payload.callType;
      state.conversationId = action.payload.conversationId;
      state.peerId = action.payload.peerId;
      state.peerName = action.payload.peerName;
      state.peerAvatar = action.payload.peerAvatar;
      state.peerOnline = action.payload.peerOnline;
      state.isMuted = false;
      state.isCameraOff = false;
    },
    setIncomingCall(state, action: PayloadAction<{
      conversationId: string; peerId: string; peerName: string;
      peerAvatar: string | null; callType: CallType;
    }>) {
      state.status = "incoming";
      state.callType = action.payload.callType;
      state.conversationId = action.payload.conversationId;
      state.peerId = action.payload.peerId;
      state.peerName = action.payload.peerName;
      state.peerAvatar = action.payload.peerAvatar;
      state.isMuted = false;
      state.isCameraOff = false;
    },
    setCallConnected(state) {
      state.status = "connected";
    },
    endCall(_state) {
      return { ...initialState };
    },
    toggleMute(state) {
      state.isMuted = !state.isMuted;
    },
    toggleCamera(state) {
      state.isCameraOff = !state.isCameraOff;
    },
  },
});

export const {
  startOutgoingCall, setIncomingCall, setCallConnected,
  endCall, toggleMute, toggleCamera,
} = callSlice.actions;
export default callSlice.reducer;
