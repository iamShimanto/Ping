import { useReducer, useRef, useEffect, useCallback } from "react";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { socket } from "../socket/socket";
import {
  useLazyGetMessagesQuery,
  useMarkAllReadMutation,
  conversationApi,
  type Message,
  type MessageReaction,
} from "../api/conversation/conversationApi";

const PAGE_LIMIT = 30;

export type PendingUpload = {
  tempId: string;
  localUrl: string;
  progress: number;
  kind: "image" | "voice";
  durationSec?: number;
};

export type MsgState = {
  messages: Message[];
  hasMore: boolean;
  isFetching: boolean;
  nextPage: number;
  pending: PendingUpload[];
};

type MsgAction =
  | { type: "reset" }
  | { type: "prepend"; messages: Message[]; hasMore: boolean }
  | { type: "set"; messages: Message[]; hasMore: boolean }
  | { type: "append"; message: Message }
  | { type: "markDeleted"; messageId: string }
  | { type: "markLiked"; messageId: string; likes: string[] }
  | { type: "fetching"; value: boolean }
  | { type: "markReacted"; messageId: string; reactions: MessageReaction[] }
  | { type: "addPending"; item: PendingUpload }
  | { type: "updatePendingProgress"; tempId: string; progress: number }
  | { type: "resolvePending"; tempId: string };

function reducer(s: MsgState, action: MsgAction): MsgState {
  switch (action.type) {
    case "reset":
      return { messages: [], hasMore: true, isFetching: false, nextPage: 2, pending: [] };
    case "set":
      return { ...s, messages: action.messages, hasMore: action.hasMore, isFetching: false, nextPage: 2 };
    case "prepend": {
      const ids = new Set(action.messages.map((m) => m._id));
      const deduped = [...action.messages, ...s.messages.filter((m) => !ids.has(m._id))];
      return { ...s, messages: deduped, hasMore: action.hasMore, isFetching: false, nextPage: s.nextPage + 1 };
    }
    case "append":
      if (s.messages.some((m) => m._id === action.message._id)) return s;
      return { ...s, messages: [...s.messages, action.message] };
    case "markDeleted":
      return {
        ...s,
        messages: s.messages.map((m) =>
          m._id === action.messageId ? { ...m, isDeleted: true, content: "This message was deleted" } : m
        ),
      };
    case "markLiked":
      return {
        ...s,
        messages: s.messages.map((m) => (m._id === action.messageId ? { ...m, likes: action.likes } : m)),
      };
    case "fetching":
      return { ...s, isFetching: action.value };
    case "markReacted":
      return {
        ...s,
        messages: s.messages.map((m) =>
          m._id === action.messageId ? { ...m, reactions: action.reactions } : m
        ),
      };
    case "addPending":
      return { ...s, pending: [...s.pending, action.item] };
    case "updatePendingProgress":
      return {
        ...s,
        pending: s.pending.map((p) => (p.tempId === action.tempId ? { ...p, progress: action.progress } : p)),
      };
    case "resolvePending":
      return { ...s, pending: s.pending.filter((p) => p.tempId !== action.tempId) };
    default:
      return s;
  }
}

