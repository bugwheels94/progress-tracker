import { useMutation, useQueryClient } from "@tanstack/react-query";
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
export enum Status {
  Idle = 1,
  Active = 0,
  Done = 2,
}
function createActivity() {
  return {
    inProgress: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    estimation: 0,
    tag: "",
    title: "",
    finishedOn: [] as string[], // days in which the task was finished
    repeatsDaily: false, // days
    _id: nanoid(),
  };
}
export function getActivityStatus(a: Activity) {
  const today = new Date().toLocaleDateString("en-CA");

  return a.inProgress
    ? Status.Active
    : (a.finishedOn?.length && !a.repeatsDaily) ||
        ((a.finishedOn || []).includes(today) && a.repeatsDaily)
      ? Status.Done
      : Status.Idle;
}
export type Activity = ReturnType<typeof createActivity> & { _rev?: string };
export async function getActivities(): Promise<Activity[]> {
  try {
    const docs = await db.find({ selector: {} });

    const docs2: Activity[] = docs.docs as Activity[];

    docs2.sort((a, b) => {
      if (!a || !b) return 0;
      const statusComparison = getActivityStatus(a) - getActivityStatus(b);
      if (statusComparison !== 0) {
        return statusComparison;
      }

      // If statuses are the same, sort by createdAt (earliest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return docs2;
  } catch (e) {
    console.error("Error fetching activities:", e);
    return []; // Ensure it always returns Activity[]
  }
}
export async function putActivity(
  doc: Partial<Activity>,
  original: Activity = createActivity()
) {
  try {
    await db.put({
      ...original,
      ...doc,
      updatedAt: Date.now(),
    });
  } catch (e) {
    console.log(e);
  }
}
export async function deleteActivity(activity: Activity) {
  if (!activity._id || !activity._rev) {
    return;
  }
  try {
    await db.remove(activity._id, activity._rev); // Delete using id and rev
  } catch (e) {
    console.error("Error deleting activity:", e);
  }
}
export const useDeleteActivity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteActivity,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["projects", "activities"],
      });
    },
  });
};
export async function handleExport() {
  const docs = (await db.allDocs({ include_docs: true })).rows
    .map((row) => row.doc as Activity) // Extract documents
    .filter((doc) => !doc?._id.startsWith("_design/"));
  return docs;
}

// export function handleImport({
//   target: {
//     files: [file],
//   },
// }) {
//   if (file) {
//     const reader = new FileReader();
//     reader.onload = ({ target: { result } }) => {
//       db.bulkDocs(
//         JSON.parse(result),
//         { new_edits: false }, // not change revision
//         (...args) => console.log("DONE", args)
//       );
//     };
//     reader.readAsText(file);
//   }
// }
