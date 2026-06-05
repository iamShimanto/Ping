import { RiPhoneLine, RiVideoLine } from "react-icons/ri";
import Avatar from "../../../components/chat/Avatar";
import WelcomeScreen from "../../../components/chat/WelcomeScreen";
import { calls } from "../data/mockData";

export default function CallsPage() {
  const panel = (
    <div className="w-full sm:w-[300px] bg-[#2a3042] flex flex-col h-full border-r border-[#323a4d] shrink-0">
      {/* Header */}
      <div className="px-4 sm:px-5 pt-4 sm:pt-5 pb-4 shrink-0">
        <h2 className="text-white font-semibold text-base">Calls</h2>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto pb-20 sm:pb-0">
        {calls.map((call) => (
          <div key={call.id} className="flex items-center gap-3 px-4 py-3 hover:bg-[#323a4d] active:bg-[#323a4d]">
            <div className="shrink-0">
              {call.count ? (
                <div className="w-8 h-8 rounded-full bg-[#4b5563] flex items-center justify-center text-xs font-semibold text-[#a3aed0]">
                  {call.count}
                </div>
              ) : (
                <Avatar initials={call.initials} name={call.name} size="sm" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#a3aed0] truncate">{call.name}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <RiPhoneLine size={11} className={call.missed ? "text-red-400" : "text-green-400"} />
                <p className="text-[10px] text-[#6b7280] truncate">{call.date}</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className="text-xs text-[#6b7280]">{call.duration}</span>
              <button>
                {call.type === "video"
                  ? <RiVideoLine size={14} className="text-green-400" />
                  : <RiPhoneLine size={14} className="text-green-400" />}
              </button>
            </div>
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
