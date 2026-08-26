import { EventEmitter } from "events";

declare global {
  var notificationEmitter: EventEmitter | undefined;
}

if (!globalThis.notificationEmitter) {
  globalThis.notificationEmitter = new EventEmitter();
  globalThis.notificationEmitter.setMaxListeners(100);
}

export const notificationEmitter = globalThis.notificationEmitter;
