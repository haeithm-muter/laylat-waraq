import TcpSockets from 'react-native-tcp-socket';
import { Emitter } from './emitter';
import { LineBuffer, encodeMessage } from './framing';
import { ClientToHostMessage, HostToClientMessage, LobbySnapshot } from './protocol';

type TcpSocket = ReturnType<typeof TcpSockets.createConnection>;

const CONNECT_TIMEOUT_MS = 8000;

interface ClientEvents {
  lobby_update: [LobbySnapshot];
  kicked: [];
  host_closed: [];
  disconnected: [];
}

export class ClientConnection {
  private socket: TcpSocket | null = null;
  private buffer = new LineBuffer();
  private emitter = new Emitter<ClientEvents>();
  // Set right before we tear down the socket ourselves (leave/kicked/
  // host_closed) so the 'close' handler below can tell "we did this on
  // purpose" apart from a genuine unexpected drop (wifi loss, host crash)
  // and only emit 'disconnected' for the latter.
  private expectedDisconnect = false;

  on<K extends keyof ClientEvents>(event: K, handler: (...args: ClientEvents[K]) => void) {
    return this.emitter.on(event, handler);
  }

  connect(
    ip: string,
    port: number,
    name: string,
    code: string
  ): Promise<{ playerId: string; snapshot: LobbySnapshot }> {
    return new Promise((resolve, reject) => {
      let settled = false;
      const settle = (fn: () => void) => {
        if (settled) return;
        settled = true;
        fn();
      };

      const socket = TcpSockets.createConnection(
        { port, host: ip, interface: 'wifi', connectTimeout: CONNECT_TIMEOUT_MS },
        () => {
          socket.write(encodeMessage<ClientToHostMessage>({ type: 'join_request', name, code }));
        }
      );
      socket.setEncoding('utf8');
      this.socket = socket;

      socket.on('data', (chunk) => {
        const lines = this.buffer.push(String(chunk));
        for (const line of lines) {
          let msg: HostToClientMessage;
          try {
            msg = JSON.parse(line);
          } catch {
            continue;
          }
          this.handleMessage(msg, { settle, resolve, reject });
        }
      });

      socket.on('error', (err: Error) => {
        settle(() => reject(err));
      });

      socket.on('close', () => {
        settle(() => reject(new Error('connection_closed')));
        if (!this.expectedDisconnect) {
          this.emitter.emit('disconnected');
        }
      });
    });
  }

  private handleMessage(
    msg: HostToClientMessage,
    ctx: {
      settle: (fn: () => void) => void;
      resolve: (value: { playerId: string; snapshot: LobbySnapshot }) => void;
      reject: (reason: Error) => void;
    }
  ) {
    switch (msg.type) {
      case 'join_accepted':
        ctx.settle(() => ctx.resolve({ playerId: msg.playerId, snapshot: msg.snapshot }));
        break;
      case 'join_rejected':
        ctx.settle(() => ctx.reject(new Error(msg.reason)));
        break;
      case 'lobby_update':
        this.emitter.emit('lobby_update', msg.snapshot);
        break;
      case 'kicked':
        this.expectedDisconnect = true;
        this.emitter.emit('kicked');
        this.disconnect();
        break;
      case 'host_closed':
        this.expectedDisconnect = true;
        this.emitter.emit('host_closed');
        this.disconnect();
        break;
      case 'pong':
        break;
    }
  }

  leave() {
    if (!this.socket) return;
    this.expectedDisconnect = true;
    try {
      this.socket.write(encodeMessage<ClientToHostMessage>({ type: 'leave' }));
    } catch {
      // socket already going away
    }
    this.disconnect();
  }

  disconnect() {
    this.socket?.destroy();
    this.socket = null;
    this.buffer.clear();
  }
}
