import { useState } from "react";
import { RiSearchLine, RiAddLine } from "react-icons/ri";
import Avatar from "./Avatar";
import { useGetConversationsQuery, useAddNewFriendMutation, type Conversation } from "../../api/conversation/conversationApi";
import { toast } from "@repo/ui";

interface ChatsPanelProps {
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function AddFriendModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [addNewFriend, { isLoading }] = useAddNewFriendMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    try {
      await addNewFriend({ email: email.trim() }).unwrap();
      toast.success("Friend added!", "Chats");
      onClose();
    } catch (err) {
      const msg = (err as { data?: { message?: string } })?.data?.message;
      toast.error(msg ?? "Failed to add friend", "Chats");
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 p-4" onClick={onClose}>
      <div className="bg-[#2a3042] rounded-xl p-5 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-white font-semibold text-sm mb-4">Add New Friend</h3>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email address..."
            type="email"
            className="bg-[#323a4d] rounded-md px-3 py-2 text-sm text-[#a3aed0] placeholder-[#6b7280] outline-none"
          />
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onClose} className="px-3 py-1.5 text-xs text-[#a3aed0] hover:text-white">Cancel</button>
            <button type="submit" disabled={isLoading} className="px-4 py-1.5 bg-[#7269ef] text-white text-xs rounded hover:bg-[#6055d8] disabled:opacity-50">
              {isLoading ? "Adding..." : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ChatsPanel({ selectedId, onSelect }: ChatsPanelProps) {
  const [search, setSearch] = useState("");
  const [showAddFriend, setShowAddFriend] = useState(false);
  const { data: conversations = [], isLoading } = useGetConversationsQuery();

  const getDisplayName = (conv: Conversation) =>
    conv.isGroup ? (conv.groupName ?? "Group") : (conv.friend?.fullName ?? "Unknown");

  const getInitials = (name: string) =>
    name.slice(0, 2).toUpperCase();

  const getStatus = (conv: Conversation) =>
    !conv.isGroup ? conv.friend?.status : undefined;

  const filtered = conversations.filter((c) =>
    getDisplayName(c).toLowerCase().includes(search.toLowerCase())
  );

  const directConvs = filtered.filter((c) => !c.isGroup);
  const groupConvs = filtered.filter((c) => c.isGroup);

  return (
    <>
      <div className="w-full sm:w-[300px] bg-[#2a3042] flex flex-col h-full border-r border-[#323a4d] flex-shrink-0">
        {/* Header */}
        <div className="px-4 sm:px-5 pt-4 sm:pt-5 pb-3 flex items-center justify-between">
          <h2 className="text-white font-semibold text-base">Chats</h2>
          <button
            onClick={() => setShowAddFriend(true)}
            className="w-7 h-7 bg-[#7269ef] rounded flex items-center justify-center text-white hover:bg-[#6055d8]"
          >
            <RiAddLine size={16} />
          </button>
        </div>

        {/* Search */}
        <div className="px-3 sm:px-4 pb-3">
          <div className="flex items-center bg-[#323a4d] rounded-md px-3 py-2 gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search here.."
              className="flex-1 bg-transparent text-sm text-[#a3aed0] placeholder-[#6b7280] outline-none min-w-0"
            />
            <RiSearchLine size={16} className="text-[#6b7280] flex-shrink-0" />
          </div>
        </div>

        {/* Lists */}
        <div className="flex-1 overflow-y-auto pb-16 sm:pb-0">
          {isLoading && (
            <div className="px-5 py-4 text-xs text-[#6b7280]">Loading chats...</div>
          )}

          {/* Direct Messages */}
          {directConvs.length > 0 && (
            <div className="px-4 sm:px-5 pb-1">
              <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-widest mb-2">Direct Messages</p>
              {directConvs.map((conv) => {
                const name = getDisplayName(conv);
                const status = getStatus(conv);
                const isOnline = status === "online";
                const convId = String(conv.conversationId);
                return (
                  <button
                    key={convId}
                    onClick={() => onSelect(convId)}
                    className={`w-full flex items-center gap-3 px-2 py-2.5 sm:py-2 rounded-lg transition-colors text-left
                      ${selectedId === convId ? "bg-[#7269ef]" : "hover:bg-[#323a4d] active:bg-[#323a4d]"}`}
                  >
                    <Avatar
                      initials={getInitials(name)}
                      name={name}
                      size="sm"
                      online={isOnline}
                      src={conv.friend?.avatar ?? undefined}
                    />
                    <div className="flex-1 min-w-0">
                      <span className={`text-sm font-medium truncate block ${selectedId === convId ? "text-white" : "text-[#a3aed0]"}`}>
                        {name}
                      </span>
                      {conv.lastMessage && (
                        <span className="text-xs text-[#6b7280] truncate block">{conv.lastMessage}</span>
                      )}
                    </div>
                    {!!conv.unreadCount && selectedId !== convId && (
                      <span className="shrink-0 min-w-4.5 h-4.5 bg-[#7269ef] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                        {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Groups */}
          {groupConvs.length > 0 && (
            <div className="px-4 sm:px-5 pb-3 mt-3">
              <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-widest mb-2">Groups</p>
              {groupConvs.map((conv) => {
                const name = getDisplayName(conv);
                const convId = String(conv.conversationId);
                return (
                  <button
                    key={convId}
                    onClick={() => onSelect(convId)}
                    className={`w-full flex items-center gap-3 px-2 py-2.5 sm:py-2 rounded-lg transition-colors text-left
                      ${selectedId === convId ? "bg-[#7269ef]" : "hover:bg-[#323a4d] active:bg-[#323a4d]"}`}
                  >
                    <div className="w-8 h-8 rounded-full border-2 border-[#3d4554] flex items-center justify-center shrink-0">
                      <span className={`text-xs font-bold ${selectedId === convId ? "text-white" : "text-[#6b7280]"}`}>#</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className={`text-sm font-medium truncate block ${selectedId === convId ? "text-white" : "text-[#a3aed0]"}`}>
                        {name}
                      </span>
                      {conv.lastMessage && (
                        <span className="text-xs text-[#6b7280] truncate block">{conv.lastMessage}</span>
                      )}
                    </div>
                    {!!conv.unreadCount && selectedId !== convId && (
                      <span className="shrink-0 min-w-4.5 h-4.5 bg-[#7269ef] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                        {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {!isLoading && conversations.length === 0 && (
            <div className="px-5 py-8 text-center">
              <p className="text-xs text-[#6b7280]">No conversations yet.</p>
              <button onClick={() => setShowAddFriend(true)} className="text-xs text-[#7269ef] mt-1 hover:underline">
                Add a friend to start chatting
              </button>
            </div>
          )}
        </div>
      </div>

      {showAddFriend && <AddFriendModal onClose={() => setShowAddFriend(false)} />}
    </>
  );
}
