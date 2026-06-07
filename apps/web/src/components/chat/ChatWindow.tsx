import { useState, useRef, useCallback, useEffect } from "react";
import {
  RiMicLine, RiPhoneLine,
  RiCloseLine, RiZoomInLine,
  RiSendPlaneFill,
} from "react-icons/ri";
import Avatar from "./Avatar";
import UserInfoPanel from "./UserInfoPanel";
import ChatHeader from "./ChatHeader";
import ChatInput from "./ChatInput";
import MessageBubble from "./MessageBubble";
import { useChatMessages } from "../../hooks/useChatMessages";
import { useChatMedia } from "../../hooks/useChatMedia";
import {
  useGetConversationsQuery,
  useSendMessageMutation,
  useDeleteMessageMutation,
  useLikeMessageMutation,
  useReactToMessageMutation,
  useLazySearchMessagesQuery,

} from "../../api/conversation/conversationApi";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import { startOutgoingCall } from "../../store/slices/callSlice";
import { socket } from "../../socket/socket";
import { toast } from "@repo/ui";
import { useAddBookmarkMutation, useRemoveBookmarkMutation, useGetBookmarksQuery } from "../../api/bookmark/bookmarkApi";

interface ChatWindowProps {
  contactId: string;
  onBack?: () => void;
}

