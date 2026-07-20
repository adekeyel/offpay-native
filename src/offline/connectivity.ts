type Listener = (isOnline: boolean) => void;

// Starts optimistic (true) so nothing shows a false "you're offline" flash
// before the app has made its first API call.
let isOnline = true;
const listeners = new Set<Listener>();

export function getIsOnline(): boolean {
  return isOnline;
}

/**
 * Called from api/client.ts whenever a request either reaches the server
 * (success or a normal HTTP error — both mean the network path works) or
 * fails to reach it at all (no signal, DNS failure, etc). Deliberately not
 * based on a device-level "is wifi/cellular connected" native check —
 * that's often a false positive (connected to a wifi with no real
 * internet), whereas "can we actually reach our own backend" is the signal
 * that matters for gating network-only features.
 */
export function setIsOnline(next: boolean): void {
  if (next === isOnline) return;
  isOnline = next;
  listeners.forEach((listener) => listener(next));
}

export function subscribeToConnectivity(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
