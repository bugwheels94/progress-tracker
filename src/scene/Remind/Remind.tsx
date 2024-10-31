import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { Status, patchActivity, useGetActivity } from "../../services/tasks";
import { useMutation } from "@tanstack/react-query";
import { PagePopup } from "../../components/PagePopup/PagePopup";
import { Button } from "../../components/Button/Button";

export default function () {
  useEffect(() => {}, []);
  const { activityId = "" } = useParams();
  const patchActivityMutation = useMutation({
    mutationFn: patchActivity,
    onSuccess: (_, { young }) => {
      const channel = new BroadcastChannel("grow_channel");
      channel.postMessage({ type: "close", url: "/remind" });
      if (young.status === Status.Active) {
        channel.postMessage({ type: "play" });
      } else if (young.status === Status.Done) {
        channel.postMessage({ type: "pause" });
      }
    },
  });
  const { data } = useGetActivity(activityId);
  if (!data) return null;
  return (
    <PagePopup
      actions={
        <>
          <Button
            onClick={() => {
              patchActivityMutation.mutate({
                old: data,
                young: { status: Status.Active },
              });
            }}
          >
            Continue Working
          </Button>
          <Button
            onClick={() => {
              patchActivityMutation.mutate({
                old: data,
                young: { status: Status.Done },
              });
            }}
          >
            Done
          </Button>
        </>
      }
    >
      Let's continue working on <i>{data.title}</i>?
    </PagePopup>
  );
}
