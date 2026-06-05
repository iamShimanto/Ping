import { RiBookmarkLine } from "react-icons/ri";
import WelcomeScreen from "../../../components/chat/WelcomeScreen";

export default function BookmarksPage() {
  return (
    <>
      <div className="w-[300px] bg-[#2a3042] flex flex-col h-full border-r border-[#323a4d] flex-shrink-0">
        <div className="px-5 pt-5 pb-3 flex items-center justify-between">
          <h2 className="text-white font-semibold text-base">Bookmarks</h2>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
          <div className="w-16 h-16 rounded-full bg-[#323a4d] flex items-center justify-center mb-4">
            <RiBookmarkLine size={28} className="text-[#6b7280]" />
          </div>
          <p className="text-sm text-[#6b7280]">No bookmarks yet</p>
          <p className="text-xs text-[#4b5563] mt-1">Save messages to find them here</p>
        </div>
      </div>
      <WelcomeScreen />
    </>
  );
}
