import { useCallback, useEffect, useMemo, useState } from "react";
import "./App.css";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  createEmptyActivity,
  getActivities,
  getActivityStatus,
  handleExport,
  handleImport,
  Status,
} from "./services/tasks";
import { Link, useParams } from "react-router-dom";
import { googleLogout, useGoogleLogin } from "@react-oauth/google";
import { getFileFromDrive, postStringToDrive } from "./services/drive";
import { mergeArraysById } from "./utils/array";
import { clearAuthCookie, getAuthCookie } from "./utils/cookie";
import { ActivityForm } from "./ActivityForm";
import { ActivityList } from "./ActivityList";
import { DailyTarget, MoodCard, OverdueModal } from "./MoodCard";
import { getTargetFromQuery } from "./utils/target";
import { PleaseWorkModal } from "./PleaseWorkModal";

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

  return { color: `rgb(${r}, ${g}, ${b})`, emoji, score: percent };
}

function Project() {
  const { tag = "" } = useParams();

  const { data: activities } = useQuery({
    queryKey: ["projects", "activities"],
    queryFn: getActivities,
    select: (data) => {
      return data
        .filter((doc) => !doc.deleted)
        .map((activity) => {
          return { ...activity, status: getActivityStatus(activity) };
        })
        .sort((a, b) => {
          if (!a || !b) return 0;

          if (a.status !== b.status) return a.status - b.status;
          // If statuses are the same, sort by createdAt (earliest first)
          return (
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
        });
    },
  });
  const [google, setGoogle] = useState<string>(getAuthCookie());

  useEffect(() => {
    const interval = setInterval(() => {
      setGoogle(getAuthCookie());
    }, 30 * 1000);
    return () => clearInterval(interval);
  }, []);
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
            getTargetFromQuery()
        )
      ),
    [activities]
  );

  const queryClient = useQueryClient();
  const [isSyncing, setIsSyncing] = useState(false);
  const sync = useCallback(
    async (access_token: string) => {
      setIsSyncing(true);
      try {
        const fileName = "progress-tracker-activities-readonly.json";
        if (!access_token) return;
        const { data, fileId } = await getFileFromDrive({
          accessToken: access_token,
          fileName,
        });
        const localData = await handleExport();
        const finalData = mergeArraysById(data, localData).map((data) => {
          return {
            ...createEmptyActivity(),
            ...data,
          };
        });
        await postStringToDrive({
          json: JSON.stringify(finalData),
          accessToken: access_token,
          fileName,
          fileId,
        });
        await handleImport({ data: finalData });
        queryClient.invalidateQueries({
          queryKey: ["projects", "activities"],
        });
      } catch (e) {
        console.error("Error syncing:", e);
      } finally {
        setIsSyncing(false);
      }
    },
    [queryClient]
  );
  const filteredActivities = useMemo(
    () =>
      (activities || []).filter((activity) =>
        tag ? activity.tag === tag : true
      ),
    [activities, tag]
  );
  useEffect(() => {
    document.body.style.backgroundColor = mood.color;
  }, [mood]);
  const login = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      const expiryDate = new Date(
        Date.now() + tokenResponse.expires_in * 1000
      ).toUTCString();
      document.cookie = `access_token=${tokenResponse.access_token}; expires=${expiryDate}; path=/; Secure; SameSite=Lax`;
      setGoogle(tokenResponse.access_token);
      sync(tokenResponse.access_token);
    },
    scope: "https://www.googleapis.com/auth/drive.file",
  });
  const [activityToEdit, setActivityToEdit] = useState<Activity>();
  const [canPlayAudio, setCanPlayAudio] = useState(false);

  if (!activities) return <div>Loading...</div>;
  if (!canPlayAudio)
    return (
      <div className="flex text-xl flex-col items-center justify-center min-h-screen bg-gray-100 text-center px-4 relative">
        <div>
          <h2 className="text-2xl mb-4 font-semibold text-gray-800">
            Welcome to the Progress Tracker
          </h2>
          <p className="text-gray-600 mb-6">
            Click the button below to start and enable sound.
          </p>
          <button
            onClick={() => setCanPlayAudio(true)}
            className="p-6 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition text-4xl"
          >
            Start Experience
          </button>
        </div>

        {/* Footer disclaimer */}
        <footer className="absolute bottom-4 text-xs text-gray-500">
          This application does not collect any personal data. Audio is played
          locally for your experience only.
        </footer>
      </div>
    );

  return (
    <>
      <PleaseWorkModal activities={activities} />
      <OverdueModal activities={activities} />
      <div className="container mx-auto my-4 p-6 bg-white bg-opacity-30 rounded-lg select-none">
        {/* Form Section */}
        <div className="flex flex-row items-center justify-between rounded-2xl ">
          <div className="flex gap-3">
            <MoodCard {...mood} /> <DailyTarget />
          </div>
          <div className="flex gap-4 flex-row">
            {google && (
              <button
                onClick={() => sync(google)} // Replace with your actual sync function
                className="relative px-5 py-2 rounded-lg shadow-md font-medium transition-all bg-blue-500 text-white hover:bg-blue-600"
              >
                <span
                  className={`transition-opacity ${isSyncing ? "opacity-50 animate-pulse" : "opacity-100"}`}
                >
                  Sync{isSyncing ? "ing" : ""} Now
                </span>
              </button>
            )}
            <button
              onClick={() => {
                if (google) {
                  googleLogout();
                  clearAuthCookie();
                  setGoogle("");
                } else login();
              }}
              className={`flex items-center gap-3 px-5 py-2 rounded-lg shadow-md font-medium transition-all ${
                google
                  ? "bg-red-500 text-white hover:bg-red-600"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
              }`}
            >
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/120px-Google_%22G%22_logo.svg.png"
                alt="Google Logo"
                className="w-5 h-5"
              />
              {google ? "Sign out" : "Sign in with Google to Sync"}
            </button>
          </div>
        </div>
        <div className="mb-4">
          <ActivityForm
            activities={activities}
            key={activityToEdit?._id}
            current={activityToEdit}
            onSubmit={() => setActivityToEdit(undefined)}
          />
        </div>
        <TagsList activities={activities} />

        {/* Activity List */}
        <div className="flex flex-row gap-4">
          <ActivityList
            status={[Status.Idle, Status.Due]}
            activities={filteredActivities}
            onContextMenu={(activity) => setActivityToEdit(activity)}
          />
          <ActivityList
            status={[Status.Active]}
            activities={filteredActivities}
            onContextMenu={(activity) => setActivityToEdit(activity)}
          />
          <ActivityList
            status={[Status.Done]}
            activities={filteredActivities}
            onContextMenu={(activity) => setActivityToEdit(activity)}
          />
        </div>
      </div>
    </>
  );
}

const TagsList = ({ activities }: { activities: Activity[] }) => {
  const { tag: current = "" } = useParams();
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
            tag === current
              ? "bg-red-600 text-blue-100 font-bold"
              : "bg-blue-100 text-blue-700"
          }`}
        >
          {tag || (current === "" ? "Showing All" : "Show All")}
        </Link>
      ))}
    </div>
  );
};
export default Project;
