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
  Active = 2,
  Done = 3,
  Due = 0,
}
export function createEmptyActivity() {
  return {
    inProgress: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    estimation: 1,
    tag: "",
    title: "",
    finishedOn: [] as string[], // days in which the task was finished
    pattern: { week: [] } as {
      week: number[]; // 0-6 for Sun-Sat, or "everyday"
      month?: number; // 1-31: date of the month
      year?: string; // MM-DD (e.g. "03-15")
      everyNthDay?: number;
    },
    _id: nanoid(),
  };
}

export function isPatternSet(pattern: Activity["pattern"]): boolean {
  return (
    !!pattern.week.length ||
    pattern.month !== undefined ||
    pattern.everyNthDay !== undefined
  );
}
function formatDate(date: Date) {
  return date.toISOString().split("T")[0];
}
export function getActivityStatus({
  pattern,
  finishedOn,
  inProgress,
  createdAt,
}: Activity): Status {
  const today = new Date().toLocaleDateString("en-CA");

  if (inProgress) return Status.Active;

  const finishedSet = new Set(finishedOn);
  const todayDate = new Date(today);
  const todayStr = formatDate(todayDate);
  if (!isPatternSet(pattern)) {
    if (finishedOn.length) return Status.Done;
    else return Status.Idle;
  }

  const matchedDates = getDatesBetween(
    finishedOn.at(-1) || new Date(createdAt).toISOString().slice(0, 10),
    today
  ).filter((d) => matchesPattern(new Date(d), pattern, finishedOn));

  const missed = matchedDates.filter((d) => !finishedSet.has(d));

  if (matchesPattern(todayDate, pattern, finishedOn)) {
    if (finishedSet.has(todayStr)) return Status.Done;
    else if (missed.length > 0) return Status.Due;
    else return Status.Idle;
  } else {
    if (missed.length > 0) return Status.Due;
    else return Status.Done;
  }
}
function getDatesBetween(start: string, end: string): string[] {
  const result: string[] = [];
  const current = new Date(start);
  const endDate = new Date(end);
  current.setDate(current.getDate() + 1); // exclusive start
  endDate.setDate(endDate.getDate() - 1); // exclusive start

  while (current <= endDate) {
    result.push(formatDate(new Date(current)));
    current.setDate(current.getDate() + 1);
  }
  return result;
}

export function getWorkSummary(
  activities: Activity[],
  eodTime: number,
  targetTime: number
) {
  const now = new Date();
  const currentHour = now.getHours();
  const today = now.toISOString().slice(0, 10); // "YYYY-MM-DD"

  // Filter activities finished today
  const finishedToday = activities.filter((a) => a.finishedOn.includes(today));

  const totalDone = finishedToday.reduce((sum, act) => sum + act.estimation, 0);

  const remainingWork = Math.max(0, targetTime - totalDone);
  const remainingHours =
    eodTime >= currentHour ? eodTime - currentHour : 24 - currentHour + eodTime;

  const utilization =
    remainingHours > 0 ? remainingWork / remainingHours : Infinity;

  return {
    remainingWork,
    remainingHours,
    utilization,
  };
}
function matchesPattern(
  date: Date,
  pattern: Activity["pattern"],
  finishedOn: string[]
): boolean {
  const dayOfWeek = date.getDay(); // 0 (Sun) - 6 (Sat)
  const monthDay = date.getDate();
  const lastDay = new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    0
  ).getDate();

  // Weekday match
  if (pattern.week?.includes(dayOfWeek)) return true;

  // Month day match
  if (pattern.month) {
    if (pattern.month > 0 && pattern.month === monthDay) return true;
    if (pattern.month < 0 && lastDay + pattern.month + 1 === monthDay)
      return true;
  }

  // Every Nth day since Epoch
  if (pattern.everyNthDay && finishedOn.length > 0) {
    const sortedFinished = [...finishedOn].sort(); // ascending
    const lastFinished = new Date(sortedFinished[sortedFinished.length - 1]);
    const diffInMs = date.getTime() - lastFinished.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays >= 0 && diffInDays % pattern.everyNthDay === 0) {
      return true;
    }
  }
  return false;
}
export type Activity = ReturnType<typeof createEmptyActivity> & {
  _rev?: string;
  deleted?: boolean;
};
export type ActivityWithStatus = Activity & { status: Status };

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
  original: Activity = createEmptyActivity()
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
