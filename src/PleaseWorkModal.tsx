import { useEffect, useState } from "react";
import { WarningModal } from "./WarningModal"; // assuming this exists
import { ActivityWithStatus } from "./services/tasks";
import {
  getEodTimeFromQuery,
  getFrequencyFromQuery,
  getTargetFromQuery,
} from "./utils/target";

function getWorkSummary(
  activities: ActivityWithStatus[],
  eodTime: number,
  targetTime: number
) {
  const now = new Date();
  const currentHour = now.getHours();
  const today = now.toISOString().slice(0, 10);
  const currentMinute = now.getMinutes();

  const finishedToday = activities.filter((a) => a.finishedOn.includes(today));

  const totalDone = finishedToday.reduce(
    (sum, act) => sum + (act.estimation || 0),
    0
  );

  const remainingWork = Math.max(0, targetTime - totalDone);

  const currentTotalHours = currentHour + currentMinute / 60;
  let eodTotalHours = eodTime;

  if (eodTime <= currentTotalHours) {
    // EOD is technically next day
    eodTotalHours += 24;
  }

  const remainingHours = Math.max(0, eodTotalHours - currentTotalHours);
  const neededUtilization =
    remainingHours > 0 ? remainingWork / remainingHours : Infinity;

  return {
    remainingWork,
    remainingHours,
    neededUtilization,
  };
}

export function PleaseWorkModal({
  activities,
  eodTime = getEodTimeFromQuery(), // 1am default
  targetTime = getTargetFromQuery(), // hours
}: {
  activities: ActivityWithStatus[];
  eodTime?: number;
  targetTime?: number;
}) {
  const [showModal, setShowModal] = useState("");

  useEffect(() => {
    const checkReminder = () => {
      const { remainingWork, neededUtilization, remainingHours } =
        getWorkSummary(activities, eodTime, targetTime);

      if (neededUtilization > 1)
        // Customize threshold
        setShowModal("Please keep working. Target has slipped though!");
      else if (remainingWork > 0) {
        if (neededUtilization > 0.75)
          // Customize threshold
          setShowModal("Please start working. Target is slipping!");
      }
    };

    checkReminder();

    const interval = setInterval(
      checkReminder,
      getFrequencyFromQuery() * 60 * 1000
    );

    return () => clearInterval(interval);
  }, [activities, eodTime, targetTime]);

  return (
    <WarningModal
      show={!!showModal}
      text={showModal}
      onClose={() => {
        setShowModal("");
      }}
    />
  );
}
