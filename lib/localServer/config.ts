// Arbitrary fixed ports in the private/dynamic range (49152–65535) so they
// don't collide with common services on the host device.
export const TCP_GAME_PORT = 57591;
export const UDP_DISCOVERY_PORT = 57592;
export const UDP_BROADCAST_ADDRESS = '255.255.255.255';
export const DISCOVERY_TIMEOUT_MS = 5000;
export const RECONNECT_GRACE_MS = 30000; // PRD §5.1 — 30s before a dropped player's turn is skipped
