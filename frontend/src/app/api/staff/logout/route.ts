import { NextResponse, type NextRequest } from "next/server";
import { isSameOrigin, staffCookieOptions, staffSessionCookie } from "@/lib/staff-session";

export function POST(request: NextRequest) {
  const headers = { "Cache-Control": "private, no-store" };
  if (!isSameOrigin(request)) return new Response(null, { status: 403, headers });

  const response = new NextResponse(null, { status: 204, headers });
  response.cookies.set(staffSessionCookie, "", { ...staffCookieOptions, maxAge: 0 });
  return response;
}
