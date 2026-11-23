import type { NextRequest } from "next/server";
import { isSameOrigin, staffBackendRequest, staffSessionCookie } from "@/lib/staff-session";

const staffResources = new Set([
  "absences", "bookings", "dashboard", "doctors", "employees",
  "roles", "services", "settings", "transactions",
]);

async function forward(request: NextRequest, { params }: RouteContext<"/api/staff/[...path]">) {
  const headers = new Headers({ "Cache-Control": "private, no-store" });
  if (request.method !== "GET" && request.method !== "HEAD" && !isSameOrigin(request)) {
    return new Response(null, { status: 403, headers });
  }

  const { path } = await params;
  const resource = path.join("/");
  const isSession = request.method === "GET" && resource === "auth/session";
  const isPublicBooking = resource === "bookings" && request.method === "POST";
  if (isPublicBooking || (!staffResources.has(path[0]) && !isSession) ||
      path.some((part) => !part || part === "." || part === ".." || /[/\\]/.test(part))) {
    return new Response(null, { status: 404, headers });
  }

  const token = request.cookies.get(staffSessionCookie)?.value;
  if (!token) return new Response(null, { status: 401, headers });

  try {
    const upstreamPath = "/" + path.map(encodeURIComponent).join("/") + request.nextUrl.search;
    const upstream = await staffBackendRequest(upstreamPath, { request, token });
    const contentType = upstream.headers.get("content-type");
    if (contentType) headers.set("Content-Type", contentType);
    return new Response(upstream.body, { status: upstream.status, headers });
  } catch {
    return Response.json({ message: "The clinic service is unavailable. Please try again." }, {
      status: 503,
      headers,
    });
  }
}

export { forward as GET, forward as POST, forward as PUT, forward as PATCH, forward as DELETE };
