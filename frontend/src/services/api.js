export async function apiRequest(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "request_failed");
  }

  return response.json();
}
