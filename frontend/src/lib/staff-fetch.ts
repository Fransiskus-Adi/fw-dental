export function staffFetch(path: string, init?: RequestInit) {
  return fetch(`/api/staff${path}`, { cache: "no-store", ...init });
}

export async function signOutStaff() {
  try {
    const response = await staffFetch("/logout", { method: "POST" });
    if (!response.ok) throw new Error("Logout request failed");
    window.location.replace("/admin/login");
  } catch {
    window.alert("Could not log out. Please try again.");
  }
}
