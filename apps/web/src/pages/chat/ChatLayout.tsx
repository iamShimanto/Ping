import { Outlet } from "react-router";
import Sidebar from "../../components/chat/Sidebar";

export default function ChatLayout() {
  return (
    <div className="flex h-[100dvh] w-screen overflow-hidden bg-[#262b35]">
      <Sidebar />
      <div className="flex flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}
