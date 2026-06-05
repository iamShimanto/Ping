import { useState } from "react";
import {
  RiSearchLine, RiPhoneLine, RiVideoLine, RiInformationLine,
  RiMoreLine, RiEmotionLine, RiMicLine, RiSendPlaneFill, RiAddLine,
  RiDownloadLine, RiThumbUpLine, RiMicOffLine, RiVolumeUpLine, RiUserAddLine,
  RiArrowLeftLine,
} from "react-icons/ri";
import Avatar from "./Avatar";
import { mockMessages, favourites, directMessages } from "../../pages/chat/data/mockData";
import UserInfoPanel from "./UserInfoPanel";

const allContacts = [...favourites, ...directMessages];

interface ChatWindowProps {
  contactId: string;
  onBack?: () => void;
}

export default function ChatWindow({ contactId, onBack }: ChatWindowProps) {
  const [message, setMessage] = useState("");
  const [showInfo, setShowInfo] = useState(false);
  const [showAudioCall, setShowAudioCall] = useState(false);
  const [showVideoCall, setShowVideoCall] = useState(false);

  const contact = allContacts.find((c) => c.id === contactId) || allContacts[0];

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Main chat area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Header */}
        <div className="h-14 bg-[#2a3042] border-b border-[#323a4d] flex items-center px-3 sm:px-4 gap-2 sm:gap-3 flex-shrink-0">
          {/* Back button — mobile only */}
          {onBack && (
            <button
              onClick={onBack}
              className="sm:hidden text-[#6b7280] hover:text-[#a3aed0] p-1 -ml-1 flex-shrink-0"
            >
              <RiArrowLeftLine size={20} />
            </button>
          )}
          <Avatar initials={contact.initials} name={contact.name} size="sm" online={contact.online} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white leading-tight truncate">{contact.name}</p>
            <p className="text-xs text-green-400">{contact.online ? "Active" : "Offline"}</p>
          </div>
          {/* Action icons — hide some on very small screens */}
          <div className="flex items-center gap-2 sm:gap-3 text-[#6b7280] flex-shrink-0">
            <button className="hidden sm:block hover:text-[#a3aed0]"><RiSearchLine size={18} /></button>
            <button
              onClick={() => { setShowAudioCall(true); setShowVideoCall(false); }}
              className="hover:text-[#a3aed0]"
            >
              <RiPhoneLine size={18} />
            </button>
            <button
              onClick={() => { setShowVideoCall(true); setShowAudioCall(false); }}
              className="hidden xs:block hover:text-[#a3aed0]"
            >
              <RiVideoLine size={18} />
            </button>
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="hover:text-[#a3aed0]"
            >
              <RiInformationLine size={18} />
            </button>
            <button className="hover:text-[#a3aed0]"><RiMoreLine size={18} /></button>
          </div>
        </div>

        {/* Pinned bar */}
        <div className="bg-[#2e3547] border-b border-[#323a4d] px-3 sm:px-4 py-2 flex items-center gap-2 flex-shrink-0">
          <span className="text-yellow-400 text-xs">📌</span>
          <span className="text-xs text-[#a3aed0]">10 Pinned</span>
          <button className="w-5 h-5 bg-[#323a4d] rounded flex items-center justify-center text-[#6b7280] hover:text-white ml-1">
            <RiAddLine size={12} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 chat-bg flex flex-col gap-3 sm:gap-4 pb-4">
          {mockMessages.map((msg) => {
            const isMe = msg.senderId === "me";
            return (
              <div key={msg.id} className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                {!isMe && (
                  <Avatar
                    initials={contact.initials}
                    name={contact.name}
                    size="xs"
                    className="mb-4 flex-shrink-0"
                  />
                )}
                <div className={`flex flex-col gap-1 max-w-[75%] sm:max-w-xs ${isMe ? "items-end" : "items-start"}`}>
                  {msg.type === "text" && (
                    <div className={`px-3 sm:px-4 py-2.5 rounded-2xl text-sm leading-relaxed
                      ${isMe
                        ? "bg-[#7269ef] text-white rounded-br-sm"
                        : "bg-[#2e3547] text-[#a3aed0] rounded-bl-sm"}`}>
                      {msg.content}
                    </div>
                  )}
                  {msg.type === "images" && (
                    <div className="flex gap-2 flex-wrap">
                      {[1, 2].map((i) => (
                        <div key={i} className="relative">
                          <div className="w-28 h-20 sm:w-32 sm:h-24 bg-[#374151] rounded-lg overflow-hidden">
                            <img
                              src={`https://picsum.photos/128/96?random=${i}`}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <button className="absolute bottom-1 right-1 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center text-white">
                            <RiMoreLine size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {msg.type === "file" && (
                    <div className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 rounded-2xl border
                      ${isMe ? "bg-[#7269ef] border-[#6055d8]" : "bg-[#2e3547] border-[#323a4d]"}`}>
                      <div className="w-8 h-8 bg-green-500/20 rounded flex items-center justify-center flex-shrink-0">
                        <span className="text-green-400 text-xs">📄</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-medium truncate ${isMe ? "text-white" : "text-[#a3aed0]"}`}>
                          {msg.content}
                        </p>
                        <p className={`text-xs ${isMe ? "text-white/70" : "text-[#6b7280]"}`}>
                          {msg.fileSize}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button className={`hover:opacity-80 ${isMe ? "text-white" : "text-[#6b7280]"}`}>
                          <RiDownloadLine size={16} />
                        </button>
                        <button className={`hover:opacity-80 ${isMe ? "text-white" : "text-[#6b7280]"}`}>
                          <RiMoreLine size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                  <div className={`flex items-center gap-1.5 text-[10px] text-[#6b7280] ${isMe ? "flex-row-reverse" : ""}`}>
                    {isMe && <span className="text-[#7269ef]">✓✓</span>}
                    <span>{msg.time}</span>
                    {isMe && <span className="text-[#6b7280]">You</span>}
                    {!isMe && <span className="text-[#6b7280] hidden sm:inline">{contact.name}</span>}
                  </div>
                </div>
                {!isMe && (
                  <button className="opacity-0 hover:opacity-100 text-[#6b7280] hover:text-[#a3aed0] mb-4 hidden sm:block">
                    <RiThumbUpLine size={14} />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Input */}
        <div className="bg-[#2a3042] border-t border-[#323a4d] px-3 sm:px-4 py-2.5 sm:py-3 flex items-center gap-2 sm:gap-3 flex-shrink-0 mb-14 sm:mb-0">
          <button className="text-[#6b7280] hover:text-[#a3aed0] flex-shrink-0">
            <RiMoreLine size={18} />
          </button>
          <button className="text-[#6b7280] hover:text-[#a3aed0] flex-shrink-0">
            <RiEmotionLine size={18} />
          </button>
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-transparent text-sm text-[#a3aed0] placeholder-[#4b5563] outline-none min-w-0"
            onKeyDown={(e) => e.key === "Enter" && setMessage("")}
          />
          <button className="text-[#6b7280] hover:text-[#a3aed0] flex-shrink-0 hidden sm:block">
            <RiMicLine size={18} />
          </button>
          <button
            onClick={() => setMessage("")}
            className="w-9 h-9 bg-[#7269ef] rounded-full flex items-center justify-center text-white hover:bg-[#6055d8] flex-shrink-0"
          >
            <RiSendPlaneFill size={16} />
          </button>
        </div>
      </div>

      {/* User info panel — slides in from right */}
      {showInfo && (
        <UserInfoPanel contact={contact} onClose={() => setShowInfo(false)} />
      )}

      {/* Audio Call Modal */}
      {showAudioCall && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 p-4">
          <div className="w-full max-w-xs bg-[#2a3042] rounded-xl overflow-hidden shadow-2xl">
            <div className="p-6 sm:p-8 flex flex-col items-center gap-4">
              <Avatar initials={contact.initials} name={contact.name} size="xl" online />
              <div className="flex gap-6 sm:gap-8 mt-2">
                {[
                  { icon: RiMicOffLine, label: "Mute" },
                  { icon: RiVolumeUpLine, label: "Speaker" },
                  { icon: RiUserAddLine, label: "Add New" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex flex-col items-center gap-1">
                    <button className="w-10 h-10 bg-[#3d4554] rounded-full flex items-center justify-center text-[#a3aed0] hover:bg-[#4b5563]">
                      <Icon size={18} />
                    </button>
                    <span className="text-[10px] text-[#6b7280] uppercase">{label}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setShowAudioCall(false)}
                className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 mt-2"
              >
                <RiPhoneLine size={22} className="rotate-[135deg]" />
              </button>
            </div>
            <div className="bg-[#7269ef]/20 py-3 text-center">
              <span className="text-white font-semibold text-sm">{contact.name}</span>
            </div>
          </div>
        </div>
      )}

      {/* Video Call Modal */}
      {showVideoCall && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 p-4">
          <div className="w-full max-w-sm bg-[#2a3042] rounded-xl overflow-hidden shadow-2xl">
            <div className="relative">
              <img
                src="https://picsum.photos/384/280?random=99"
                alt=""
                className="w-full h-56 sm:h-64 object-cover"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-end pb-4 gap-3">
                <div className="flex gap-3 sm:gap-4">
                  {[RiMicOffLine, RiVolumeUpLine, RiVideoLine, RiUserAddLine].map((Icon, i) => (
                    <button
                      key={i}
                      className="w-9 h-9 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70"
                    >
                      <Icon size={16} />
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setShowVideoCall(false)}
                  className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600"
                >
                  <RiPhoneLine size={22} className="rotate-[135deg]" />
                </button>
              </div>
            </div>
            <div className="bg-green-600 py-3 text-center">
              <span className="text-white font-semibold text-sm">{contact.name}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
