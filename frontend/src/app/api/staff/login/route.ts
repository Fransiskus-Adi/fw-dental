import { NextResponse, type NextRequest } from "next/server";
import type { AdminSession } from "@/lib/admin-access";
import { isSameOrigin, staffBackendRequest, staffCookieOptions, staffSessionCookie } from "@/lib/staff-session";

const headers = { "Cache-Control": "private, no-store" };

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return new Response(null, { status: 403, headers });

  try {
    const login = await staffBackendRequest("/auth/login", { request });
    const data = await login.json();
    if (!login.ok) {
      const failureHeaders = new Headers(headers);
      const retryAfter = login.headers.get("Retry-After");
      if (retryAfter) failureHeaders.set("Retry-After", retryAfter);
      return NextResponse.json(data, { status: login.status, headers: failureHeaders });
    }
    const token: unknown = data.access_token;
    if (typeof token !== "string" || !token) throw new Error("Missing staff token");

    const session = await staffBackendRequest("/auth/session", { token });
    if (session.status === 401 || session.status === 403) {
      return NextResponse.json({ message: "This account does not have staff access." }, {
        status: session.status,
        headers,
      });
    }
    if (!session.ok) throw new Error("Staff session verification failed");

    const user: AdminSession = await session.json();
    const response = NextResponse.json({ user }, { headers });
    response.cookies.set(staffSessionCookie, token, { ...staffCookieOptions, maxAge: 86_400 });
    return response;
  } catch {
    return NextResponse.json({ message: "The authentication service is unavailable. Please try again." }, {
      status: 503,
      headers,
    });
  }
}
