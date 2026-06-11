import { useState } from "react";
import { useNavigate } from "react-router";
import { RiSearchLine, RiMessageLine, RiUserLine } from "react-icons/ri";
import Avatar from "../../../components/chat/Avatar";
import WelcomeScreen from "../../../components/chat/WelcomeScreen";
import { useSearchUsersQuery } from "../../../api/user/userApi";
import {
  useGetConversationsQuery,
  useAddNewFriendMutation,
} from "../../../api/conversation/conversationApi";
import { toast } from "@repo/ui";
import { useDebounce } from "../../../hooks/useDebounce";

export default function ContactsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);

  const { data: conversations = [] } = useGetConversationsQuery();
  const { data: searchResults = [], isFetching } = useSearchUsersQuery(
    debouncedSearch.trim(),
    {
      skip: debouncedSearch.trim().length < 1,
    },
  );
  const [addNewFriend, { isLoading: isAdding }] = useAddNewFriendMutation();

  // Existing friends from conversations
  const friends = conversations
    .filter((c) => !c.isGroup && c.friend)
    .map((c) => ({ ...c.friend!, conversationId: String(c.conversationId) }));

  const handleMessageFriend = (conversationId: string) => {
    navigate(`/chat/chats?conv=${conversationId}`);
  };

  const handleAddAndMessage = async (email: string, userId: string) => {
    // Check if conversation already exists
    const existing = friends.find((f) => f._id === userId);
    if (existing) {
      navigate(`/chat/chats?conv=${existing.conversationId}`);
      return;
    }
    try {
      const result = await addNewFriend({ email }).unwrap();
      navigate(`/chat/chats?conv=${result.conversationId}`);
    } catch (err) {
      const msg = (err as { data?: { message?: string } })?.data?.message;
      toast.error(msg ?? "Failed to start conversation", "Contacts");
    }
  };

  // Group friends alphabetically
  const grouped = friends.reduce<Record<string, typeof friends>>((acc, f) => {
    const letter = f.fullName[0].toUpperCase();
    if (!acc[letter]) acc[letter] = [];
    acc[letter].push(f);
    return acc;
  }, {});

  const isSearching = search.trim().length > 0;

  const panel = (
    <div className="w-full sm:w-75 bg-[#2a3042] flex flex-col h-full border-r border-[#323a4d] shrink-0">
      {/* Header */}
      <div className="px-4 sm:px-5 pt-4 sm:pt-5 pb-3 flex items-center justify-between">
        <h2 className="text-white font-semibold text-base">Contacts</h2>
        <span className="text-xs text-[#6b7280] bg-[#323a4d] px-2 py-0.5 rounded-full">
          {friends.length}
        </span>
      </div>

      {/* Search */}
      <div className="px-3 sm:px-4 pb-3">
        <div className="flex items-center bg-[#323a4d] rounded-md px-3 py-2 gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search or find new users…"
            className="flex-1 bg-transparent text-sm text-[#a3aed0] placeholder-[#6b7280] outline-none min-w-0"
          />
          <RiSearchLine size={16} className="text-[#6b7280] shrink-0" />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-4 pb-20 sm:pb-4">
        {/* Search results */}
        {isSearching && (
          <>
            {isFetching && (
              <p className="text-xs text-[#6b7280] px-1 py-2 animate-pulse">
                Searching…
              </p>
            )}
            {!isFetching && searchResults.length === 0 && (
              <p className="text-xs text-[#6b7280] px-1 py-2">
                No users found.
              </p>
            )}
            {!isFetching && searchResults.length > 0 && (
              <div className="mb-3">
                <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-widest px-1 py-1 border-b border-[#323a4d] mb-1">
                  Search Results
                </p>
                {searchResults.map((u) => (
                  <div
                    key={u._id}
                    className="flex items-center gap-3 px-2 py-2.5 sm:py-2 rounded-lg hover:bg-[#323a4d] group"
                  >
                    <Avatar
                      initials={u.fullName.slice(0, 2).toUpperCase()}
                      name={u.fullName}
                      size="sm"
                      online={u.status === "online"}
                      src={u.avatar ?? undefined}
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-[#a3aed0] font-medium truncate block">
                        {u.fullName}
                      </span>
                      <span className="text-xs text-[#6b7280] truncate block">
                        {u.email}
                      </span>
                    </div>
                    <button
                      onClick={() => handleAddAndMessage(u.email, u._id)}
                      disabled={isAdding}
                      className="opacity-0 group-hover:opacity-100 text-[#6b7280] hover:text-[#7269ef] p-1 disabled:opacity-30 shrink-0"
                      title="Message"
                    >
                      <RiMessageLine size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Friends list */}
        {!isSearching && (
          <>
            {friends.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-14 h-14 rounded-full bg-[#323a4d] flex items-center justify-center mb-3">
                  <RiUserLine size={24} className="text-[#6b7280]" />
                </div>
                <p className="text-sm text-[#6b7280]">No contacts yet</p>
                <p className="text-xs text-[#4b5563] mt-1">
                  Search to find and message users
                </p>
              </div>
            ) : (
              Object.entries(grouped)
                .sort()
                .map(([letter, group]) => (
                  <div key={letter} className="mb-2">
                    <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-widest px-1 py-1 border-b border-[#323a4d] mb-1">
                      {letter}
                    </p>
                    {group.map((f) => (
                      <div
                        key={f._id}
                        className="flex items-center gap-3 px-2 py-2.5 sm:py-2 rounded-lg hover:bg-[#323a4d] group"
                      >
                        <Avatar
                          initials={f.fullName.slice(0, 2).toUpperCase()}
                          name={f.fullName}
                          size="sm"
                          online={f.status === "online"}
                          src={f.avatar ?? undefined}
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm text-[#a3aed0] font-medium truncate block">
                            {f.fullName}
                          </span>
                          <span
                            className={`text-xs truncate block capitalize ${f.status === "online" ? "text-green-400" : "text-[#6b7280]"}`}
                          >
                            {f.status}
                          </span>
                        </div>
                        <button
                          onClick={() => handleMessageFriend(f.conversationId)}
                          className="opacity-0 group-hover:opacity-100 text-[#6b7280] hover:text-[#7269ef] p-1 shrink-0"
                          title="Message"
                        >
                          <RiMessageLine size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                ))
            )}
          </>
        )}
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
