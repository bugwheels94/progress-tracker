import { useEffect } from "react";
import "./App.css";
import { useGetProjects, usePostProject } from "./services/projects";
import { useNavigate } from "react-router-dom";

function App() {
  const query = useGetProjects();
  const mutation = usePostProject();

  useEffect(() => {
    if (query.isSuccess && query.data.length === 0) {
      mutation.mutate({ title: "default" });
    }
  }, [query.data]);
  const navigate = useNavigate();
  useEffect(() => {
    console.log("wow");
    if (query.isSuccess && query.data.length) {
      console.log("navigating to ", `${query.data[0]._id}`);
      navigate(`/projects/${query.data[0]._id}`);
    }
  }, [query.data, query.isSuccess]);
  return null;
}

export default App;
