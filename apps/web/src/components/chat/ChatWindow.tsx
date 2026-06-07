import { useState, useEffect, useRef, useCallback, useReducer } from "react";
import {
  RiSearchLine, RiPhoneLine, RiVideoLine, RiInformationLine,
  RiMoreLine, RiEmotionLine, RiMicLine, RiSendPlaneFill,
  RiDownloadLine, RiThumbUpLine, RiMicOffLine, RiVolumeUpLine, RiUserAddLine,
  RiArrowLeftLine, RiDeleteBinLine, RiBookmarkLine, RiBookmarkFill,
  RiImageAddLine, RiCloseLine, RiZoomInLine, RiStopCircleLine,
} from "react-icons/ri";
import Avatar from "./Avatar";
import UserInfoPanel from "./UserInfoPanel";
import VoiceMessage from "./VoiceMessage";
import {
  useGetConversationsQuery,
  useSendMessageMutation,
  useLazyGetMessagesQuery,
  useDeleteMessageMutation,
  useMarkAllReadMutation,
  useLikeMessageMutation,
  useReactToMessageMutation,
  useLazySearchMessagesQuery,
  conversationApi,
  type Message,
  type MessageReaction,
} from "../../api/conversation/conversationApi";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import { socket } from "../../socket/socket";
import { toast } from "@repo/ui";
import { useAddBookmarkMutation, useRemoveBookmarkMutation, useGetBookmarksQuery } from "../../api/bookmark/bookmarkApi";

const PAGE_LIMIT = 30;

interface ChatWindowProps {
  contactId: string;
  onBack?: () => void;
}

