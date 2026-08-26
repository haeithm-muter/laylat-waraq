/**
 * Minimal typed pub/sub — avoids pulling in a dependency for a handful of
 * named events. `Events` maps event name -> handler argument tuple, e.g.
 * `{ lobby_update: [LobbySnapshot] }`.
 */
export class Emitter<Events extends object> {
  private listeners: { [K in keyof Events]?: Set<(...args: Events[K] & unknown[]) => void> } = {};

  on<K extends keyof Events>(event: K, handler: (...args: Events[K] & unknown[]) => void): () => void {
    const set = this.listeners[event] ?? new Set();
    set.add(handler);
    this.listeners[event] = set;
    return () => set.delete(handler);
  }

  emit<K extends keyof Events>(event: K, ...args: Events[K] & unknown[]) {
    this.listeners[event]?.forEach((handler) => handler(...args));
  }

  removeAllListeners() {
    this.listeners = {};
  }
}
