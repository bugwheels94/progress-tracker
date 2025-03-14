import { Activity } from "../services/tasks";

export function mergeArraysById(arr1: Activity[], arr2: Activity[]) {
  const mergedMap = new Map<string, Activity>();

  [...arr1, ...arr2].forEach((item) => {
    const existing = mergedMap.get(item._id);

    if (!existing || new Date(item.updatedAt) > new Date(existing.updatedAt)) {
      mergedMap.set(item._id, item);
    }
  });

  return Array.from(mergedMap.values());
}
