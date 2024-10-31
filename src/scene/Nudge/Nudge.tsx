import { useEffect } from "react";
import { Button } from "../../components/Button/Button";
import { PagePopup } from "../../components/PagePopup/PagePopup";

export default function () {
  useEffect(() => {}, []);
  const sendClose = () => {
    const channel = new BroadcastChannel("grow_channel");
    channel.postMessage({ type: "close", url: "/remind" });
    console.log("message sent");
    return channel;
  };
  const openProject = () => {
    sendClose().postMessage({ type: "open", url: "/app" });
  };
  return (
    <PagePopup
      actions={
        <>
          <Button onClick={openProject}>Yes</Button>
          <Button onClick={sendClose}>No</Button>
        </>
      }
    >
      <h2>
        It's been some time you have not done anything. Do you want to create
        activity?
      </h2>
    </PagePopup>
  );
}
