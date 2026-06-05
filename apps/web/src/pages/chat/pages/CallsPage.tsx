import { RiPhoneLine, RiVideoLine } from "react-icons/ri";
import Avatar from "../../../components/chat/Avatar";
import WelcomeScreen from "../../../components/chat/WelcomeScreen";
import { calls } from "../data/mockData";

export default function CallsPage() {
  return (
    <>
      <div className="w-[300px] bg-[#2a3042] flex flex-col h-full border-r border-[#323a4d] flex-shrink-0">
        {/* Header */}
        <div className="px-5 pt-5 pb-4 flex-shrink-0">
          <h2 className="text-white font-semibold text-base">Calls</h2>
        </div>

        {/* Calls list */}
        <div className="flex-1 overflow-y-auto">
          {calls.map((call) => (
            <div key={call.id} className="flex items-center gap-3 px-4 py-3 hover:bg-[#323a4d] group">
              <div className="relative flex-shrink-0">
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
              <div className="flex flex-col items-end gap-1">
                <span className="text-xs text-[#6b7280]">{call.duration}</span>
                <button className="text-[#6b7280] hover:text-[#a3aed0]">
                  {call.type === "video"
                    ? <RiVideoLine size={14} className="text-green-400" />
                    : <RiPhoneLine size={14} className="text-green-400" />
                  }
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <WelcomeScreen />
    </>
  );
}
