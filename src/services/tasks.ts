import { useQuery } from "@tanstack/react-query";
import { nanoid } from "nanoid";
import PouchDB from "pouchdb";
import find from "pouchdb-find";

PouchDB.plugin(find);
const db = new PouchDB<ReturnType<typeof createActivity>>("activities");
db.createIndex({
  index: {
    fields: ["projectId"],
  },
});
db.createIndex({
  index: {
    fields: ["status", "createdAt"],
  },
});
export enum Status {
  Paused,
  Idle,
  Active,
  Done,
}
function createActivity() {
  return {
    lastActive: Date.now(),
    timeSpent: 0,
    status: Status.Idle,
    createdAt: Date.now(),
    projectId: "",
    title: "",
  };
}
export async function getActiveActivity() {
  try {
    const docs = await db.find({
      selector: {
        status: Status.Active,
      },
    });
    return docs.docs[0];
  } catch (e) {
    console.log("hii", e);
  }
}
export async function getActivity(id: string) {
  try {
    const docs = await db.get(id);
    return docs;
  } catch (e) {
    console.log("hii", e);
  }
}
export function useGetActivity(activityId: string) {
  return useQuery({
    queryKey: ["activity", activityId],
    queryFn: async function getActivity() {
      try {
        const docs = await db.get(activityId);
        return docs;
      } catch (e) {
        console.log("hii", e);
      }
    },
  });
}
export type Activity = ReturnType<typeof createActivity>;
export async function getActivities(projectId: string) {
  try {
    const docs = await db.find({
      selector: { projectId },
    });
    console.log("k2", docs);
    let docs2 = docs.docs;
    docs2
      .map((doc) => {
        return {
          ...doc,
          status:
            Date.now() - (doc.lastActive || 0) > 25 * 60 * 1000 &&
            doc.status === Status.Active
              ? Status.Idle
              : doc.status,
        };
      })
      .sort((a, b) => {
        const statusComparison = a.status - b.status;
        if (statusComparison !== 0) {
          return statusComparison; // Sort by status first
        }
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });
    return docs2;
  } catch (e) {
    console.log("hii", e);
  }
}
export async function postActivity(doc: { projectId: string; title: string }) {
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
export async function patchActivity({
  old,
  young,
}: {
  old: Activity;
  young: Partial<Activity>;
}) {
  try {
    console.log(young);
    if (young.status === Status.Active) {
      console.log("zxc updating to active");
      await db
        .find({
          selector: {
            status: Status.Active,
          },
        })
        .then((docs) => {
          console.log("zxc found active", docs);
          return db.bulkDocs(
            docs.docs.map((doc) => {
              return {
                ...doc,
                status: Status.Paused,
                timeSpent: doc.timeSpent + (Date.now() - doc.lastActive),
              };
            })
          );
        });
    }

    await db.put({
      ...old,
      ...young,
      ...(young.status === Status.Done || young.status === Status.Paused
        ? {
            timeSpent: old.timeSpent + (Date.now() - old.lastActive),
          }
        : young.status === Status.Active
        ? {
            lastActive: Date.now(),
          }
        : {}),
    });
  } catch (e) {
    console.log(e);
  }
}
