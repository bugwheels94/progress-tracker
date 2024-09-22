import { useGetProjects, usePostProject } from "../../services/projects";
import styles from "./Sidebar.module.css";
import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
export function Sidebar() {
	const query = useGetProjects();
	const projects = useMemo(() => {
		if (!query.data) return [];
		return query.data;
	}, [query.data]);
	const mutation = usePostProject();

	useEffect(() => {
		console.log({ query });
		if (query.isSuccess && projects.length === 0) {
			console.log("creating project", projects);
			mutation.mutate({ title: "default" });
		}
	}, [query.data, query.status]);

	return (
		<ul className={styles.sidebar}>
			{projects.map((project) => {
				return (
					<li key={project._id}>
						<Link to={`/${project._id}`} className={styles.items}>
							{project.title}
						</Link>
					</li>
				);
			})}
		</ul>
	);
}
