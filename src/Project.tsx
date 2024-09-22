import { useCallback, useMemo, useState } from "react";
import classes from "./Project.module.css";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useGetProject } from "./services/projects";
import { Activity, getActivities, postActivity } from "./services/tasks";
import { Sidebar } from "./components/Sidebar/Sidebar";
import { useParams } from "react-router-dom";
import { FixedSizeList } from "react-window";
import Fuse from "fuse.js";

function formatTime(seconds: number) {
	if (seconds < 60) {
		return `${seconds} second${seconds !== 1 ? "s" : ""}`;
	} else if (seconds < 3600) {
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		return `${minutes} minute${minutes !== 1 ? "s" : ""}${
			remainingSeconds > 0
				? ` and ${remainingSeconds} second${remainingSeconds !== 1 ? "s" : ""}`
				: ""
		}`;
	} else {
		const hours = Math.floor(seconds / 3600);
		const remainingMinutes = Math.floor((seconds % 3600) / 60);
		const remainingSeconds = seconds % 60;
		return `${hours} hour${hours !== 1 ? "s" : ""}${
			remainingMinutes > 0
				? ` and ${remainingMinutes} minute${remainingMinutes !== 1 ? "s" : ""}`
				: ""
		}${
			remainingSeconds > 0
				? ` and ${remainingSeconds} second${remainingSeconds !== 1 ? "s" : ""}`
				: ""
		}`;
	}
}

function Project() {
	const { projectId = "" } = useParams();
	const { data: project, isSuccess } = useGetProject(projectId);

	const { data: activities } = useQuery({
		queryKey: ["projects", projectId, "activities"],
		enabled: !!projectId,
		queryFn: () => {
			return getActivities(projectId);
		},
	});
	const queryClient = useQueryClient();
	const activityMutation = useMutation({
		mutationFn: postActivity,
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["projects", projectId, "activities"],
			});
		},
	});

	const [greetMsg, setGreetMsg] = useState("");
	const [name, setName] = useState("");

	const filteredActivities = useMemo(() => {
		if (!activities) return [];
		if (!name) return activities;
		const fuse = new Fuse(activities, {
			keys: ["title"],
		});
		return fuse.search(name).map((x) => x.item);
	}, [activities, name]);
	const greet = useCallback(
		async function greet() {
			// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
			// setGreetMsg(await invoke("greet", { name }));

			activityMutation.mutate({
				projectId: projectId,
				title: name,
			});
		},
		[project, name]
	);
	console.log("hey");
	if (!isSuccess) return null;
	return (
		<>
			<div className="grid grid-flow-col gap-4 h-screen">
				<div className="col-span-2">
					<Sidebar />
				</div>
				<div className={`col-span-10 ${classes.formContainer}`}>
					<div>
						<form
							className={`${classes.form}`}
							onSubmit={(e) => {
								e.preventDefault();
								greet();
							}}
						>
							<input
								autoComplete="off"
								spellCheck={false}
								id="greet-input"
								onChange={(e) => setName(e.currentTarget.value)}
								placeholder="Create new activity..."
							/>
							<button type="submit">Create</button>
						</form>
						<ul style={{ overflow: "auto" }}>
							<FixedSizeList
								height={Math.min(1000, (filteredActivities?.length || 1) * 70)}
								width={"100%"}
								itemSize={70}
								itemCount={filteredActivities?.length || 0}
							>
								{({ index, style }) => {
									const activity = filteredActivities?.[index];
									if (!activity) return null;
									return (
										<li
											style={style}
											key={activity._id}
											className={`p-3 ${classes.listItem}`}
										>
											<button className={`${classes.action}`}>
												<i className={`${classes.paused}`}></i>
											</button>
											<h3 className="mb-0 ml-5">{activity.title}</h3>
											<time className="ml-auto">
												&#9200; {formatTime(activity.timeSpent)}
											</time>
										</li>
									);
								}}
							</FixedSizeList>
						</ul>

						<p>{greetMsg}</p>
					</div>
				</div>
			</div>
		</>
	);
}

export default Project;
