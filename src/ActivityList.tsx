import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { useSwipeable } from "react-swipeable";
import {
  Status,
  Activity,
  putActivity,
  useDeleteActivity,
  ActivityWithStatus,
} from "./services/tasks";

export function ActivityList({
  activities,
  status,
  onContextMenu,
}: {
  status: Status[];
  activities: ActivityWithStatus[];
  onContextMenu: (activity: Activity) => void;
}) {
  const [isFinishedToday, setIsFinishedToday] = useState(false);

  const filteredActivities = useMemo(
    () =>
      activities
        .filter((activity) => status.includes(activity.status))
        .filter((activity) => {
          if (!isFinishedToday) return true;
          return activity.finishedOn?.includes(
            new Date().toLocaleDateString("en-CA")
          );
        }),
    [activities, isFinishedToday, status]
  );
  if (status[0] === Status.Idle) console.log(filteredActivities);
  return (
    <div className="flex flex-col flex-1 border border-gray-200 rounded-lg">
      <h2 className="text-lg font-semibold px-4 py-2 bg-gray-100 border-b flex justify-between items-center">
        {status.length === 2
          ? "To Do"
          : status[0] === Status.Active
            ? "In Progress"
            : "Done"}
        {status[0] === Status.Done && (
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              className="w-4 h-4 accent-green-500"
              onChange={(e) => setIsFinishedToday(e.target.checked)}
            />
            Finished Today
          </label>
        )}
      </h2>
      <ul className="flex flex-col flex-1">
        {filteredActivities.map((activity) => (
          <ActivityItem
            key={activity._id}
            activity={activity}
            onContextMenu={onContextMenu}
          />
        ))}
      </ul>
    </div>
  );
}
function ActivityItem({
  activity,
  onContextMenu,
}: {
  activity: ActivityWithStatus;
  onContextMenu: (activity: Activity) => void;
}) {
  const handlers = useSwipeable({
    onSwiped: (eventData) => {
      const today = new Date().toLocaleDateString("en-CA");
      if (eventData.dir === "Right") {
        if (activity.inProgress) {
          mutate({
            finishedOn: [...(activity.finishedOn || []), today],
            inProgress: false,
          });
        } else if (!activity.inProgress) {
          mutate({
            inProgress: true,
          });
        }
      }
      if (eventData.dir === "Left") {
        if (activity.inProgress) {
          mutate({
            inProgress: false,
          });
        } else if (activity.finishedOn?.includes(today)) {
          mutate({
            finishedOn: (activity.finishedOn || []).filter(
              (day) => day !== today
            ),
            inProgress: true,
          });
        }
      }
    },
    trackMouse: true,
  });
  const queryClient = useQueryClient();
  const { mutate } = useMutation({
    mutationFn: (doc: Partial<Activity>) => putActivity(doc, activity),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["projects", "activities"],
      });
    },
  });
  const { mutate: deleteActivity } = useDeleteActivity();
  return (
    <li
      {...handlers}
      key={activity._id}
      className="flex items-center p-1 border-b last:border-none hover:bg-gray-100 transition relative"
      onDoubleClick={() => {
        deleteActivity(activity);
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        onContextMenu(activity);
      }}
    >
      <h3 className="ml-4 py-6 text-lg font-semibold">
        {activity.title} {activity.status === Status.Due && <em>(Overdue)</em>}
      </h3>
      <span className="absolute right-1 top-1 bg-cyan-500 text-white px-3 py-1 rounded-md text-sm  ">
        {activity.estimation} hours
      </span>
      <span className="absolute right-1 bottom-1 bg-fuchsia-500 text-white px-3 py-1 rounded-md text-sm  ">
        {activity.tag}
      </span>
    </li>
  );
}
