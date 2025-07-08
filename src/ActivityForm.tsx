import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useState, useMemo, useCallback } from "react";
import { Checkboxes } from "./Checkboxes";
import { MonthDaySelect } from "./MonthDaySelect";
import { Activity, createEmptyActivity, putActivity } from "./services/tasks";

export function ActivityForm({
  activities,
  current,
  onSubmit,
}: {
  activities: Activity[];
  current?: Activity;
  onSubmit: () => void;
}) {
  const [isSuggestionVisible, setIsSuggestionVisible] = useState(false);
  const [activity, setActivity] = useState(current || createEmptyActivity());

  const suggestions = useMemo(() => {
    if (!activity.tag) return [];

    const uniqueTags = new Set(
      [activity.tag, ...activities.map((a) => a.tag)].filter(Boolean)
    );

    return Array.from(uniqueTags);
  }, [activity.tag, activities]);
  const queryClient = useQueryClient();
  const activityMutation = useMutation({
    mutationFn: putActivity,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["projects", "activities"],
      });
      onSubmit();
    },
  });
  const submit = useCallback(
    async function submit() {
      // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
      // setsubmitMsg(await invoke("submit", { name }));

      activityMutation.mutate(activity);
    },
    [activityMutation, activity]
  );
  return (
    <form
      className="flex flex-col p-2 rounded-xl w-full mx-auto flex-wrap align-center"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <div className="flex  gap-2">
        {/* Activity Input */}
        <input
          autoComplete="off"
          spellCheck={false}
          id="submit-input"
          value={activity.title}
          onChange={(e) =>
            setActivity((a) => ({ ...a, title: e.target.value }))
          }
          placeholder="Create new activity..."
          className="p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 grow"
        />

        {/* Tag Input with Auto-Suggest */}
        <div className="relative z-10">
          <input
            type="text"
            value={activity.tag}
            onChange={(e) =>
              setActivity((a) => ({ ...a, tag: e.target.value }))
            }
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
                  onMouseDown={() => {
                    setActivity((a) => ({ ...a, tag: suggestion }));
                  }}
                  className="p-3 cursor-pointer hover:bg-gray-100 text-gray-700"
                >
                  {suggestion}
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          type="submit"
          className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
        >
          {current ? "Update" : "Create"}
        </button>
      </div>
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
          value={activity.estimation}
          onChange={(e) =>
            setActivity((a) => ({
              ...a,
              estimation: parseFloat(e.target.value),
            }))
          }
          className="grow"
        />
        <datalist id="markers">
          {[
            0.25, 0.5, 0.75, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7,
            7.5, 8,
          ].map((val) => (
            <option key={val} value={val}></option>
          ))}
        </datalist>
        {activity.estimation} hours
      </label>
      <div className="border rounded-lg bg-white">
        {/* Repeat Days of Week */}
        <label className="block font-semibold text-gray-700 pl-4 text-xl">
          Repeats on:
        </label>
        <div className="p-4 border-b">
          <Checkboxes
            value={activity.pattern.week}
            onChange={(value) =>
              setActivity((a) => ({
                ...a,
                pattern: {
                  week: value,
                },
              }))
            }
            selectAll
          />
        </div>

        {/* OR Day of Month */}
        <label className="p-4 border-b flex items-center justify-between">
          <span className="text-gray-700 font-medium mr-4">
            <strong className="text-xl text-blue-600">OR</strong> On day of
            Month:
          </span>
          <MonthDaySelect
            value={activity.pattern.month}
            onChange={(value) =>
              setActivity((a) => ({
                ...a,
                pattern: {
                  week: [],
                  month: value,
                },
              }))
            }
          />
        </label>

        {/* OR Every Nth Day */}
        <label className="p-4 border-b flex items-center justify-between">
          <span className="text-gray-700 font-medium mr-4">
            <strong className="text-xl text-blue-600">OR</strong> Every Nth Day:
          </span>
          <input
            type="number"
            className="border rounded px-3 py-1 w-32"
            value={activity.pattern.everyNthDay}
            onChange={(e) =>
              setActivity((a) => ({
                ...a,
                pattern: {
                  week: [],
                  everyNthDay: Number(e.target.value),
                },
              }))
            }
          />
        </label>
      </div>
      {/* Submit Button */}
    </form>
  );
}
