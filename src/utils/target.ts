export function getTargetFromQuery(): number {
  const params = new URLSearchParams(window.location.search);
  const target = params.get("target");
  return target ? Number(target) : 4;
}
export function getFrequencyFromQuery(): number {
  const params = new URLSearchParams(window.location.search);
  const target = params.get("frequency");
  return target ? Number(target) : 30;
}
export function getEodTimeFromQuery(): number {
  const params = new URLSearchParams(window.location.search);
  const target = params.get("eodTime");
  return target ? Number(target) : 1;
}
