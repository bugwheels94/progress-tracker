import { Activity } from "../services/tasks";

export function mergeArraysById(arr1: Activity[], arr2: Activity[]) {
  const mergedMap = new Map<string, Activity>();

  [...arr1, ...arr2].forEach((item) => {
    const existing = mergedMap.get(item._id);

    if (
      !existing ||
      new Date(item.updatedAt || 0) > new Date(existing.updatedAt || 0)
    ) {
      mergedMap.set(item._id, item);
    }
  });
  console.log(arr1, arr2);

  return Array.from(mergedMap.values());
}
