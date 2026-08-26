import { notificationEmitter } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function GET() {
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
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
    },
  });
}
