import { useState, useEffect, useMemo } from "react";
import { ActivityWithStatus, Status } from "./services/tasks";
import {
  getEodTimeFromQuery,
  getFrequencyFromQuery,
  getTargetFromQuery,
} from "./utils/target";
import { WarningModal } from "./WarningModal";

export function MoodCard({ emoji, score }: { emoji: string; score: number }) {
  const normalizedScore = Math.round(score / 10);

  return (
    <div className="flex items-center gap-2 bg-gradient-to-r from-blue-400 to-purple-400 text-white font-semibold px-4 py-2 rounded-lg shadow-md">
      <span className="text-lg">Today's Mood</span>
      <span className="text-2xl">{emoji}</span>
      <span className="text-lg">
        {String(normalizedScore).padStart(2, "0")}/10
      </span>
    </div>
  );
}
export const DailyTarget: React.FC = () => {
  const hours = getTargetFromQuery();

  const fullHours = Math.floor(hours);
  const minutes = Math.round((hours - fullHours) * 60);

  return (
    <div className="flex items-center gap-3  bg-blue-900 to-blue-500 text-white font-semibold px-4 py-2 rounded-lg shadow-md">
      <span className="text-lg">🎯 Daily Target</span>
      <span className="text-2xl">{fullHours}h</span>
      {minutes > 0 && <span className="text-2xl">{minutes}m</span>}
    </div>
  );
};
export function OverdueModal({
  activities,
  eodTime = getEodTimeFromQuery(), // default 1am
}: {
  activities: ActivityWithStatus[];
  eodTime?: number;
}) {
  const [showModal, setShowModal] = useState(false);

  const hasOverdue = useMemo(
    () => activities.some((a) => a.status === Status.Due),
    [activities]
  );

  useEffect(() => {
    const checkOverdue = () => {
      const now = new Date();
      const currentHour = now.getHours() + now.getMinutes() / 60;
      const endQuietHour = (eodTime + 9) % 24;

      const isInQuietPeriod =
        eodTime < endQuietHour
          ? currentHour >= eodTime && currentHour < endQuietHour
          : currentHour >= eodTime || currentHour < endQuietHour;

      if (isInQuietPeriod) {
        setShowModal(false); // hide if within quiet period
        return;
      }

      if (hasOverdue) {
        setShowModal(true);
      }
    };

    checkOverdue(); // initial check

    const interval = setInterval(
      checkOverdue,
      getFrequencyFromQuery() * 60 * 1000
    );

    return () => clearInterval(interval);
  }, [hasOverdue, eodTime]);

  return (
    <WarningModal
      show={showModal}
      text="You have overdue tasks. Please check your list!"
      onClose={() => setShowModal(false)}
    />
  );
}
