import { useCallback, useEffect, useMemo, useState } from "react";
import "./App.css";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  getActivities,
  getActivityStatus,
  putActivity,
  Status,
  useDeleteActivity,
} from "./services/tasks";
import { Link, useParams } from "react-router-dom";
import { useSwipeable } from "react-swipeable";

function emotionColorAndEmoji(percent: number) {
  percent = Math.max(0, Math.min(100, percent)); // Clamp between 0 and 100

  let r, g, b;

  if (percent <= 50) {
    // Transition from Red (#FF6B6B) to Blue (#6B92FF)
    const start = { r: 255, g: 107, b: 107 }; // Red
    const mid = { r: 107, g: 146, b: 255 }; // Blue

    const ratio = percent / 50;
    r = Math.round(start.r + (mid.r - start.r) * ratio);
    g = Math.round(start.g + (mid.g - start.g) * ratio);
    b = Math.round(start.b + (mid.b - start.b) * ratio);
  } else {
    // Transition from Blue (#6B92FF) to Green (#6BCB77)
    const mid = { r: 107, g: 146, b: 255 }; // Blue
    const end = { r: 107, g: 203, b: 119 }; // Green

    const ratio = (percent - 50) / 50;
    r = Math.round(mid.r + (end.r - mid.r) * ratio);
    g = Math.round(mid.g + (end.g - mid.g) * ratio);
    b = Math.round(mid.b + (end.b - mid.b) * ratio);
  }

  // Emoji Scale
  let emoji;
  if (percent <= 10)
    emoji = "😢"; // Very sad
  else if (percent <= 25)
    emoji = "😞"; // Sad
  else if (percent <= 40)
    emoji = "😐"; // Neutral-Sad
  else if (percent <= 50)
    emoji = "😶"; // Neutral (Blue zone)
  else if (percent <= 60)
    emoji = "🙂"; // Slightly happy
  else if (percent <= 75)
    emoji = "😊"; // Happy
  else if (percent <= 90)
    emoji = "😄"; // Very happy
  else emoji = "😁"; // Super happy

  return { color: `rgb(${r}, ${g}, ${b})`, emoji };
}
function Project() {
  const { tag = "" } = useParams();

  const { data: activities } = useQuery({
    queryKey: ["projects", tag, "activities"],
    queryFn: () => {
      return getActivities(tag);
    },
  });

  const mood = useMemo(
    () =>
      emotionColorAndEmoji(
        Math.min(
          100,
          ((activities || [])
            .filter((a) =>
              a.finishedOn?.includes(new Date().toLocaleDateString("en-CA"))
            )
            .reduce((acc, a) => acc + (a.estimation || 0), 0) *
            100) /
            8
        )
      ),
    [activities]
  );
  useEffect(() => {
    document.body.style.backgroundColor = mood.color;
  }, [mood]);

  if (!activities) return <div>Loading...</div>;
  return (
    <>
      <div className="container mx-auto my-4 p-6 bg-white bg-opacity-30 rounded-lg select-none">
        {/* Form Section */}
        <div className="flex flex-row items-center justify-center rounded-2xl ">
          <h2 className="text-xl font-semibold mb-2">Today's Mood</h2>
          <div className="text-6xl">{mood.emoji}</div>
        </div>
        <div className="mb-4">
          <ActivityForm activities={activities} />
        </div>
        <TagsList activities={activities} />

        {/* Activity List */}
        <div className="flex flex-row gap-4">
          <ActivityList status={Status.Idle} activities={activities} />
          <ActivityList status={Status.Active} activities={activities} />
          <ActivityList status={Status.Done} activities={activities} />
        </div>
      </div>
    </>
  );
}
function ActivityList({
  activities,
  status,
}: {
  status: Status;
  activities: Activity[];
}) {
  const filteredActivities = useMemo(
    () =>
      activities.filter((activity) => getActivityStatus(activity) === status),
    [activities, status]
  );
  return (
    <div className="flex flex-col flex-1 border border-gray-200 rounded-lg">
      <h2 className="text-lg font-semibold px-4 py-2 bg-gray-100 border-b">
        {status === Status.Idle
          ? "To Do"
          : status === Status.Active
            ? "In Progress"
            : "Done"}
      </h2>
      <ul className="flex flex-col flex-1">
        {filteredActivities.map((activity) => (
          <ActivityItem key={activity._id} activity={activity} />
        ))}
      </ul>
    </div>
  );
}

