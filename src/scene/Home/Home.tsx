import { useCallback, useEffect, useRef, useState } from "react";
import { Status, getActiveActivity, patchActivity } from "../../services/tasks";
import { Music } from "../../utils/music";
import { useMutation } from "@tanstack/react-query";
import { PagePopup } from "../../components/PagePopup/PagePopup";
import { Button } from "../../components/Button/Button";

function getFirstUrlChunk(url: string) {
  return url.split("/")[1];
}

enum PomodoroStatus {
  WORKING = "Keep it up!",
  IDLE = "Lets do something!",
  Active = "Active",
}
const channel = new BroadcastChannel("grow_channel");
const music = new Music();

export default function Home() {
  const windows = useRef<Record<string, Window | null>>({});
  const firstRun = useRef<boolean>(true);
  const [state, setState] = useState<PomodoroStatus>(PomodoroStatus.IDLE);
  const [lastNudgeTime, setLastNudgeTime] = useState(0);

  const patchActivityMutation = useMutation({
    mutationFn: patchActivity,
    onSuccess: (_, { young }) => {
      if (young.status === Status.Active) channel.postMessage({ type: "play" });
      else channel.postMessage({ type: "pause" });
    },
  });

  const openWindow = useCallback(
    function (url: string) {
      let width = screen.width / 2;
      let height = screen.height / 2;
      const u = getFirstUrlChunk(url);
      if (u === "remind") {
        width = 300;
        height = 300;
      }
      console.log("open", u, Date.now(), lastNudgeTime);
      if (url === "/remind" && Date.now() - lastNudgeTime < 15 * 60 * 1000) {
        return;
      }
      if (windows.current[u]) {
        closeWindow(u);
      }
      windows.current[u] = window.open(
        url,
        "_blank",
        `width=${width},height=${height},left=${
          (screen.width - width) / 2
        },top=${(screen.height - height) / 2}`
      );
      if (u === "remind") {
        setLastNudgeTime(Date.now());
      }
    },
    [lastNudgeTime, , setLastNudgeTime]
  );
  function closeWindow(url: string) {
    windows.current[url]?.close();
    windows.current[url] = null;
  }
  useEffect(() => {
    const channel = new BroadcastChannel("grow_channel");
    channel.addEventListener("message", (event) => {
      console.log("message received", event);

      switch (event.data.type) {
        case "open": {
          openWindow(event.data.url);
          break;
        }
        case "close": {
          closeWindow(getFirstUrlChunk(event.data.url));
          break;
        }
        case "play": {
          music.play();
          const projectChannel = new BroadcastChannel("project_channel");
          projectChannel.postMessage({ type: "refetch" });
          break;
        }
        case "pause": {
          music.pause();
          const projectChannel = new BroadcastChannel("project_channel");
          projectChannel.postMessage({ type: "refetch" });
          break;
        }
        default:
          break;
      }
    });
    return () => {
      channel.close();
    };
  }, []);
  useEffect(() => {
    let id: any;
    async function check() {
      const activity = await getActiveActivity();
      if (!activity) {
        setState(PomodoroStatus.IDLE);
        console.log("open", firstRun.current);
        if (firstRun.current) openWindow("/app");
        else openWindow("/remind");
      } else {
        if (firstRun.current) openWindow("/projects/" + activity.projectId);
        else {
          if (activity.lastActive < Date.now() - 25 * 60 * 1000) {
            patchActivityMutation.mutate({
              old: activity,
              young: { status: Status.Paused },
            });
            openWindow("/remind/" + activity._id);
          }
        }
        setState(PomodoroStatus.WORKING);
      }
      firstRun.current = false;
      id = setTimeout(() => check(), 1000 * 5);
    }
    id = setTimeout(() => check(), 0);
    return () => {
      clearTimeout(id);
    };
  }, [openWindow]);
  return (
    <PagePopup
      actions={
        <>
          <Button onClick={() => openWindow("/app")}>Show Dashboard</Button>
        </>
      }
    >
      <h1
        style={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {state}
      </h1>
    </PagePopup>
  );
}
