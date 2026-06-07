import { RiPhoneLine, RiPhoneFill, RiVideoLine, RiArrowDownLine, RiArrowUpLine } from "react-icons/ri";
import Avatar from "../../../components/chat/Avatar";
import WelcomeScreen from "../../../components/chat/WelcomeScreen";
import { useGetCallLogsQuery } from "../../../api/call/callApi";
import { useAppSelector } from "../../../store/hooks";
import { useAppDispatch } from "../../../store/hooks";
import { startOutgoingCall } from "../../../store/slices/callSlice";
import { socket } from "../../../socket/socket";
import { useGetConversationsQuery } from "../../../api/conversation/conversationApi";

function formatDuration(sec: number) {
  if (sec < 60) return `${sec}s`;
  return `${Math.floor(sec / 60)}m ${sec % 60}s`;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { day: "numeric", month: "short" });
}

export default function CallsPage() {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((s) => s.auth.user);
  const { data: logs = [], isLoading } = useGetCallLogsQuery();
  const { data: conversations = [] } = useGetConversationsQuery();

  const handleCallBack = (peerId: string, peerName: string, peerAvatar: string | null, callType: "audio" | "video" = "audio") => {
    const conv = conversations.find((c) =>
      !c.isGroup && c.friend?._id === peerId
    );
    if (!conv) return;
    dispatch(startOutgoingCall({
      conversationId: String(conv.conversationId),
      peerId,
      peerName,
      peerAvatar,
      peerOnline: conv.friend?.status === "online",
      callType,
    }));
    socket.emit("call:initiate", {
      conversationId: String(conv.conversationId),
      to: peerId,
      from: currentUser?.userId,
      callerName: currentUser?.fullName ?? "",
      callerAvatar: currentUser?.avatar ?? null,
      callType,
    });
  };

  const panel = (
    <div className="w-full sm:w-75 bg-[#2a3042] flex flex-col h-full border-r border-[#323a4d] shrink-0">
      <div className="px-4 sm:px-5 pt-4 sm:pt-5 pb-4 shrink-0">
        <h2 className="text-white font-semibold text-base">Recent Calls</h2>
      </div>

      <div className="flex-1 overflow-y-auto pb-20 sm:pb-0">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <span className="text-xs text-[#6b7280] animate-pulse">Loading…</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <RiPhoneLine size={32} className="text-[#3d4554]" />
            <p className="text-sm text-[#6b7280]">No call history yet</p>
          </div>
        ) : (
          logs.map((log) => {
            const isMe = log.caller._id === currentUser?.userId;
            const peer = isMe ? log.callee : log.caller;
            const missed = log.status === "missed" || (log.status === "rejected" && !isMe);
            const outgoing = isMe;

            const StatusIcon = missed || log.status === "rejected" ? RiArrowDownLine
              : outgoing ? RiArrowUpLine
              : RiPhoneLine;
            const iconColor = missed ? "text-red-400" : "text-green-400";

            return (
              <div key={log._id} className="flex items-center gap-3 px-4 py-3 hover:bg-[#323a4d] group">
                <Avatar
                  initials={peer.fullName.slice(0, 2).toUpperCase()}
                  name={peer.fullName}
                  size="sm"
                  src={peer.avatar ?? undefined}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#a3aed0] truncate">{peer.fullName}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <StatusIcon size={11} className={iconColor} />
                    <p className="text-[10px] text-[#6b7280]">
                      {outgoing ? "Outgoing" : missed ? "Missed" : "Incoming"}
                      {log.status === "completed" && log.durationSec > 0 && ` · ${formatDuration(log.durationSec)}`}
                    </p>
                    <span className={`ml-1 flex items-center gap-0.5 text-[10px] px-1 py-0.5 rounded ${log.callType === "video" ? "bg-blue-500/15 text-blue-400" : "bg-[#323a4d] text-[#6b7280]"}`}>
                      {log.callType === "video" ? <RiVideoLine size={9} /> : <RiPhoneLine size={9} />}
                      {log.callType === "video" ? "Video" : "Audio"}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-[10px] text-[#6b7280]">{formatDate(log.createdAt)}</span>
                  <button
                    onClick={() => handleCallBack(peer._id, peer.fullName, peer.avatar, log.callType)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-[#7269ef] hover:text-[#6055d8]"
                    title="Call back"
                  >
                    <RiPhoneFill size={14} />
                  </button>
                </div>
              </div>
            );
          })
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
