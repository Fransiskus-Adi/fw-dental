import { NextResponse, type NextRequest } from "next/server";
import { getAdminPagePermission, type AdminSession } from "@/lib/admin-access";
import { staffBackendRequest, staffSessionCookie } from "@/lib/staff-session";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/admin/login" || pathname === "/admin/access-denied") {
    return NextResponse.next();
  }

  const token = request.cookies.get(staffSessionCookie)?.value;
  const goTo = (path: string) => {
    const url = request.nextUrl.clone();
    url.pathname = path;
    url.search = "";
    const response = NextResponse.redirect(url);
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  };

  if (!token) return goTo("/admin/login");

  try {
    const session = await staffBackendRequest("/auth/session", { token });
    if (session.status === 401) return goTo("/admin/login");
    if (session.status === 403) return goTo("/admin/access-denied");
    if (session.ok) {
      const { permissions }: AdminSession = await session.json();
      const permission = getAdminPagePermission(pathname);
      if (permission && permissions?.[permission] !== true) {
        return goTo("/admin/access-denied");
      }
      const response = NextResponse.next();
      response.headers.set("Cache-Control", "private, no-store");
      return response;
    }
  } catch {
    // An unavailable session service cannot authorize dashboard access.
  }

  return new NextResponse("The staff session could not be verified. Please try again.", {
    status: 503,
    headers: { "Cache-Control": "private, no-store" },
  });
}

export const config = { matcher: ["/admin/:path*"] };
