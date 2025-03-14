import { useMutation, useQueryClient } from "@tanstack/react-query";
import { nanoid } from "nanoid";
import PouchDB from "pouchdb";
import find from "pouchdb-find";

PouchDB.plugin(find);
const db = {
  instance: new PouchDB<Activity>("activities"),
};
function initDatabase() {
  db.instance = new PouchDB<Activity>("activities");
  db.instance.createIndex({
    index: {
      fields: ["status", "createdAt"],
    },
  });
  return db;
}
db.instance.createIndex({
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
export type Activity = ReturnType<typeof createActivity> & {
  _rev?: string;
  deleted?: boolean;
};
export async function getActivities(): Promise<Activity[]> {
  try {
    // const docs = await db.instance.find({ selector: {} });
    const docs = (await db.instance.allDocs({ include_docs: true })).rows
      .map((row) => {
        if (!row.doc) return null;
        const doc = row.doc as Activity;
        return doc;
      })
      .filter((doc) => !doc?._id.startsWith("_design/"))
      .filter(Boolean) as Activity[];

    const docs2: Activity[] = docs;

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
    await db.instance.put({
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
    await putActivity({ deleted: true }, activity);
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
  const docs = (await getActivities()).map((doc) => {
    delete doc._rev;
    return doc;
  });
  return docs;
}

export async function handleImport({ data }: { data: Activity[] }) {
  await db.instance.destroy();
  initDatabase();
  return db.instance.bulkDocs(data);
}
