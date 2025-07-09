import { useEffect, useRef } from "react";
import audioSrc from "./assets/alert.mp3";

export function WarningModal({
  show,
  text,
  onClose,
  soundUrl = audioSrc,
}: {
  show: boolean;
  text: string;
  onClose?: () => void;
  soundUrl?: string;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize the audio only once
    if (!audioRef.current) {
      audioRef.current = new Audio(soundUrl);
      audioRef.current.loop = true;

      audioRef.current
        .play()
        .catch((e) => console.warn("Audio play blocked or failed:", e));
    }

    if (audioRef.current) {
      audioRef.current.muted = !show;
    }

    let timer: ReturnType<typeof setTimeout> | undefined;
    if (show) {
      timer = setTimeout(() => {
        onClose?.();
      }, 15000);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [show, soundUrl, onClose]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.remove();
        audioRef.current = null;
      }
    };
  }, []);

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={() => onClose?.()}
    >
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-xxl text-center">
        <h2 className="text-7xl font-bold text-red-600 mb-20">⚠️ Attention</h2>
        <p className="text-gray-800 text-5xl">{text}</p>
      </div>
    </div>
  );
}
