import { createHash, timingSafeEqual } from "node:crypto";
import { notificationEmitter } from "@/lib/notifications";

const events = new Set(["BOOKING_CREATED", "CLOCK_IN_REMINDER", "CLOCK_OUT_REMINDER"]);
const digest = (value: string) => createHash("sha256").update(value).digest();

export async function POST(request: Request) {
  const secret = process.env.NOTIFICATION_WEBHOOK_SECRET;
  if (!secret || secret.length < 32) return new Response(null, { status: 404 });

  const authorization = request.headers.get("authorization") ?? "";
  if (!timingSafeEqual(digest(authorization), digest("Bearer " + secret))) {
    return new Response(null, { status: 401 });
  }

  try {
    const body = await request.json();
    if (typeof body?.event !== "string" || !events.has(body.event)) {
      return new Response(null, { status: 400 });
    }
    notificationEmitter.emit("notification", {
      event: body.event,
      payload: {},
      timestamp: new Date().toISOString(),
    });
    return new Response(null, { status: 204 });
  } catch {
    return new Response(null, { status: 400 });
  }
}
