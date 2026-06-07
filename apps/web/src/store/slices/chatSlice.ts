import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Message } from "../../api/conversation/conversationApi";

interface ChatState {
  activeConversationId: string | null;
  messagesByConversation: Record<string, Message[]>;
  // conversationId -> Set of userIds currently typing
  typingByConversation: Record<string, string[]>;
}

const initialState: ChatState = {
  activeConversationId: null,
  messagesByConversation: {},
  typingByConversation: {},
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setActiveConversation(state, action: PayloadAction<string | null>) {
      state.activeConversationId = action.payload;
    },
    setMessages(state, action: PayloadAction<{ conversationId: string; messages: Message[] }>) {
      state.messagesByConversation[action.payload.conversationId] = action.payload.messages;
    },
    appendMessage(state, action: PayloadAction<Message>) {
      const { conversation } = action.payload;
      if (!state.messagesByConversation[conversation]) {
        state.messagesByConversation[conversation] = [];
      }
      const exists = state.messagesByConversation[conversation].some((m) => m._id === action.payload._id);
      if (!exists) {
        state.messagesByConversation[conversation].push(action.payload);
      }
    },
    markMessageDeleted(state, action: PayloadAction<{ messageId: string; conversationId: string }>) {
      const msgs = state.messagesByConversation[action.payload.conversationId];
      if (msgs) {
        const msg = msgs.find((m) => m._id === action.payload.messageId);
        if (msg) {
          msg.isDeleted = true;
          msg.content = "This message was deleted";
        }
      }
    },
    setTyping(state, action: PayloadAction<{ conversationId: string; userId: string; isTyping: boolean }>) {
      const { conversationId, userId, isTyping } = action.payload;
      if (!state.typingByConversation[conversationId]) {
        state.typingByConversation[conversationId] = [];
      }
      const list = state.typingByConversation[conversationId];
      if (isTyping && !list.includes(userId)) {
        list.push(userId);
      } else if (!isTyping) {
        state.typingByConversation[conversationId] = list.filter((id) => id !== userId);
      }
    },
  },
});

export const { setActiveConversation, setMessages, appendMessage, markMessageDeleted, setTyping } = chatSlice.actions;
export default chatSlice.reducer;