export default function ChatWindow({ contactId, onBack }: ChatWindowProps) {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((s) => s.auth.user);
  const [message, setMessage] = useState("");
  const [showInfo, setShowInfo] = useState(false);
  const [showAudioCall, setShowAudioCall] = useState(false);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [imagePreview, setImagePreview] = useState<{ file: File; url: string } | null>(null);
  const [imageCaption, setImageCaption] = useState("");
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [emojiPickerFor, setEmojiPickerFor] = useState<string | null>(null);
  const [showInputEmoji, setShowInputEmoji] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const msgRefsMap = useRef<Map<string, HTMLDivElement>>(new Map());
  // Voice recording
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Message state — all updates happen in event handlers/callbacks, never in effects
  type PendingUpload = { tempId: string; localUrl: string; progress: number; kind: "image" | "voice"; durationSec?: number };
  type MsgState = { messages: Message[]; hasMore: boolean; isFetching: boolean; nextPage: number; pending: PendingUpload[] };
  const [msgState, dispatchMsg] = useReducer(
    (s: MsgState, action:
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
      | { type: "resolvePending"; tempId: string }
    ): MsgState => {
      switch (action.type) {
        case "reset": return { messages: [], hasMore: true, isFetching: false, nextPage: 2, pending: [] };
        case "set": return { ...s, messages: action.messages, hasMore: action.hasMore, isFetching: false, nextPage: 2 };
        case "prepend": {
          const ids = new Set(action.messages.map((m) => m._id));
          const deduped = [...action.messages, ...s.messages.filter((m) => !ids.has(m._id))];
          return { ...s, messages: deduped, hasMore: action.hasMore, isFetching: false, nextPage: s.nextPage + 1 };
        }
        case "append": {
          if (s.messages.some((m) => m._id === action.message._id)) return s;
          return { ...s, messages: [...s.messages, action.message] };
        }
        case "markDeleted":
          return { ...s, messages: s.messages.map((m) => m._id === action.messageId ? { ...m, isDeleted: true, content: "This message was deleted" } : m) };
        case "markLiked":
          return { ...s, messages: s.messages.map((m) => m._id === action.messageId ? { ...m, likes: action.likes } : m) };
        case "fetching": return { ...s, isFetching: action.value };
        case "markReacted":
          return { ...s, messages: s.messages.map((m) => m._id === action.messageId ? { ...m, reactions: action.reactions } : m) };
        case "addPending": return { ...s, pending: [...s.pending, action.item] };
        case "updatePendingProgress":
          return { ...s, pending: s.pending.map((p) => p.tempId === action.tempId ? { ...p, progress: action.progress } : p) };
        case "resolvePending":
          return { ...s, pending: s.pending.filter((p) => p.tempId !== action.tempId) };
        default: return s;
      }
    },
    { messages: [], hasMore: true, isFetching: false, nextPage: 2, pending: [] }
  );

  const prevScrollHeightRef = useRef<number>(0);
  const isInitialLoad = useRef(true);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  const [fetchMessages] = useLazyGetMessagesQuery();

  const { data: conversations = [] } = useGetConversationsQuery();
  const conv = conversations.find((c) => String(c.conversationId) === contactId);

  const contactName = conv?.isGroup
    ? (conv.groupName ?? "Group")
    : (conv?.friend?.fullName ?? "...");
  const contactAvatar = !conv?.isGroup ? (conv?.friend?.avatar ?? null) : null;
  const contactStatus = !conv?.isGroup ? conv?.friend?.status : undefined;
  const isOnline = contactStatus === "online";

  const [sendMessage, { isLoading: isSending }] = useSendMessageMutation();
  const [deleteMessage] = useDeleteMessageMutation();
  const [markAllRead] = useMarkAllReadMutation();
  const [likeMessage] = useLikeMessageMutation();
  const [reactToMessage] = useReactToMessageMutation();
  const [fetchSearch, { data: searchResults = [], isFetching: isSearching }] = useLazySearchMessagesQuery();
  const [addBookmark] = useAddBookmarkMutation();
  const [removeBookmark] = useRemoveBookmarkMutation();
  const { data: bookmarks = [] } = useGetBookmarksQuery();
  const bookmarkedIds = new Set(bookmarks.map((b) => b.messageId));

  // Load first page when conversation changes
  useEffect(() => {
    if (!contactId) return;
    dispatchMsg({ type: "reset" });
    isInitialLoad.current = true;
    dispatchMsg({ type: "fetching", value: true });
    fetchMessages({ conversationId: contactId, page: 1, limit: PAGE_LIMIT }).then((res) => {
      setShowInputEmoji(false);
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
  }, [msgState.messages.length]);

  // Restore scroll after prepending older messages
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

  // Join socket room when conversation opens — server event is "conversation:join"
  useEffect(() => {
    if (!contactId) return;
    socket.emit("conversation:join", contactId);
    markAllRead(contactId).then(() => {
      dispatch(conversationApi.util.invalidateTags(["Conversations"]));
    });
    return () => {
      socket.emit("conversation:leave", contactId);
    };
  }, [contactId, markAllRead, dispatch]);

  // Append real-time incoming messages
  useEffect(() => {
    const handleIncoming = (msg: Message) => {
      if (msg.conversation !== contactId) return;
      dispatchMsg({ type: "append", message: msg });
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    };
    socket.on("message:received", handleIncoming);
    return () => { socket.off("message:received", handleIncoming); };
  }, [contactId]);

  // Handle real-time deleted messages
  useEffect(() => {
    const handleDeleted = ({ messageId, conversationId }: { messageId: string; conversationId: string }) => {
      if (conversationId !== contactId) return;
      dispatchMsg({ type: "markDeleted", messageId });
    };
    socket.on("message:deleted", handleDeleted);
    return () => { socket.off("message:deleted", handleDeleted); };
  }, [contactId]);

  // Handle real-time liked messages
  useEffect(() => {
    const handleLiked = ({ messageId, conversationId, likes }: { messageId: string; conversationId: string; likes: string[] }) => {
      if (conversationId !== contactId) return;
      dispatchMsg({ type: "markLiked", messageId, likes });
    };
    socket.on("message:liked", handleLiked);
    return () => { socket.off("message:liked", handleLiked); };
  }, [contactId]);

  // Handle real-time reactions
  useEffect(() => {
    const handleReacted = ({ messageId, conversationId, reactions }: { messageId: string; conversationId: string; reactions: MessageReaction[] }) => {
      if (conversationId !== contactId) return;
      dispatchMsg({ type: "markReacted", messageId, reactions });
    };
    socket.on("message:reacted", handleReacted);
    return () => { socket.off("message:reacted", handleReacted); };
  }, [contactId]);

  // Typing indicator — read from Redux (set by SocketProvider)
  const typingUsers = useAppSelector((s) => s.chat.typingByConversation[contactId] ?? []);
  const someoneTyping = typingUsers.filter((id) => id !== currentUser?.userId).length > 0;

  const emitTypingStop = useCallback(() => {
    if (isTypingRef.current) {
      socket.emit("typing:stop", { conversationId: contactId });
      isTypingRef.current = false;
    }
  }, [contactId]);

  const handleMessageChange = useCallback((val: string) => {
    setMessage(val);
    if (!isTypingRef.current) {
      socket.emit("typing:start", { conversationId: contactId });
      isTypingRef.current = true;
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(emitTypingStop, 2000);
  }, [contactId, emitTypingStop]);

  // Stop typing when conversation changes
  useEffect(() => {
    return () => {
      emitTypingStop();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [contactId, emitTypingStop]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Only images are supported", "Chat");
      return;
    }
    const url = URL.createObjectURL(file);
    setImagePreview({ file, url });
    setImageCaption("");
    // reset input so same file can be re-selected
    e.target.value = "";
  };

  const handleSendImage = () => {
    if (!imagePreview) return;
    const { file, url } = imagePreview;
    const caption = imageCaption.trim();
    const tempId = `pending-${Date.now()}`;

    // Close modal immediately, show pending bubble in chat
    setImagePreview(null);
    setImageCaption("");
    dispatchMsg({ type: "addPending", item: { tempId, localUrl: url, progress: 0, kind: "image" } });
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);

    const fd = new FormData();
    fd.append("conversationId", contactId);
    fd.append("file", file);
    if (caption) fd.append("content", caption);

    const baseUrl = (import.meta as { env: Record<string, string> }).env.VITE_API_URL ?? "";
    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        dispatchMsg({ type: "updatePendingProgress", tempId, progress: Math.round((e.loaded / e.total) * 100) });
      }
    };

    xhr.onload = () => {
      xhrRef.current = null;
      dispatchMsg({ type: "resolvePending", tempId });
      URL.revokeObjectURL(url);
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const json = JSON.parse(xhr.responseText);
          const sent: Message = json.data;
          dispatchMsg({ type: "append", message: sent });
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
        } catch {
          toast.error("Failed to parse response", "Chat");
        }
      } else {
        toast.error("Failed to send image", "Chat");
      }
    };

    xhr.onerror = () => {
      xhrRef.current = null;
      dispatchMsg({ type: "resolvePending", tempId });
      URL.revokeObjectURL(url);
      toast.error("Failed to send image", "Chat");
    };

    xhr.open("POST", `${baseUrl}/api/v1/conversations/messages/send`);
    xhr.withCredentials = true;
    xhr.send(fd);
  };

  const handleSend = async () => {
    const trimmed = message.trim();
    if (!trimmed || isSending) return;
    emitTypingStop();
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    setMessage("");
    try {
      const sent = await sendMessage({ conversationId: contactId, content: trimmed }).unwrap();
      dispatchMsg({ type: "append", message: sent });
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch {
      toast.error("Failed to send message", "Chat");
      setMessage(trimmed);
    }
  };

  const handleDelete = async (messageId: string) => {
    try {
      await deleteMessage(messageId).unwrap();
      dispatchMsg({ type: "markDeleted", messageId });
    } catch {
      toast.error("Failed to delete message", "Chat");
    }
  };

  const handleReact = async (messageId: string, emoji: string) => {
    try {
      const res = await reactToMessage({ messageId, emoji }).unwrap();
      dispatchMsg({ type: "markReacted", messageId, reactions: res.reactions });
    } catch {
      toast.error("Failed to react", "Chat");
    }
  };

  const handleLike = async (messageId: string) => {
    try {
      const res = await likeMessage(messageId).unwrap();
      dispatchMsg({ type: "markLiked", messageId, likes: res.likes });
    } catch {
      toast.error("Failed to update like", "Chat");
    }
  };

  const handleToggleBookmark = async (messageId: string) => {
    try {
      if (bookmarkedIds.has(messageId)) {
        await removeBookmark(messageId).unwrap();
      } else {
        await addBookmark(messageId).unwrap();
      }
    } catch {
      toast.error("Failed to update bookmark", "Chat");
    }
  };

  // ── Voice recording ──────────────────────────────────────────────────────────
  const uploadVoiceBlob = useCallback((blob: Blob, _durationSec: number, localUrl: string, tempId: string) => {
    const fd = new FormData();
    fd.append("conversationId", contactId);
    fd.append("file", blob, "voice.webm");

    const baseUrl = (import.meta as { env: Record<string, string> }).env.VITE_API_URL ?? "";
    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable)
        dispatchMsg({ type: "updatePendingProgress", tempId, progress: Math.round((e.loaded / e.total) * 100) });
    };
    xhr.onload = () => {
      xhrRef.current = null;
      dispatchMsg({ type: "resolvePending", tempId });
      URL.revokeObjectURL(localUrl);
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const sent: Message = JSON.parse(xhr.responseText).data;
          dispatchMsg({ type: "append", message: sent });
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
        } catch { toast.error("Failed to parse response", "Chat"); }
      } else {
        toast.error("Failed to send voice message", "Chat");
      }
    };
    xhr.onerror = () => {
      xhrRef.current = null;
      dispatchMsg({ type: "resolvePending", tempId });
      URL.revokeObjectURL(localUrl);
      toast.error("Failed to send voice message", "Chat");
    };
    xhr.open("POST", `${baseUrl}/api/v1/conversations/messages/send`);
    xhr.withCredentials = true;
    xhr.send(fd);
  }, [contactId]);

  const startRecording = useCallback(async () => {
    if (isRecording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/ogg";
      const mr = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mr.start(100);
      mediaRecorderRef.current = mr;
      setIsRecording(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => setRecordingSeconds((s) => s + 1), 1000);
    } catch {
      toast.error("Microphone access denied", "Chat");
    }
  }, [isRecording]);

  const stopRecording = useCallback((send: boolean) => {
    const mr = mediaRecorderRef.current;
    if (!mr) return;
    if (recordingTimerRef.current) { clearInterval(recordingTimerRef.current); recordingTimerRef.current = null; }

    const durationSec = recordingSeconds;
    mr.onstop = () => {
      mr.stream.getTracks().forEach((t) => t.stop());
      if (send && audioChunksRef.current.length > 0) {
        const blob = new Blob(audioChunksRef.current, { type: mr.mimeType });
        const localUrl = URL.createObjectURL(blob);
        const tempId = `pending-voice-${Date.now()}`;
        dispatchMsg({ type: "addPending", item: { tempId, localUrl, progress: 0, kind: "voice", durationSec } });
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
        uploadVoiceBlob(blob, durationSec, localUrl, tempId);
      }
      audioChunksRef.current = [];
    };
    mr.stop();
    mediaRecorderRef.current = null;
    setIsRecording(false);
    setRecordingSeconds(0);
  }, [recordingSeconds, uploadVoiceBlob]);

  // Cleanup on unmount / conversation change
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current) { mediaRecorderRef.current.stop(); mediaRecorderRef.current = null; }
      if (recordingTimerRef.current) { clearInterval(recordingTimerRef.current); recordingTimerRef.current = null; }
    };
  }, [contactId]);

  const formatDuration = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
  // ─────────────────────────────────────────────────────────────────────────────

  // ── Message search ───────────────────────────────────────────────────────────
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = useCallback((val: string) => {
    setSearchQuery(val);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (val.trim().length >= 1) {
      searchDebounceRef.current = setTimeout(() => {
        fetchSearch({ conversationId: contactId, q: val.trim() });
      }, 350);
    }
  }, [contactId, fetchSearch]);

  const handleScrollToMessage = useCallback((msgId: string) => {
    const el = msgRefsMap.current.get(msgId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("highlight-msg");
      setTimeout(() => el.classList.remove("highlight-msg"), 1500);
    } else {
      toast.error("Message not in view — scroll up to load it", "Search");
    }
    setShowSearch(false);
    setSearchQuery("");
  }, []);

  const handleToggleSearch = useCallback(() => {
    setShowSearch((v) => {
      if (!v) setTimeout(() => searchInputRef.current?.focus(), 50);
      else setSearchQuery("");
      return !v;
    });
  }, []);
  // ─────────────────────────────────────────────────────────────────────────────

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };


  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Header */}
        <div className="h-14 bg-[#2a3042] border-b border-[#323a4d] flex items-center px-3 sm:px-4 gap-2 sm:gap-3 shrink-0">
          {onBack && (
            <button onClick={onBack} className="sm:hidden text-[#6b7280] hover:text-[#a3aed0] p-1 -ml-1 shrink-0">
              <RiArrowLeftLine size={20} />
            </button>
          )}
          <Avatar
            initials={contactName.slice(0, 2).toUpperCase()}
            name={contactName}
            size="sm"
            online={isOnline}
            src={contactAvatar}
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white leading-tight truncate">{contactName}</p>
            <p className={`text-xs ${isOnline ? "text-green-400" : "text-[#6b7280]"}`}>
              {isOnline ? "Active" : contactStatus ?? "Offline"}
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 text-[#6b7280] shrink-0">
            <button onClick={handleToggleSearch} className={`hidden sm:block hover:text-[#a3aed0] transition-colors ${showSearch ? "text-[#7269ef]" : ""}`}><RiSearchLine size={18} /></button>
            <button onClick={() => { setShowAudioCall(true); setShowVideoCall(false); }} className="hover:text-[#a3aed0]">
              <RiPhoneLine size={18} />
            </button>
            <button onClick={() => { setShowVideoCall(true); setShowAudioCall(false); }} className="hidden xs:block hover:text-[#a3aed0]">
              <RiVideoLine size={18} />
            </button>
            <button onClick={() => setShowInfo(!showInfo)} className="hover:text-[#a3aed0]">
              <RiInformationLine size={18} />
            </button>
            <button className="hover:text-[#a3aed0]"><RiMoreLine size={18} /></button>
          </div>
        </div>

        {/* Search bar */}
        {showSearch && (
          <div className="bg-[#2a3042] border-b border-[#323a4d] px-3 py-2 shrink-0">
            <div className="relative flex items-center gap-2">
              <div className="flex-1 relative">
                <RiSearchLine size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6b7280]" />
                <input
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Search messages..."
                  className="w-full bg-[#1e2433] text-sm text-[#a3aed0] placeholder-[#6b7280] rounded-lg pl-8 pr-3 py-1.5 outline-none border border-[#323a4d] focus:border-[#7269ef]"
                />
                {isSearching && (
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6b7280] text-xs animate-pulse">...</span>
                )}
              </div>
              <button onClick={handleToggleSearch} className="text-[#6b7280] hover:text-[#a3aed0]">
                <RiCloseLine size={18} />
              </button>
            </div>
            {/* Results */}
            {searchQuery.trim().length >= 1 && !isSearching && (
              <div className="mt-2 max-h-52 overflow-y-auto flex flex-col gap-1">
                {searchResults.length === 0 ? (
                  <p className="text-xs text-[#6b7280] text-center py-2">No messages found</p>
                ) : (
                  searchResults.map((r) => (
                    <button
                      key={r._id}
                      onClick={() => handleScrollToMessage(r._id)}
                      className="text-left w-full px-3 py-2 rounded-lg hover:bg-[#323a4d] transition-colors"
                    >
                      <p className="text-xs text-[#6b7280] mb-0.5">{r.sender.fullName} · {formatTime(r.createdAt)}</p>
                      <p className="text-sm text-[#a3aed0] truncate">{r.content}</p>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* Messages */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          onClick={() => emojiPickerFor && setEmojiPickerFor(null)}
          className="flex-1 overflow-y-auto p-3 sm:p-4 chat-bg flex flex-col gap-3 sm:gap-4 pb-4"
        >
          {msgState.isFetching && msgState.messages.length > 0 && (
            <div className="flex justify-center py-2">
              <span className="text-xs text-[#6b7280] animate-pulse">Loading older messages...</span>
            </div>
          )}
          {!msgState.hasMore && msgState.messages.length > 0 && (
            <div className="flex justify-center py-2">
              <span className="text-xs text-[#6b7280]">No more messages</span>
            </div>
          )}
          {msgState.messages.map((msg) => {
            const isMe = msg.sender._id === currentUser?.userId;
            // group reactions by emoji
            const reactionGroups = (msg.reactions ?? []).reduce<Record<string, { count: number; mine: boolean }>>((acc, r) => {
              if (!acc[r.emoji]) acc[r.emoji] = { count: 0, mine: false };
              acc[r.emoji].count++;
              if (r.userId === currentUser?.userId) acc[r.emoji].mine = true;
              return acc;
            }, {});
            return (
              <div
                key={msg._id}
                ref={(el) => { if (el) msgRefsMap.current.set(msg._id, el); else msgRefsMap.current.delete(msg._id); }}
                className={`flex items-end gap-2 group ${isMe ? "flex-row-reverse" : "flex-row"}`}
              >
                {!isMe && (
                  <Avatar
                    initials={msg.sender.fullName.slice(0, 2).toUpperCase()}
                    name={msg.sender.fullName}
                    size="xs"
                    className="mb-4 shrink-0"
                    src={msg.sender.avatar ?? undefined}
                  />
                )}
                <div className={`flex flex-col gap-1 max-w-[75%] sm:max-w-xs ${isMe ? "items-end" : "items-start"}`}>
                  {msg.isDeleted ? (
                    <div className={`px-3 sm:px-4 py-2.5 rounded-2xl text-sm italic text-[#6b7280]
                      ${isMe ? "bg-[#3d4554] rounded-br-sm" : "bg-[#2e3547] rounded-bl-sm"}`}>
                      This message was deleted
                    </div>
                  ) : msg.contentType === "image" ? (
                    <div
                      className={`rounded-2xl overflow-hidden cursor-pointer ${isMe ? "rounded-br-sm" : "rounded-bl-sm"}`}
                      onClick={() => setLightboxUrl(msg.fileUrl ?? msg.content)}
                    >
                      <img
                        src={msg.fileUrl ?? msg.content}
                        alt="image"
                        className="max-w-55 sm:max-w-xs max-h-64 object-cover block"
                        loading="lazy"
                      />
                    </div>
                  ) : msg.contentType === "voice" ? (
                    <VoiceMessage src={msg.fileUrl ?? msg.content} isMe={isMe} />
                  ) : msg.contentType === "file" ? (
                    <div className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 rounded-2xl border
                      ${isMe ? "bg-[#7269ef] border-[#6055d8]" : "bg-[#2e3547] border-[#323a4d]"}`}>
                      <div className="w-8 h-8 bg-green-500/20 rounded flex items-center justify-center shrink-0">
                        <span className="text-green-400 text-xs">📄</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-medium truncate ${isMe ? "text-white" : "text-[#a3aed0]"}`}>{msg.fileName ?? msg.content}</p>
                        {msg.fileSize && <p className={`text-xs ${isMe ? "text-white/70" : "text-[#6b7280]"}`}>{msg.fileSize} bytes</p>}
                      </div>
                      <button className={`hover:opacity-80 ${isMe ? "text-white" : "text-[#6b7280]"}`}><RiDownloadLine size={16} /></button>
                    </div>
                  ) : (
                    <div className={`px-3 sm:px-4 py-2.5 rounded-2xl text-sm leading-relaxed
                      ${isMe ? "bg-[#7269ef] text-white rounded-br-sm" : "bg-[#2e3547] text-[#a3aed0] rounded-bl-sm"}`}>
                      {msg.content}
                    </div>
                  )}
                  {/* Reaction chips */}
                  {Object.keys(reactionGroups).length > 0 && (
                    <div className={`flex flex-wrap gap-1 mt-0.5 ${isMe ? "justify-end" : "justify-start"}`}>
                      {Object.entries(reactionGroups).map(([emoji, { count, mine }]) => (
                        <button
                          key={emoji}
                          onClick={() => handleReact(msg._id, emoji)}
                          className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs border transition-colors
                            ${mine
                              ? "bg-[#7269ef]/20 border-[#7269ef]/60 text-[#7269ef]"
                              : "bg-[#323a4d] border-[#3d4554] text-[#a3aed0] hover:border-[#7269ef]/40"}`}
                        >
                          <span>{emoji}</span>
                          {count > 1 && <span className="text-[10px]">{count}</span>}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className={`flex items-center gap-1.5 text-[10px] text-[#6b7280] ${isMe ? "flex-row-reverse" : ""}`}>
                    {isMe && !msg.isDeleted && (
                      msg.readBy.some((id) => id !== currentUser?.userId)
                        ? <span className="text-[#7269ef]" title="Seen">✓✓</span>
                        : <span className="text-[#6b7280]" title="Delivered">✓✓</span>
                    )}
                    <span>{formatTime(msg.createdAt)}</span>
                    {!isMe && <span className="text-[#6b7280] hidden sm:inline">{msg.sender.fullName}</span>}
                    {!msg.isDeleted && (msg.likes?.length ?? 0) > 0 && (
                      <span className="flex items-center gap-0.5 text-yellow-400">
                        👍 {msg.likes.length > 1 ? msg.likes.length : ""}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action buttons + emoji picker */}
                <div className="opacity-0 group-hover:opacity-100 mb-6 hidden sm:flex flex-col gap-1 relative">
                  {!msg.isDeleted && (
                    <div className="relative">
                      <button
                        onClick={() => setEmojiPickerFor(emojiPickerFor === msg._id ? null : msg._id)}
                        className="text-[#6b7280] hover:text-[#a3aed0]"
                        title="React"
                      >
                        <RiEmotionLine size={14} />
                      </button>
                      {/* Quick emoji picker */}
                      {emojiPickerFor === msg._id && (
                        <div className={`absolute bottom-full mb-1 z-20 bg-[#2a3042] border border-[#323a4d] rounded-xl px-2 py-1.5 flex gap-1 shadow-xl
                          ${isMe ? "right-0" : "left-0"}`}>
                          {["❤️","😂","😮","😢","😡","👍","🔥","🎉"].map((e) => (
                            <button
                              key={e}
                              onClick={() => { handleReact(msg._id, e); setEmojiPickerFor(null); }}
                              className="text-lg hover:scale-125 transition-transform leading-none"
                            >
                              {e}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {!msg.isDeleted && (
                    <button
                      onClick={() => handleToggleBookmark(msg._id)}
                      className={`${bookmarkedIds.has(msg._id) ? "text-[#7269ef]" : "text-[#6b7280] hover:text-[#7269ef]"}`}
                      title="Bookmark"
                    >
                      {bookmarkedIds.has(msg._id) ? <RiBookmarkFill size={14} /> : <RiBookmarkLine size={14} />}
                    </button>
                  )}
                  {isMe && !msg.isDeleted && (
                    <button
                      onClick={() => handleDelete(msg._id)}
                      className="text-[#6b7280] hover:text-red-400"
                      title="Delete"
                    >
                      <RiDeleteBinLine size={14} />
                    </button>
                  )}
                  {!isMe && !msg.isDeleted && (
                    <button
                      onClick={() => handleLike(msg._id)}
                      className={`${(msg.likes ?? []).includes(currentUser?.userId ?? "") ? "text-yellow-400" : "text-[#6b7280] hover:text-yellow-400"}`}
                      title="Like"
                    >
                      <RiThumbUpLine size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Pending upload bubbles (image & voice) */}
          {msgState.pending.map((p) => (
            <div key={p.tempId} className="flex items-end gap-2 flex-row-reverse">
              <Avatar
                initials={(currentUser?.fullName ?? "Me").slice(0, 2).toUpperCase()}
                name={currentUser?.fullName ?? "Me"}
                size="xs"
                className="mb-4 shrink-0"
                src={currentUser?.avatar ?? undefined}
              />
              <div className="flex flex-col gap-1 max-w-[75%] sm:max-w-xs items-end">
                {p.kind === "image" ? (
                  <div className="rounded-2xl rounded-br-sm overflow-hidden relative">
                    <img src={p.localUrl} alt="uploading" className="max-w-[220px] sm:max-w-xs max-h-64 object-cover block opacity-50" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 px-4 gap-1.5">
                      <div className="w-full">
                        <div className="flex justify-between text-[10px] text-white/90 mb-1">
                          <span>Uploading…</span><span>{p.progress}%</span>
                        </div>
                        <div className="h-1 bg-white/30 rounded-full overflow-hidden">
                          <div className="h-full bg-white rounded-full transition-all duration-150" style={{ width: `${p.progress}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 px-4 py-3 bg-[#7269ef]/80 rounded-2xl rounded-br-sm min-w-[180px]">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                      <RiMicLine size={16} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex gap-0.5 items-end h-5 mb-1">
                        {Array.from({ length: 18 }).map((_, i) => (
                          <span key={i} className="w-0.5 bg-white/50 rounded-full animate-pulse" style={{ height: `${30 + Math.sin(i * 0.8) * 50}%`, animationDelay: `${i * 60}ms` }} />
                        ))}
                      </div>
                      <div className="h-0.5 bg-white/20 rounded-full overflow-hidden">
                        <div className="h-full bg-white/70 rounded-full transition-all duration-150" style={{ width: `${p.progress}%` }} />
                      </div>
                    </div>
                    <span className="text-[10px] text-white/70 shrink-0">{p.durationSec !== undefined ? formatDuration(p.durationSec) : "…"}</span>
                  </div>
                )}
                <div className="flex items-center gap-1 text-[10px] text-[#6b7280] flex-row-reverse">
                  <span title="Sending…">⏳</span>
                </div>
              </div>
            </div>
          ))}

          <div ref={messagesEndRef} />
        </div>

        {/* Typing indicator */}
        {someoneTyping && (
          <div className="px-4 pb-1 flex items-center gap-2">
            <div className="flex gap-0.5 items-end h-4">
              <span className="w-1.5 h-1.5 bg-[#7269ef] rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 bg-[#7269ef] rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 bg-[#7269ef] rounded-full animate-bounce [animation-delay:300ms]" />
            </div>
            <span className="text-[11px] text-[#6b7280]">{contactName} is typing…</span>
          </div>
        )}

        {/* Emoji panel — sits above input bar */}
        {showInputEmoji && (
          <div className="bg-[#2a3042] border-t border-[#323a4d] px-3 py-2 w-full">
            {[
              ["😀","😂","🤣","😍","🥰","😘","😎","🤩","🥳","😅","😇","🤭"],
              ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","💯","🔥","✨","⚡"],
              ["👍","👎","👏","🙌","🤝","👋","🤞","✌️","🤙","💪","🫶","🙏"],
              ["😭","😢","😤","😠","😡","🤬","😱","😨","😰","😓","🤔","🤯"],
              ["🎉","🎊","🎈","🎁","🏆","🥇","⭐","🌟","💎","🚀","🌈","🎶"],
              ["🍕","🍔","🍟","🌮","🍜","🍣","🍩","🍪","🎂","☕","🧋","🍺"],
            ].map((row, ri) => (
              <div key={ri} className="flex w-full mb-1">
                {row.map((emoji) => (
                  <button
                    key={emoji}
                    className="flex-1 text-xl hover:scale-125 transition-transform leading-none h-8 flex items-center justify-center rounded hover:bg-[#323a4d]"
                    onClick={() => {
                      const cur = message;
                      const el = inputRef.current;
                      const pos = el?.selectionStart ?? cur.length;
                      const next = cur.slice(0, pos) + emoji + cur.slice(pos);
                      setMessage(next);
                      // restore cursor after emoji
                      requestAnimationFrame(() => {
                        el?.focus();
                        el?.setSelectionRange(pos + emoji.length, pos + emoji.length);
                      });
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="bg-[#2a3042] border-t border-[#323a4d] px-3 sm:px-4 py-2.5 sm:py-3 flex items-center gap-2 sm:gap-3 shrink-0 mb-14 sm:mb-0">
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

          {isRecording ? (
            /* ── Recording bar ── */
            <>
              <button
                onClick={() => stopRecording(false)}
                className="text-red-400 hover:text-red-300 shrink-0"
                title="Cancel"
              >
                <RiCloseLine size={22} />
              </button>
              <div className="flex-1 flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
                <div className="flex gap-0.5 items-end h-5 flex-1 overflow-hidden">
                  {Array.from({ length: 28 }).map((_, i) => (
                    <span key={i} className="w-0.5 bg-[#7269ef] rounded-full animate-pulse"
                      style={{ height: `${30 + Math.abs(Math.sin(i * 0.6 + recordingSeconds)) * 70}%`, animationDelay: `${i * 40}ms` }} />
                  ))}
                </div>
                <span className="text-sm text-red-400 font-mono shrink-0">{formatDuration(recordingSeconds)}</span>
              </div>
              <button
                onClick={() => stopRecording(true)}
                className="w-9 h-9 bg-[#7269ef] rounded-full flex items-center justify-center text-white hover:bg-[#6055d8] shrink-0"
                title="Send voice"
              >
                <RiStopCircleLine size={18} />
              </button>
            </>
          ) : (
            /* ── Normal bar ── */
            <>
              <button className="text-[#6b7280] hover:text-[#a3aed0] shrink-0"><RiMoreLine size={18} /></button>
              <button
                onClick={() => setShowInputEmoji((v) => !v)}
                className={`shrink-0 ${showInputEmoji ? "text-[#7269ef]" : "text-[#6b7280] hover:text-[#a3aed0]"}`}
                title="Emoji"
              >
                <RiEmotionLine size={18} />
              </button>
              <button onClick={() => fileInputRef.current?.click()} className="text-[#6b7280] hover:text-[#a3aed0] shrink-0" title="Send image">
                <RiImageAddLine size={18} />
              </button>
              <input
                ref={inputRef}
                value={message}
                onChange={(e) => handleMessageChange(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 bg-transparent text-sm text-[#a3aed0] placeholder-[#4b5563] outline-none min-w-0"
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              />
              {message.trim() ? (
                <button
                  onClick={handleSend}
                  disabled={isSending}
                  className="w-9 h-9 bg-[#7269ef] rounded-full flex items-center justify-center text-white hover:bg-[#6055d8] shrink-0 disabled:opacity-50"
                >
                  <RiSendPlaneFill size={16} />
                </button>
              ) : (
                <button
                  onClick={startRecording}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-[#6b7280] hover:text-[#7269ef] hover:bg-[#7269ef]/10 shrink-0"
                  title="Hold to record"
                >
                  <RiMicLine size={20} />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Image Preview Modal (WhatsApp style) */}
      {imagePreview && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/90">
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 py-3 shrink-0">
            <span className="text-white text-sm font-medium truncate max-w-[60%]">{imagePreview.file.name}</span>
            <button
              onClick={() => { URL.revokeObjectURL(imagePreview.url); setImagePreview(null); setImageCaption(""); }}
              className="text-white/70 hover:text-white p-1"
            >
              <RiCloseLine size={24} />
            </button>
          </div>

          {/* Image */}
          <div className="flex-1 flex items-center justify-center px-4 overflow-hidden">
            <img src={imagePreview.url} alt="preview" className="max-h-full max-w-full object-contain rounded-lg" />
          </div>

          {/* Caption + Send */}
          <div className="shrink-0 px-4 py-3 bg-black/60 flex items-center gap-3">
            <input
              value={imageCaption}
              onChange={(e) => setImageCaption(e.target.value)}
              placeholder="Add a caption…"
              className="flex-1 bg-[#2a3042] text-sm text-[#a3aed0] placeholder-[#4b5563] outline-none px-4 py-2 rounded-full min-w-0"
              onKeyDown={(e) => { if (e.key === "Enter") handleSendImage(); }}
              autoFocus
            />
            <button
              onClick={handleSendImage}
              className="w-10 h-10 bg-[#7269ef] rounded-full flex items-center justify-center text-white hover:bg-[#6055d8] shrink-0"
            >
              <RiSendPlaneFill size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white"
            onClick={() => setLightboxUrl(null)}
          >
            <RiCloseLine size={28} />
          </button>
          <button
            className="absolute top-4 left-4 text-white/70 hover:text-white"
            onClick={(e) => { e.stopPropagation(); window.open(lightboxUrl, "_blank"); }}
            title="Open original"
          >
            <RiZoomInLine size={24} />
          </button>
          <img
            src={lightboxUrl}
            alt="full"
            className="max-h-screen max-w-screen object-contain p-4"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {showInfo && (
        <UserInfoPanel
          userId={conv?.friend?._id ?? ""}
          name={contactName}
          avatar={contactAvatar}
          online={isOnline}
          onClose={() => setShowInfo(false)}
        />
      )}

      {/* Audio Call Modal */}
      {showAudioCall && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 p-4">
          <div className="w-full max-w-xs bg-[#2a3042] rounded-xl overflow-hidden shadow-2xl">
            <div className="p-6 sm:p-8 flex flex-col items-center gap-4">
              <Avatar initials={contactName.slice(0, 2).toUpperCase()} name={contactName} size="xl" online src={contactAvatar} />
              <div className="flex gap-6 sm:gap-8 mt-2">
                {[{ icon: RiMicOffLine, label: "Mute" }, { icon: RiVolumeUpLine, label: "Speaker" }, { icon: RiUserAddLine, label: "Add New" }].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex flex-col items-center gap-1">
                    <button className="w-10 h-10 bg-[#3d4554] rounded-full flex items-center justify-center text-[#a3aed0] hover:bg-[#4b5563]"><Icon size={18} /></button>
                    <span className="text-[10px] text-[#6b7280] uppercase">{label}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => setShowAudioCall(false)} className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 mt-2">
                <RiPhoneLine size={22} className="rotate-135" />
              </button>
            </div>
            <div className="bg-[#7269ef]/20 py-3 text-center">
              <span className="text-white font-semibold text-sm">{contactName}</span>
            </div>
          </div>
        </div>
      )}

      {/* Video Call Modal */}
      {showVideoCall && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 p-4">
          <div className="w-full max-w-sm bg-[#2a3042] rounded-xl overflow-hidden shadow-2xl">
            <div className="relative">
              <div className="w-full h-56 sm:h-64 bg-[#1a2035] flex items-center justify-center">
                <Avatar initials={contactName.slice(0, 2).toUpperCase()} name={contactName} size="xl" src={contactAvatar} />
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-end pb-4 gap-3">
                <div className="flex gap-3 sm:gap-4">
                  {[RiMicOffLine, RiVolumeUpLine, RiVideoLine, RiUserAddLine].map((Icon, i) => (
                    <button key={i} className="w-9 h-9 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70">
                      <Icon size={16} />
                    </button>
                  ))}
                </div>
                <button onClick={() => setShowVideoCall(false)} className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600">
                  <RiPhoneLine size={22} className="rotate-135" />
                </button>
              </div>
            </div>
            <div className="bg-green-600 py-3 text-center">
              <span className="text-white font-semibold text-sm">{contactName}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
