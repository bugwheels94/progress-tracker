import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Project from "./Project";
import Home from "./scene/Home/Home";
import Nudge from "./scene/Nudge/Nudge";
import Remind from "./scene/Remind/Remind";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      staleTime: 1000 * 60 * 5,
    },
  },
});
const router = createBrowserRouter([
  {
    path: "/remind",
    element: <Nudge />,
  },
  {
    path: "/remind/:activityId",
    element: <Remind />,
  },
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/app",
    element: <App />,
    loader: () => "Loading",
  },
  {
    path: "/projects/:projectId",
    element: <Project />,
    loader: () => "Loading",
  },
]);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>
);
