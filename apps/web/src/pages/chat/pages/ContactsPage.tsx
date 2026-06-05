import { useState } from "react";
import { RiSearchLine, RiAddLine, RiMoreLine, RiMessageLine } from "react-icons/ri";
import Avatar from "../../../components/chat/Avatar";
import WelcomeScreen from "../../../components/chat/WelcomeScreen";
import { useSearchUsersQuery } from "../../../api/user/userApi";
import { useAddNewFriendMutation } from "../../../api/conversation/conversationApi";
import { toast } from "@repo/ui";

export default function ContactsPage() {
  const [search, setSearch] = useState("");
  const [addingId, setAddingId] = useState<string | null>(null);

  const { data: users = [], isFetching } = useSearchUsersQuery(search, {
    skip: search.trim().length < 1,
  });

  const [addNewFriend] = useAddNewFriendMutation();

  const handleAdd = async (email: string, userId: string) => {
    setAddingId(userId);
    try {
      await addNewFriend({ email }).unwrap();
      toast.success("Conversation started!", "Contacts");
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Failed to add", "Contacts");
    } finally {
      setAddingId(null);
    }
  };

  const grouped = users.reduce<Record<string, typeof users>>((acc, u) => {
    const letter = u.fullName[0].toUpperCase();
    if (!acc[letter]) acc[letter] = [];
    acc[letter].push(u);
    return acc;
  }, {});

  const panel = (
    <div className="w-full sm:w-[300px] bg-[#2a3042] flex flex-col h-full border-r border-[#323a4d] shrink-0">
      {/* Header */}
      <div className="px-4 sm:px-5 pt-4 sm:pt-5 pb-3 flex items-center justify-between">
        <h2 className="text-white font-semibold text-base">Contacts</h2>
        <div className="w-7 h-7 bg-[#7269ef] rounded flex items-center justify-center text-white">
          <RiAddLine size={16} />
        </div>
      </div>

      {/* Search */}
      <div className="px-3 sm:px-4 pb-3">
        <div className="flex items-center bg-[#323a4d] rounded-md px-3 py-2 gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users by name or email.."
            className="flex-1 bg-transparent text-sm text-[#a3aed0] placeholder-[#6b7280] outline-none min-w-0"
          />
          <RiSearchLine size={16} className="text-[#6b7280] shrink-0" />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-4 pb-20 sm:pb-4">
        {isFetching && (
          <p className="text-xs text-[#6b7280] px-1 py-2">Searching...</p>
        )}

        {!isFetching && search.trim() && users.length === 0 && (
          <p className="text-xs text-[#6b7280] px-1 py-2">No users found.</p>
        )}

        {!search.trim() && (
          <p className="text-xs text-[#6b7280] px-1 py-2">Type a name or email to search users.</p>
        )}

        {Object.entries(grouped).sort().map(([letter, group]) => (
          <div key={letter} className="mb-2">
            <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-widest px-1 py-1 border-b border-[#323a4d] mb-1">
              {letter}
            </p>
            {group.map((u) => (
              <div key={u._id} className="flex items-center gap-3 px-2 py-2.5 sm:py-2 rounded-lg hover:bg-[#323a4d] active:bg-[#323a4d] group">
                <Avatar
                  initials={u.fullName.slice(0, 2).toUpperCase()}
                  name={u.fullName}
                  size="sm"
                  online={u.status === "online"}
                  src={u.avatar ?? undefined}
                />
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-[#a3aed0] font-medium truncate block">{u.fullName}</span>
                  <span className="text-xs text-[#6b7280] truncate block">{u.email}</span>
                </div>
                <button
                  onClick={() => handleAdd(u.email, u._id)}
                  disabled={addingId === u._id}
                  className="opacity-0 group-hover:opacity-100 text-[#6b7280] hover:text-[#7269ef] p-1 disabled:opacity-30"
                  title="Start conversation"
                >
                  {addingId === u._id ? <RiMoreLine size={16} /> : <RiMessageLine size={16} />}
                </button>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <div className="sm:hidden w-full h-full flex">{panel}</div>
      <div className="hidden sm:flex flex-1 overflow-hidden">
        {panel}
        <WelcomeScreen />
      </div>
    </>
  );
}
