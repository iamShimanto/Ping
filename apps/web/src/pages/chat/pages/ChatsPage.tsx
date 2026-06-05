import { useState } from "react";
import ChatsPanel from "../../../components/chat/ChatsPanel";
import ChatWindow from "../../../components/chat/ChatWindow";
import WelcomeScreen from "../../../components/chat/WelcomeScreen";

export default function ChatsPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <>
      <ChatsPanel selectedId={selectedId} onSelect={setSelectedId} />
      {selectedId ? <ChatWindow contactId={selectedId} /> : <WelcomeScreen />}
    </>
  );
}
