import type { NextRequest } from "next/server";

export const staffSessionCookie = "staff_session";
export const staffCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
} as const;

export function isSameOrigin(request: NextRequest) {
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite) return fetchSite === "same-origin";

  const origin = request.headers.get("origin");
  if (!origin) return false;
  if (origin === request.nextUrl.origin) return true;
  try {
    const url = new URL(origin);
    return (url.protocol === "https:" || url.protocol === "http:") &&
      url.host === request.headers.get("host");
  } catch {
    return false;
  }
}

export function staffBackendRequest(
  path: string,
  { token, request }: { token?: string; request?: NextRequest } = {},
) {
  const backend = (process.env.BACKEND_URL ?? "http://localhost:3001").replace(/\/$/, "");
  const headers = new Headers();
  if (token) headers.set("Authorization", "Bearer " + token);
  const contentType = request?.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);

  const method = request?.method ?? "GET";
  const body = method === "GET" || method === "HEAD" ? undefined : request?.body;
  const timeout = AbortSignal.timeout(10_000);
  const options: RequestInit & { duplex?: "half" } = {
    method,
    headers,
    ...(body && { body, duplex: "half" }),
    cache: "no-store",
    redirect: "error",
    signal: request ? AbortSignal.any([request.signal, timeout]) : timeout,
  };
  return fetch(backend + path, options);
}
