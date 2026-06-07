import { useState, useRef, useCallback, useEffect } from "react";
import { toast } from "@repo/ui";
import type { Message } from "../api/conversation/conversationApi";
import type { PendingUpload } from "./useChatMessages";

type DispatchMsg = (action:
  | { type: "addPending"; item: PendingUpload }
  | { type: "updatePendingProgress"; tempId: string; progress: number }
  | { type: "resolvePending"; tempId: string }
  | { type: "append"; message: Message }
) => void;

const API_BASE = () => (import.meta as { env: Record<string, string> }).env.VITE_API_URL ?? "";

export function useChatMedia(
  contactId: string,
  dispatchMsg: DispatchMsg,
  messagesEndRef: React.RefObject<HTMLDivElement | null>,
) {
  const [imagePreview, setImagePreview] = useState<{ file: File; url: string } | null>(null);
  const [imageCaption, setImageCaption] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scrollToBottom = () =>
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);

  const xhrUpload = useCallback(
    (fd: FormData, tempId: string, onRevoke: () => void) => {
      const xhr = new XMLHttpRequest();
      xhrRef.current = xhr;
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable)
          dispatchMsg({ type: "updatePendingProgress", tempId, progress: Math.round((e.loaded / e.total) * 100) });
      };
      xhr.onload = () => {
        xhrRef.current = null;
        dispatchMsg({ type: "resolvePending", tempId });
        onRevoke();
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const sent: Message = JSON.parse(xhr.responseText).data;
            dispatchMsg({ type: "append", message: sent });
            scrollToBottom();
          } catch {
            toast.error("Failed to parse response", "Chat");
          }
        } else {
          toast.error("Upload failed", "Chat");
        }
      };
      xhr.onerror = () => {
        xhrRef.current = null;
        dispatchMsg({ type: "resolvePending", tempId });
        onRevoke();
        toast.error("Upload failed", "Chat");
      };
      xhr.open("POST", `${API_BASE()}/api/v1/conversations/messages/send`);
      xhr.withCredentials = true;
      xhr.send(fd);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dispatchMsg]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Only images are supported", "Chat"); return; }
    setImagePreview({ file, url: URL.createObjectURL(file) });
    setImageCaption("");
    e.target.value = "";
  };

  const handleSendImage = useCallback(() => {
    if (!imagePreview) return;
    const { file, url } = imagePreview;
    const caption = imageCaption.trim();
    const tempId = `pending-img-${Date.now()}`;

    setImagePreview(null);
    setImageCaption("");
    dispatchMsg({ type: "addPending", item: { tempId, localUrl: url, progress: 0, kind: "image" } });
    scrollToBottom();

    const fd = new FormData();
    fd.append("conversationId", contactId);
    fd.append("file", file);
    if (caption) fd.append("content", caption);
    xhrUpload(fd, tempId, () => URL.revokeObjectURL(url));
  }, [imagePreview, imageCaption, contactId, dispatchMsg, xhrUpload]);

  const uploadVoiceBlob = useCallback(
    (blob: Blob, _durationSec: number, localUrl: string, tempId: string) => {
      const fd = new FormData();
      fd.append("conversationId", contactId);
      fd.append("file", blob, "voice.webm");
      xhrUpload(fd, tempId, () => URL.revokeObjectURL(localUrl));
    },
    [contactId, xhrUpload]
  );

  const startRecording = useCallback(async () => {
    if (isRecording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/ogg";
      const mr = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mr.start(100);
      mediaRecorderRef.current = mr;
      setIsRecording(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => setRecordingSeconds((s) => s + 1), 1000);
    } catch {
      toast.error("Microphone access denied", "Chat");
    }
  }, [isRecording]);

  const stopRecording = useCallback(
    (send: boolean) => {
      const mr = mediaRecorderRef.current;
      if (!mr) return;
      if (recordingTimerRef.current) { clearInterval(recordingTimerRef.current); recordingTimerRef.current = null; }

      const durationSec = recordingSeconds;
      mr.onstop = () => {
        mr.stream.getTracks().forEach((t) => t.stop());
        if (send && audioChunksRef.current.length > 0) {
          const blob = new Blob(audioChunksRef.current, { type: mr.mimeType });
          const localUrl = URL.createObjectURL(blob);
          const tempId = `pending-voice-${Date.now()}`;
          dispatchMsg({ type: "addPending", item: { tempId, localUrl, progress: 0, kind: "voice", durationSec } });
          scrollToBottom();
          uploadVoiceBlob(blob, durationSec, localUrl, tempId);
        }
        audioChunksRef.current = [];
      };
      mr.stop();
      mediaRecorderRef.current = null;
      setIsRecording(false);
      setRecordingSeconds(0);
    },
    [recordingSeconds, dispatchMsg, uploadVoiceBlob]
  );

  // Cleanup on conversation change / unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current) { mediaRecorderRef.current.stop(); mediaRecorderRef.current = null; }
      if (recordingTimerRef.current) { clearInterval(recordingTimerRef.current); recordingTimerRef.current = null; }
    };
  }, [contactId]);

  return {
    imagePreview, setImagePreview,
    imageCaption, setImageCaption,
    isRecording, recordingSeconds,
    fileInputRef,
    handleFileChange, handleSendImage,
    startRecording, stopRecording,
  };
}
