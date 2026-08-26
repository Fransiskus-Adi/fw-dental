import { NextResponse } from "next/server";
import { notificationEmitter } from "@/lib/notifications";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { event, payload, timestamp } = body;

    if (!event) {
      return NextResponse.json({ error: "Missing event name" }, { status: 400 });
    }

    // Emit the notification event to all listening client SSE connections
    notificationEmitter.emit("notification", { event, payload, timestamp });

    return NextResponse.json({ success: true, message: "Notification broadcasted" });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Invalid request body" },
      { status: 400 }
    );
  }
}
