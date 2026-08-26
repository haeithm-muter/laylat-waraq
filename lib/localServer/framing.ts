/**
 * TCP is a byte stream, not a message stream — a single `data` event can
 * contain part of a message, several messages, or a message split across
 * two events. We frame each JSON message with a trailing `\n` and buffer
 * incoming text until we see a full line.
 */
export function encodeMessage<T>(message: T): string {
  return JSON.stringify(message) + '\n';
}

export class LineBuffer {
  private buffer = '';

  /** Feed a chunk of incoming text; returns any complete lines it now contains. */
  push(chunk: string): string[] {
    this.buffer += chunk;
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() ?? '';
    return lines.filter((line) => line.length > 0);
  }

  clear() {
    this.buffer = '';
  }
}
