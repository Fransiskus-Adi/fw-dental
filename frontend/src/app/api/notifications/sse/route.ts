import { notificationEmitter } from "@/lib/notifications";
import { staffBackendRequest, staffSessionCookie } from "@/lib/staff-session";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(staffSessionCookie)?.value;
  if (!token) return new Response(null, { status: 401 });

  try {
    const access = await staffBackendRequest("/auth/notification-access", { token, request });
    if (!access.ok) return new Response(null, { status: access.status });
  } catch {
    return new Response(null, { status: 503 });
  }

  const encoder = new TextEncoder();
  let cleanup: (() => void) | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const listener = (data: any) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch (err) {
          // Stream is closed, listener cleanup is triggered
        }
      };

      notificationEmitter.on("notification", listener);

      // Send initial handshake
      controller.enqueue(encoder.encode(": ok\n\n"));

      cleanup = () => {
        notificationEmitter.off("notification", listener);
      };
    },
    cancel() {
      if (cleanup) {
        cleanup();
      }
    },
  }, { highWaterMark: 8 });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
    },
  });
}
