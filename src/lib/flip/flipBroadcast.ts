/**
 * In-memory SSE broadcast manager for flip rooms.
 * Uses globalThis to ensure a single shared Map across all Next.js route handlers.
 */

const globalForBroadcast = globalThis as unknown as {
  _flipTierListeners?: Map<string, Set<ReadableStreamDefaultController>>;
};

if (!globalForBroadcast._flipTierListeners) {
  globalForBroadcast._flipTierListeners = new Map();
}

const tierListeners = globalForBroadcast._flipTierListeners;
const encoder = new TextEncoder();

export function addListener(tier: string, controller: ReadableStreamDefaultController): void {
  if (!tierListeners.has(tier)) {
    tierListeners.set(tier, new Set());
  }
  tierListeners.get(tier)!.add(controller);
}

export function removeListener(tier: string, controller: ReadableStreamDefaultController): void {
  const listeners = tierListeners.get(tier);
  if (!listeners) return;
  listeners.delete(controller);
  if (listeners.size === 0) {
    tierListeners.delete(tier);
  }
}

export function broadcastToTier(tier: string, event: string, data: unknown): void {
  const listeners = tierListeners.get(tier);
  if (!listeners || listeners.size === 0) return;

  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  const encoded = encoder.encode(payload);

  for (const controller of listeners) {
    try {
      controller.enqueue(encoded);
    } catch {
      listeners.delete(controller);
    }
  }
}

export function getListenerCount(tier: string): number {
  return tierListeners.get(tier)?.size ?? 0;
}
