import { useState, useEffect, useRef } from "react";
import {
  RiSearchLine, RiPhoneLine, RiVideoLine, RiInformationLine,
  RiMoreLine, RiEmotionLine, RiMicLine, RiSendPlaneFill,
  RiDownloadLine, RiThumbUpLine, RiMicOffLine, RiVolumeUpLine, RiUserAddLine,
  RiArrowLeftLine, RiDeleteBinLine,
} from "react-icons/ri";
import Avatar from "./Avatar";
import UserInfoPanel from "./UserInfoPanel";
import {
  useGetConversationsQuery,
  useSendMessageMutation,
  useGetMessagesQuery,
  useDeleteMessageMutation,
  conversationApi,
} from "../../api/conversation/conversationApi";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import { socket } from "../../socket/socket";
import { toast } from "@repo/ui";

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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversations = [] } = useGetConversationsQuery();
  const conv = conversations.find((c) => String(c.conversationId) === contactId);

  const contactName = conv?.isGroup
    ? (conv.groupName ?? "Group")
    : (conv?.friend?.fullName ?? "...");
  const contactAvatar = !conv?.isGroup ? (conv?.friend?.avatar ?? null) : null;
  const contactStatus = !conv?.isGroup ? conv?.friend?.status : undefined;
  const isOnline = contactStatus === "online";

  const { data: messagesData } = useGetMessagesQuery(
    { conversationId: contactId },
    { skip: !contactId }
  );

  const [sendMessage, { isLoading: isSending }] = useSendMessageMutation();
  const [deleteMessage] = useDeleteMessageMutation();

  // Join socket room when conversation opens — server event is "conversation:join"
  useEffect(() => {
    if (!contactId) return;
    socket.emit("conversation:join", contactId);
    return () => {
      socket.emit("conversation:leave", contactId);
    };
  }, [contactId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesData?.messages]);

  const displayMessages = messagesData?.messages ?? [];

  const handleSend = async () => {
    const trimmed = message.trim();
    if (!trimmed || isSending) return;
    setMessage("");
    try {
      const sent = await sendMessage({ conversationId: contactId, content: trimmed }).unwrap();
      // Optimistically add own message to RTK Query cache so it shows immediately
      dispatch(
        conversationApi.util.updateQueryData("getMessages", { conversationId: contactId }, (draft) => {
          const exists = draft.messages.some((m) => m._id === sent._id);
          if (!exists) draft.messages.push(sent);
        })
      );
    } catch {
      toast.error("Failed to send message", "Chat");
      setMessage(trimmed);
    }
  };

  const handleDelete = async (messageId: string) => {
    try {
      await deleteMessage(messageId).unwrap();
      dispatch(
        conversationApi.util.updateQueryData("getMessages", { conversationId: contactId }, (draft) => {
          const msg = draft.messages.find((m) => m._id === messageId);
          if (msg) {
            msg.isDeleted = true;
            msg.content = "This message was deleted";
          }
        })
      );
    } catch {
      toast.error("Failed to delete message", "Chat");
    }
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const fakeContact = {
    id: contactId,
    name: contactName,
    initials: contactName.slice(0, 2).toUpperCase(),
    online: isOnline,
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Header */}
        <div className="h-14 bg-[#2a3042] border-b border-[#323a4d] flex items-center px-3 sm:px-4 gap-2 sm:gap-3 flex-shrink-0">
          {onBack && (
            <button onClick={onBack} className="sm:hidden text-[#6b7280] hover:text-[#a3aed0] p-1 -ml-1 flex-shrink-0">
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
          <div className="flex items-center gap-2 sm:gap-3 text-[#6b7280] flex-shrink-0">
            <button className="hidden sm:block hover:text-[#a3aed0]"><RiSearchLine size={18} /></button>
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

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 chat-bg flex flex-col gap-3 sm:gap-4 pb-4">
          {displayMessages.map((msg) => {
            const isMe = msg.sender._id === currentUser?.userId;
            return (
              <div key={msg._id} className={`flex items-end gap-2 group ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                {!isMe && (
                  <Avatar
                    initials={msg.sender.fullName.slice(0, 2).toUpperCase()}
                    name={msg.sender.fullName}
                    size="xs"
                    className="mb-4 flex-shrink-0"
                    src={msg.sender.avatar ?? undefined}
                  />
                )}
                <div className={`flex flex-col gap-1 max-w-[75%] sm:max-w-xs ${isMe ? "items-end" : "items-start"}`}>
                  {msg.isDeleted ? (
                    <div className={`px-3 sm:px-4 py-2.5 rounded-2xl text-sm italic text-[#6b7280]
                      ${isMe ? "bg-[#3d4554] rounded-br-sm" : "bg-[#2e3547] rounded-bl-sm"}`}>
                      This message was deleted
                    </div>
                  ) : msg.contentType === "file" ? (
                    <div className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 rounded-2xl border
                      ${isMe ? "bg-[#7269ef] border-[#6055d8]" : "bg-[#2e3547] border-[#323a4d]"}`}>
                      <div className="w-8 h-8 bg-green-500/20 rounded flex items-center justify-center flex-shrink-0">
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
                  <div className={`flex items-center gap-1.5 text-[10px] text-[#6b7280] ${isMe ? "flex-row-reverse" : ""}`}>
                    {isMe && <span className="text-[#7269ef]">✓✓</span>}
                    <span>{formatTime(msg.createdAt)}</span>
                    {isMe && <span className="text-[#6b7280]">You</span>}
                    {!isMe && <span className="text-[#6b7280] hidden sm:inline">{msg.sender.fullName}</span>}
                  </div>
                </div>
                {isMe && !msg.isDeleted && (
                  <button
                    onClick={() => handleDelete(msg._id)}
                    className="opacity-0 group-hover:opacity-100 text-[#6b7280] hover:text-red-400 mb-4 hidden sm:block"
                  >
                    <RiDeleteBinLine size={14} />
                  </button>
                )}
                {!isMe && (
                  <button className="opacity-0 group-hover:opacity-100 text-[#6b7280] hover:text-[#a3aed0] mb-4 hidden sm:block">
                    <RiThumbUpLine size={14} />
                  </button>
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="bg-[#2a3042] border-t border-[#323a4d] px-3 sm:px-4 py-2.5 sm:py-3 flex items-center gap-2 sm:gap-3 flex-shrink-0 mb-14 sm:mb-0">
          <button className="text-[#6b7280] hover:text-[#a3aed0] flex-shrink-0"><RiMoreLine size={18} /></button>
          <button className="text-[#6b7280] hover:text-[#a3aed0] flex-shrink-0"><RiEmotionLine size={18} /></button>
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-transparent text-sm text-[#a3aed0] placeholder-[#4b5563] outline-none min-w-0"
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          />
          <button className="text-[#6b7280] hover:text-[#a3aed0] flex-shrink-0 hidden sm:block"><RiMicLine size={18} /></button>
          <button
            onClick={handleSend}
            disabled={isSending || !message.trim()}
            className="w-9 h-9 bg-[#7269ef] rounded-full flex items-center justify-center text-white hover:bg-[#6055d8] flex-shrink-0 disabled:opacity-50"
          >
            <RiSendPlaneFill size={16} />
          </button>
        </div>
      </div>

      {showInfo && <UserInfoPanel contact={fakeContact} onClose={() => setShowInfo(false)} />}

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
                <RiPhoneLine size={22} className="rotate-[135deg]" />
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
                  <RiPhoneLine size={22} className="rotate-[135deg]" />
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
