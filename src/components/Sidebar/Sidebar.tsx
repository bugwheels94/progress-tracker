import debounce from "debounce";
import {
  useGetProjects,
  usePatchProject,
  usePostProject,
} from "../../services/projects";
import classes from "./Sidebar.module.css";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
export function Sidebar({ projectId }: { projectId: string }) {
  const query = useGetProjects();
  const projects = useMemo(() => {
    if (!query.data) return [];
    return query.data;
  }, [query.data]);
  const mutation = usePostProject();

  const { mutate: putProject } = usePatchProject();
  useEffect(() => {
    console.log({ query });
    if (query.isSuccess && projects.length === 0) {
      console.log("creating project", projects);
      mutation.mutate({ title: "default" });
    }
  }, [query.data, query.status]);

  const [isEditing, setIsEditing] = useState(false);
  console.log({ isEditing });
  return (
    <>
      <div style={{ display: "flex" }} className={`${classes.buttonContainer}`}>
        <button
          onClick={() => {
            setIsEditing((b) => !b);
          }}
          style={{ flexGrow: 1 }}
          className={`${classes.button}`}
        >
          Edit{isEditing ? "ing" : ""} Projects
        </button>
        <button
          onClick={() => {
            mutation.mutate({ title: "new project" });
          }}
          className={`${classes.button}`}
        >
          &#43;
        </button>
      </div>

      <ul className={classes.sidebar}>
        {projects.map((project, index) => {
          if (isEditing) {
            return (
              <input
                className={classes.input}
                autoFocus={index === 0}
                defaultValue={project.title}
                onChange={debounce((e) => {
                  putProject({
                    ...project,
                    title: e.target.value,
                  });
                }, 500)}
              />
            );
          }
          console.log({ project, projectId });
          return (
            <li key={project._id}>
              <Link
                to={`/projects/${project._id}`}
                className={`${classes.items} ${
                  projectId === project._id ? classes.active : ""
                }`}
              >
                {project.title}
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