export default function ChatWindow({ contactId, onBack }: ChatWindowProps) {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((s) => s.auth.user);

  // ── UI state ─────────────────────────────────────────────────────────────────
  const [message, setMessage] = useState("");
  const [showInfo, setShowInfo] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [emojiPickerFor, setEmojiPickerFor] = useState<string | null>(null);
  const [showInputEmoji, setShowInputEmoji] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const msgRefsMap = useRef<Map<string, HTMLDivElement>>(new Map());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Data hooks ───────────────────────────────────────────────────────────────
  const { data: conversations = [] } = useGetConversationsQuery();
  const conv = conversations.find((c) => String(c.conversationId) === contactId);
  const contactName = conv?.isGroup ? (conv.groupName ?? "Group") : (conv?.friend?.fullName ?? "...");
  const contactAvatar = !conv?.isGroup ? (conv?.friend?.avatar ?? null) : null;
  const contactStatus = !conv?.isGroup ? conv?.friend?.status : undefined;
  const isOnline = contactStatus === "online";

  const [sendMessage, { isLoading: isSending }] = useSendMessageMutation();
  const [deleteMessage] = useDeleteMessageMutation();
  const [likeMessage] = useLikeMessageMutation();
  const [reactToMessage] = useReactToMessageMutation();
  const [fetchSearch, { data: searchResults = [], isFetching: isSearching }] = useLazySearchMessagesQuery();
  const [addBookmark] = useAddBookmarkMutation();
  const [removeBookmark] = useRemoveBookmarkMutation();
  const { data: bookmarks = [] } = useGetBookmarksQuery();
  const bookmarkedIds = new Set(bookmarks.map((b) => b.messageId));

  // ── Message state + socket ───────────────────────────────────────────────────
  const { msgState, dispatchMsg, scrollContainerRef, handleScroll, someoneTyping } =
    useChatMessages(contactId, messagesEndRef);

  // ── Media (image + voice) ────────────────────────────────────────────────────
  const {
    imagePreview, setImagePreview, imageCaption, setImageCaption,
    isRecording, recordingSeconds, fileInputRef,
    handleFileChange, handleSendImage, startRecording, stopRecording,
  } = useChatMedia(contactId, dispatchMsg, messagesEndRef);

  // ── Typing indicator ─────────────────────────────────────────────────────────
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

  useEffect(() => {
    return () => {
      emitTypingStop();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [contactId, emitTypingStop]);

  // ── Send text ────────────────────────────────────────────────────────────────
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

  // ── Message actions ──────────────────────────────────────────────────────────
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
      if (bookmarkedIds.has(messageId)) await removeBookmark(messageId).unwrap();
      else await addBookmark(messageId).unwrap();
    } catch {
      toast.error("Failed to update bookmark", "Chat");
    }
  };

  // ── Emoji insert at cursor ───────────────────────────────────────────────────
  const handleEmojiInsert = useCallback((emoji: string) => {
    const el = inputRef.current;
    const pos = el?.selectionStart ?? message.length;
    const next = message.slice(0, pos) + emoji + message.slice(pos);
    setMessage(next);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(pos + emoji.length, pos + emoji.length);
    });
  }, [message]);

  // ── Search ───────────────────────────────────────────────────────────────────
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

  // ── Calls ────────────────────────────────────────────────────────────────────
  const initiateCall = useCallback((callType: "audio" | "video") => {
    if (!conv?.friend?._id) return;
    dispatch(startOutgoingCall({
      conversationId: contactId,
      peerId: conv.friend._id,
      peerName: contactName,
      peerAvatar: contactAvatar,
      peerOnline: isOnline,
      callType,
    }));
    socket.emit("call:initiate", {
      conversationId: contactId,
      to: conv.friend._id,
      from: currentUser?.userId,
      callerName: currentUser?.fullName ?? "",
      callerAvatar: currentUser?.avatar ?? null,
      callType,
    });
  }, [conv, contactId, contactName, contactAvatar, isOnline, currentUser, dispatch]);

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const formatDuration = (sec: number) =>
    `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        <ChatHeader
          contactName={contactName}
          contactAvatar={contactAvatar}
          isOnline={isOnline}
          contactStatus={contactStatus}
          showInfo={showInfo}
          showSearch={showSearch}
          searchQuery={searchQuery}
          isSearching={isSearching}
          searchResults={searchResults}
          searchInputRef={searchInputRef}
          onBack={onBack}
          onToggleInfo={() => setShowInfo((v) => !v)}
          onToggleSearch={handleToggleSearch}
          onSearchChange={handleSearchChange}
          onScrollToMessage={handleScrollToMessage}
          onAudioCall={() => initiateCall("audio")}
          onVideoCall={() => initiateCall("video")}
          formatTime={formatTime}
        />

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

          {msgState.messages.map((msg) => (
            <MessageBubble
              key={msg._id}
              msg={msg}
              isMe={msg.sender._id === currentUser?.userId}
              currentUserId={currentUser?.userId ?? ""}
              bookmarked={bookmarkedIds.has(msg._id)}
              emojiPickerOpen={emojiPickerFor === msg._id}
              formatTime={formatTime}
              onReact={handleReact}
              onLike={handleLike}
              onDelete={handleDelete}
              onToggleBookmark={handleToggleBookmark}
              onOpenLightbox={setLightboxUrl}
              onToggleEmojiPicker={setEmojiPickerFor}
              msgRef={(el) => { if (el) msgRefsMap.current.set(msg._id, el); else msgRefsMap.current.delete(msg._id); }}
            />
          ))}

          {/* Pending upload bubbles */}
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
                    <img src={p.localUrl} alt="uploading" className="max-w-55 sm:max-w-xs max-h-64 object-cover block opacity-50" />
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
                  <div className="flex items-center gap-3 px-4 py-3 bg-[#7269ef]/80 rounded-2xl rounded-br-sm min-w-45">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                      <RiMicLine size={16} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex gap-0.5 items-end h-5 mb-1">
                        {Array.from({ length: 18 }).map((_, i) => (
                          <span key={i} className="w-0.5 bg-white/50 rounded-full animate-pulse"
                            style={{ height: `${30 + Math.sin(i * 0.8) * 50}%`, animationDelay: `${i * 60}ms` }} />
                        ))}
                      </div>
                      <div className="h-0.5 bg-white/20 rounded-full overflow-hidden">
                        <div className="h-full bg-white/70 rounded-full transition-all duration-150" style={{ width: `${p.progress}%` }} />
                      </div>
                    </div>
                    <span className="text-[10px] text-white/70 shrink-0">
                      {p.durationSec !== undefined ? formatDuration(p.durationSec) : "…"}
                    </span>
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

        <ChatInput
          message={message}
          isSending={isSending}
          isRecording={isRecording}
          recordingSeconds={recordingSeconds}
          showInputEmoji={showInputEmoji}
          inputRef={inputRef}
          fileInputRef={fileInputRef}
          onMessageChange={handleMessageChange}
          onSend={handleSend}
          onStartRecording={startRecording}
          onStopRecording={stopRecording}
          onToggleEmoji={() => setShowInputEmoji((v) => !v)}
          onFileChange={handleFileChange}
          onEmojiInsert={handleEmojiInsert}
        />
      </div>

      {/* Image Preview Modal */}
      {imagePreview && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/90">
          <div className="flex items-center justify-between px-4 py-3 shrink-0">
            <span className="text-white text-sm font-medium truncate max-w-[60%]">{imagePreview.file.name}</span>
            <button
              onClick={() => { URL.revokeObjectURL(imagePreview.url); setImagePreview(null); setImageCaption(""); }}
              className="text-white/70 hover:text-white p-1"
            >
              <RiCloseLine size={24} />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center px-4 overflow-hidden">
            <img src={imagePreview.url} alt="preview" className="max-h-full max-w-full object-contain rounded-lg" />
          </div>
          <div className="shrink-0 px-4 py-3 bg-black/60 flex items-center gap-3">
            <input
              value={imageCaption}
              onChange={(e) => setImageCaption(e.target.value)}
              placeholder="Add a caption…"
              className="flex-1 bg-[#2a3042] text-sm text-[#a3aed0] placeholder-[#4b5563] outline-none px-4 py-2 rounded-full min-w-0"
              onKeyDown={(e) => { if (e.key === "Enter") handleSendImage(); }}
              autoFocus
            />
            <button onClick={handleSendImage} className="w-10 h-10 bg-[#7269ef] rounded-full flex items-center justify-center text-white hover:bg-[#6055d8] shrink-0">
              <RiSendPlaneFill size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95" onClick={() => setLightboxUrl(null)}>
          <button className="absolute top-4 right-4 text-white/70 hover:text-white" onClick={() => setLightboxUrl(null)}>
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


    </div>
  );
}