export function useChatMessages(contactId: string, messagesEndRef: React.RefObject<HTMLDivElement | null>) {
  const dispatch = useAppDispatch();
  const [msgState, dispatchMsg] = useReducer(reducer, {
    messages: [],
    hasMore: true,
    isFetching: false,
    nextPage: 2,
    pending: [],
  });

  const prevScrollHeightRef = useRef<number>(0);
  const isInitialLoad = useRef(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [fetchMessages] = useLazyGetMessagesQuery();
  const [markAllRead] = useMarkAllReadMutation();

  // Load first page when conversation changes
  useEffect(() => {
    if (!contactId) return;
    dispatchMsg({ type: "reset" });
    isInitialLoad.current = true;
    dispatchMsg({ type: "fetching", value: true });
    fetchMessages({ conversationId: contactId, page: 1, limit: PAGE_LIMIT }).then((res) => {
      if (res.data) {
        dispatchMsg({ type: "set", messages: res.data.messages, hasMore: res.data.pagination.pages > 1 });
      }
    });
  }, [contactId, fetchMessages]);

  // Scroll to bottom after first page loads
  useEffect(() => {
    if (isInitialLoad.current && msgState.messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
      isInitialLoad.current = false;
    }
  }, [msgState.messages.length, messagesEndRef]);

  // Restore scroll position after prepending older messages
  useEffect(() => {
    if (prevScrollHeightRef.current > 0) {
      const container = scrollContainerRef.current;
      if (container) {
        container.scrollTop = container.scrollHeight - prevScrollHeightRef.current;
        prevScrollHeightRef.current = 0;
      }
    }
  }, [msgState.messages.length]);

  const loadOlderMessages = useCallback(() => {
    if (msgState.isFetching || !msgState.hasMore) return;
    prevScrollHeightRef.current = scrollContainerRef.current?.scrollHeight ?? 0;
    dispatchMsg({ type: "fetching", value: true });
    fetchMessages({ conversationId: contactId, page: msgState.nextPage, limit: PAGE_LIMIT }).then((res) => {
      if (res.data) {
        dispatchMsg({
          type: "prepend",
          messages: res.data.messages,
          hasMore: msgState.nextPage < res.data.pagination.pages,
        });
      }
    });
  }, [contactId, fetchMessages, msgState.isFetching, msgState.hasMore, msgState.nextPage]);

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container || msgState.isFetching || !msgState.hasMore) return;
    if (container.scrollTop < 80) loadOlderMessages();
  }, [msgState.isFetching, msgState.hasMore, loadOlderMessages]);

  // Join socket room
  useEffect(() => {
    if (!contactId) return;
    socket.emit("conversation:join", contactId);
    markAllRead(contactId).then(() => {
      dispatch(conversationApi.util.invalidateTags(["Conversations"]));
    });
    return () => { socket.emit("conversation:leave", contactId); };
  }, [contactId, markAllRead, dispatch]);

  // Real-time: incoming messages
  useEffect(() => {
    const handler = (msg: Message) => {
      if (msg.conversation !== contactId) return;
      dispatchMsg({ type: "append", message: msg });
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    };
    socket.on("message:received", handler);
    return () => { socket.off("message:received", handler); };
  }, [contactId, messagesEndRef]);

  // Real-time: deleted
  useEffect(() => {
    const handler = ({ messageId, conversationId }: { messageId: string; conversationId: string }) => {
      if (conversationId !== contactId) return;
      dispatchMsg({ type: "markDeleted", messageId });
    };
    socket.on("message:deleted", handler);
    return () => { socket.off("message:deleted", handler); };
  }, [contactId]);

  // Real-time: liked
  useEffect(() => {
    const handler = ({ messageId, conversationId, likes }: { messageId: string; conversationId: string; likes: string[] }) => {
      if (conversationId !== contactId) return;
      dispatchMsg({ type: "markLiked", messageId, likes });
    };
    socket.on("message:liked", handler);
    return () => { socket.off("message:liked", handler); };
  }, [contactId]);

  // Real-time: reacted
  useEffect(() => {
    const handler = ({ messageId, conversationId, reactions }: { messageId: string; conversationId: string; reactions: MessageReaction[] }) => {
      if (conversationId !== contactId) return;
      dispatchMsg({ type: "markReacted", messageId, reactions });
    };
    socket.on("message:reacted", handler);
    return () => { socket.off("message:reacted", handler); };
  }, [contactId]);

  // Typing state
  const typingUsers = useAppSelector((s) => s.chat.typingByConversation[contactId] ?? []);
  const currentUser = useAppSelector((s) => s.auth.user);
  const someoneTyping = typingUsers.filter((id) => id !== currentUser?.userId).length > 0;

  return { msgState, dispatchMsg, scrollContainerRef, handleScroll, someoneTyping };
}
