import { useState, useEffect } from "react";
import { useSearchParams } from "react-router";
import ChatsPanel from "../../../components/chat/ChatsPanel";
import ChatWindow from "../../../components/chat/ChatWindow";
import WelcomeScreen from "../../../components/chat/WelcomeScreen";

export default function ChatsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedId, setSelectedId] = useState<string | null>(
    searchParams.get("conv")
  );

  useEffect(() => {
    const conv = searchParams.get("conv");
    if (conv) {
      setSelectedId(conv);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleSelect = (id: string) => setSelectedId(id);
  const handleBack = () => setSelectedId(null);

  return (
    <>
      {/* Mobile: show panel OR chat, never both */}
      <div className={`sm:hidden w-full h-full ${selectedId ? "hidden" : "flex"}`}>
        <ChatsPanel selectedId={selectedId} onSelect={handleSelect} />
      </div>

      <div className={`sm:hidden w-full h-full ${selectedId ? "flex" : "hidden"}`}>
        {selectedId
          ? <ChatWindow contactId={selectedId} onBack={handleBack} />
          : null}
      </div>

      {/* sm+: always show panel, show chat or welcome on the right */}
      <div className="hidden sm:flex flex-1 overflow-hidden">
        <ChatsPanel selectedId={selectedId} onSelect={handleSelect} />
        {selectedId
          ? <ChatWindow contactId={selectedId} />
          : <WelcomeScreen />}
      </div>
    </>
  );
}
