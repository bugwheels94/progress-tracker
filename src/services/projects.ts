import PouchDB from "pouchdb";
import { nanoid } from "nanoid";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

type Project = { title: string; _id: string };
const projects = () => {
	const db = new PouchDB<Project>("projects");
	return db;
};

export async function getProjects() {
	const docs = await projects().allDocs({ include_docs: true });
	console.log("k", docs);

	// Type guard to filter out undefined values
	return docs.rows
		.map((x) => x.doc)
		.filter(
			(v): v is PouchDB.Core.ExistingDocument<Project> => v !== undefined
		);
}
export async function getProject(id: string) {
	// Fetch the project document by its id
	const doc = await projects().get(id);
	console.log("Fetched project", doc);

	return doc as PouchDB.Core.ExistingDocument<Project>;
}

export async function postProject(
	doc: Omit<Project, "_id"> = { title: "untitled" }
) {
	console.log("putting");
	try {
		return await projects().put({
			...doc,
			_id: nanoid(),
		});
	} catch (e) {
		console.log(e);
	}
}
export function useGetProjects() {
	return useQuery({
		queryKey: ["/projects"],
		queryFn: getProjects,
	});
}
export function useGetProject(id: string) {
	return useQuery({
		queryKey: ["/projects/" + id],
		queryFn: getProject.bind(null, id),
	});
}
export function usePostProject() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: postProject,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["/projects"] });
		},
	});
}
