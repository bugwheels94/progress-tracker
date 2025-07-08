import { useEffect } from "react";
import audio from "./assets/alert.mp3";
export function WarningModal({
  show,
  text,
  onClose,
  soundUrl = audio,
}: {
  show: boolean;
  text: string;
  onClose?: () => void; // optional callback when modal hides
  soundUrl?: string; // optional custom sound path
}) {
  useEffect(() => {
    if (show) {
      const audio = new Audio(soundUrl);
      audio.loop = true;

      audio.play().catch((e) => {
        console.log("Audio play error:", e);
      });

      const timer = setTimeout(() => {
        onClose?.();
        onClose?.();
      }, 15000);

      return () => {
        clearTimeout(timer);
        audio.pause();
        audio.currentTime = 0;
        audio.remove();
      };
    }
  }, [show, soundUrl, onClose]);

  if (!show) return null;
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={() => {
        onClose?.();
      }}
    >
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-xxl text-center">
        <h2 className="text-7xl font-bold text-red-600 mb-20">⚠️ Attention</h2>
        <p className="text-gray-800 text-5xl">{text}</p>
      </div>
    </div>
  );
}
