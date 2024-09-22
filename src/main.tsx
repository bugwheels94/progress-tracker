import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Project from "./Project";
const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			refetchOnMount: false,
			staleTime: 1000 * 60 * 5,
		},
	},
});
const router = createMemoryRouter(
	[
		{
			path: "/",
			element: <App />,
			loader: () => "Loading",
		},
		{
			path: "/:projectId",
			element: <Project />,
			loader: () => "Loading",
		},
	],
	{
		initialEntries: ["/"],
		initialIndex: 1,
	}
);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
	<React.StrictMode>
		<QueryClientProvider client={queryClient}>
			<RouterProvider router={router} />
		</QueryClientProvider>
	</React.StrictMode>
);
