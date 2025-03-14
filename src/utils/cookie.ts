export function getAuthCookie() {
  const cookies = document.cookie.split("; ");
  const authCookie = cookies.find((row) => row.startsWith("access_token="));
  return authCookie ? authCookie.split("=")[1] : "";
}
export function clearAuthCookie() {
  document.cookie =
    "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/";
}
