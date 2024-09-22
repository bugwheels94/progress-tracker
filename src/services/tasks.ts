import { nanoid } from "nanoid";
import PouchDB from "pouchdb";
import find from "pouchdb-find";

PouchDB.plugin(find);
const db = new PouchDB<ReturnType<typeof createActivity>>("activities");
db.createIndex({
	index: {
		fields: ["status", "createdAt"],
	},
});
enum Status {
	Paused,
	Idle,
	Active,
	Done,
}
function createActivity() {
	return {
		startedAt: Date.now(),
		timeSpent: 0,
		status: Status.Idle,
		createdAt: Date.now(),
		projectId: "",
		title: "",
	};
}
export type Activity = ReturnType<typeof createActivity>;
export async function getActivities(projectId: string) {
	try {
		const docs = await db.find({
			selector: { projectId },
		});
		console.log("k2", docs);
		let docs2 = docs.docs;
		// for (var i = 0; i < 20; i++) {
		// 	docs2 = docs2.concat(docs2);
		// }
		docs2.sort((a, b) => {
			// Define the order of statuses

			// First, compare by status
			const statusComparison = a.status - b.status;
			if (statusComparison !== 0) {
				return statusComparison; // Sort by status first
			}

			// If statuses are the same, sort by createdAt (earliest first)
			return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
		});
		return docs2;
	} catch (e) {
		console.log("hii", e);
	}
}
export async function postActivity(doc: { projectId: string; title: string }) {
	console.log("positng activit");
	try {
		await db.put({
			...createActivity(),
			...doc,
			_id: nanoid(),
		});
	} catch (e) {
		console.log(e);
	}
}