function ActivityItem({ activity }: { activity: Activity }) {
  const { tag = "" } = useParams();

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
        queryKey: ["projects", tag, "activities"],
      });
    },
  });
  const { mutate: deleteActivity } = useDeleteActivity(tag);
  return (
    <li
      {...handlers}
      key={activity._id}
      className="flex items-center p-1 border-b last:border-none hover:bg-gray-100 transition relative"
      onDoubleClick={() => {
        deleteActivity(activity);
      }}
    >
      {/* Action Button */}
      {/* Activity Title */}
      <h3 className="ml-4 py-6 text-lg font-semibold">{activity.title}</h3>
      <span className="absolute right-1 top-1 bg-cyan-500 text-white px-3 py-1 rounded-md text-sm  ">
        {activity.estimation} hours
      </span>
      {/* Time Spent */}
    </li>
  );
}
export function ActivityForm({ activities }: { activities: Activity[] }) {
  const { tag: tagParam = "" } = useParams();
  const [tag, setTag] = useState("");
  const [isSuggestionVisible, setIsSuggestionVisible] = useState(false);
  const [repeatsDaily, setRepeatsDaily] = useState(false);
  const [title, setTitle] = useState("");
  const [estimation, setEstimation] = useState(1);

  const suggestions = useMemo(() => {
    if (!tag) return [];

    const uniqueTags = new Set(
      [tag, ...activities.map((a) => a.tag)].filter(Boolean)
    );

    return Array.from(uniqueTags);
  }, [tag, activities]);
  const queryClient = useQueryClient();
  const activityMutation = useMutation({
    mutationFn: putActivity,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["projects", tagParam, "activities"],
      });
    },
  });
  const greet = useCallback(
    async function greet() {
      // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
      // setGreetMsg(await invoke("greet", { name }));

      activityMutation.mutate({
        tag,
        title,
        repeatsDaily,
        estimation,
      });
    },
    [title, tag, repeatsDaily, estimation]
  );
  return (
    <form
      className="flex flex-row gap-2 p-2 rounded-xl w-full mx-auto flex-wrap align-center"
      onSubmit={(e) => {
        e.preventDefault();
        greet();
      }}
    >
      {/* Activity Input */}
      <input
        autoComplete="off"
        spellCheck={false}
        id="greet-input"
        onChange={(e) => setTitle(e.currentTarget.value)}
        placeholder="Create new activity..."
        className="p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 grow"
      />

      {/* Tag Input with Auto-Suggest */}
      <div className="relative z-10">
        <input
          type="text"
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          onFocus={() => {
            setIsSuggestionVisible(true);
          }}
          onBlur={() => {
            setTimeout(() => setIsSuggestionVisible(false), 100);
          }}
          placeholder="Add a tag..."
          className="p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-400"
        />
        {suggestions.length > 0 && isSuggestionVisible && (
          <ul className="absolute top-full left-0 w-full bg-white border border-gray-200 rounded-lg mt-1  overflow-hidden">
            {suggestions.map((suggestion) => (
              <li
                key={suggestion}
                onClick={() => {
                  setTag(suggestion);
                }}
                className="p-3 cursor-pointer hover:bg-gray-100 text-gray-700"
              >
                {suggestion}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Repeat Daily Toggle */}

      <button
        type="submit"
        className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
      >
        Create
      </button>
      <div className="flex w-full gap-4">
        <label className="flex items-center gap-2 grow">
          Estimation
          <input
            type="range"
            id="temp"
            name="temp"
            list="markers"
            min="0.25" // Set the minimum value
            max="8" // Set the maximum value
            step="0.25" // Define step size to match your `datalist`
            value={estimation}
            onChange={(e) => setEstimation(parseFloat(e.target.value))}
            className="grow"
          />
          <datalist id="markers">
            {[
              0.25, 0.5, 0.75, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5,
              7, 7.5, 8,
            ].map((val) => (
              <option key={val} value={val}></option>
            ))}
          </datalist>
          {estimation} hours
        </label>
        <label className="flex items-center gap-2 cursor-pointer text-gray-600">
          <input
            type="checkbox"
            checked={repeatsDaily}
            onChange={() => setRepeatsDaily(!repeatsDaily)}
            className="w-5 h-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          Daily
        </label>
      </div>

      {/* Submit Button */}
    </form>
  );
}

const TagsList = ({ activities }: { activities: Activity[] }) => {
  const tags = useMemo(() => {
    const uniqueTags = new Set(
      [...activities.map((a) => a.tag)].filter(Boolean)
    );

    return Array.from(uniqueTags);
  }, [activities]);
  return (
    <div className="flex flex-wrap gap-2">
      {[""].concat(tags).map((tag) => (
        <Link
          key={tag}
          to={`/${tag}`}
          className={`px-3 py-1 my-2 rounded-md text-sm transition ${
            tag === ""
              ? "bg-blue-700 text-blue-100 hover:bg-red-600"
              : "bg-blue-100 text-blue-700 hover:bg-blue-200"
          }`}
        >
          {tag || "Show All"}
        </Link>
      ))}
    </div>
  );
};
export default Project;
