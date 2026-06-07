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
  isScreenSharing: boolean;
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
  isScreenSharing: false,
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
      state.isScreenSharing = false;
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
      state.isScreenSharing = false;
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
    setScreenSharing(state, action: PayloadAction<boolean>) {
      state.isScreenSharing = action.payload;
    },
  },
});

export const {
  startOutgoingCall, setIncomingCall, setCallConnected,
  endCall, toggleMute, toggleCamera, setScreenSharing,
} = callSlice.actions;
export default callSlice.reducer;
