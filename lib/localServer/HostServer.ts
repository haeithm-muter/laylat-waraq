import TcpSockets from 'react-native-tcp-socket';
import * as Network from 'expo-network';
import { Emitter } from './emitter';
import { LineBuffer, encodeMessage } from './framing';
import { generatePlayerId } from './codeGenerator';
import { startDiscoveryResponder } from './discovery';
import { TCP_GAME_PORT } from './config';
import {
  ClientToHostMessage,
  HostToClientMessage,
  LobbyPlayer,
  LobbyPhase,
  LobbySnapshot,
  ServerSettings,
} from './protocol';

type TcpServer = ReturnType<typeof TcpSockets.createServer>;
type TcpSocket = ReturnType<typeof TcpSockets.createConnection>;

interface Connection {
  socket: TcpSocket;
}

interface HostServerEvents {
  lobby_update: [LobbySnapshot];
  error: [string];
}

export class HostServer {
  private server: TcpServer | null = null;
  private discovery: { stop: () => void } | null = null;
  private connections = new Map<string, Connection>();
  private players = new Map<string, LobbyPlayer>();
  private settings: ServerSettings;
  private code: string;
  private selectedCategoryIds: string[] = [];
  private phase: LobbyPhase = 'lobby';
  private emitter = new Emitter<HostServerEvents>();
  private hostPlayerId = generatePlayerId();

  constructor(settings: ServerSettings, hostName: string) {
    this.settings = settings;
    this.code = settings.code;
    this.players.set(this.hostPlayerId, {
      id: this.hostPlayerId,
      name: hostName,
      isHost: true,
      connected: true,
    });
  }

  get serverCode() {
    return this.code;
  }

  get hostId() {
    return this.hostPlayerId;
  }

  on<K extends keyof HostServerEvents>(event: K, handler: (...args: HostServerEvents[K]) => void) {
    return this.emitter.on(event, handler);
  }

  getSnapshot(): LobbySnapshot {
    return {
      serverName: this.settings.serverName,
      code: this.code,
      maxPlayers: this.settings.maxPlayers,
      questionTimeSec: this.settings.questionTimeSec,
      rulesMode: this.settings.rulesMode,
      rulesMandatory: this.settings.rulesMandatory,
      players: Array.from(this.players.values()),
      selectedCategoryIds: this.selectedCategoryIds,
      phase: this.phase,
    };
  }

  start(): Promise<{ code: string; ip: string; port: number }> {
    return new Promise((resolve, reject) => {
      const server = TcpSockets.createServer((socket) => this.handleConnection(socket));
      let started = false;

      // Persistent (not `.once`) so errors after a successful start — not
      // just startup failures like EADDRINUSE — still surface to the store.
      server.on('error', (err: Error) => {
        this.emitter.emit('error', err.message || 'server_error');
        if (!started) reject(err);
      });

      server.listen({ port: TCP_GAME_PORT, host: '0.0.0.0' }, async () => {
        this.server = server;
        try {
          const ip = await Network.getIpAddressAsync();
          this.discovery = startDiscoveryResponder({
            code: this.code,
            tcpPort: TCP_GAME_PORT,
            getServerName: () => this.settings.serverName,
            getPlayerCount: () => this.players.size,
            getMaxPlayers: () => this.settings.maxPlayers,
          });
          started = true;
          resolve({ code: this.code, ip, port: TCP_GAME_PORT });
        } catch (err) {
          reject(err);
        }
      });
    });
  }

  setSelectedCategories(categoryIds: string[]) {
    this.selectedCategoryIds = categoryIds;
    this.broadcastLobbyUpdate();
  }

  /** Host adjusts game settings from inside the lobby, after the server is already up. */
  updateSettings(partial: Partial<Pick<ServerSettings, 'maxPlayers' | 'questionTimeSec' | 'rulesMode' | 'rulesMandatory'>>) {
    this.settings = { ...this.settings, ...partial };
    this.broadcastLobbyUpdate();
  }

  setPhase(phase: LobbyPhase) {
    this.phase = phase;
    this.broadcastLobbyUpdate();
  }

  close() {
    this.discovery?.stop();
    this.discovery = null;
    for (const { socket } of this.connections.values()) {
      try {
        socket.write(encodeMessage<HostToClientMessage>({ type: 'host_closed' }));
        socket.destroy();
      } catch {
        // already gone
      }
    }
    this.connections.clear();
    this.server?.close();
    this.server = null;
  }

  private handleConnection(socket: TcpSocket) {
    socket.setEncoding('utf8');
    const buffer = new LineBuffer();
    let playerId: string | null = null;

    socket.on('data', (chunk) => {
      const lines = buffer.push(String(chunk));
      for (const line of lines) {
        let msg: ClientToHostMessage;
        try {
          msg = JSON.parse(line);
        } catch {
          continue;
        }

        if (!playerId) {
          if (msg.type === 'join_request') {
            playerId = this.handleJoinRequest(socket, msg);
          }
          continue;
        }

        this.handleClientMessage(playerId, msg, socket);
      }
    });

    const onDisconnect = () => {
      if (playerId) this.handlePlayerLeft(playerId);
    };
    socket.on('close', onDisconnect);
    socket.on('error', onDisconnect);
  }

  private handleJoinRequest(socket: TcpSocket, msg: Extract<ClientToHostMessage, { type: 'join_request' }>): string | null {
    const name = msg.name?.trim();

    const reject = (reason: Extract<HostToClientMessage, { type: 'join_rejected' }>['reason']) => {
      socket.write(encodeMessage<HostToClientMessage>({ type: 'join_rejected', reason }));
      socket.end();
      return null;
    };

    if (!name) return reject('invalid');
    if (msg.code !== this.code) return reject('wrong_code');
    if (this.players.size >= this.settings.maxPlayers) return reject('server_full');

    const nameTaken = Array.from(this.players.values()).some(
      (p) => p.name.trim().toLowerCase() === name.toLowerCase()
    );
    if (nameTaken) return reject('name_taken');

    const playerId = generatePlayerId();
    const player: LobbyPlayer = { id: playerId, name, isHost: false, connected: true };
    this.players.set(playerId, player);
    this.connections.set(playerId, { socket });

    socket.write(
      encodeMessage<HostToClientMessage>({ type: 'join_accepted', playerId, snapshot: this.getSnapshot() })
    );
    this.broadcastLobbyUpdate(playerId);
    return playerId;
  }

  private handleClientMessage(playerId: string, msg: ClientToHostMessage, socket: TcpSocket) {
    if (msg.type === 'leave') {
      this.handlePlayerLeft(playerId);
      socket.end();
    } else if (msg.type === 'ping') {
      socket.write(encodeMessage<HostToClientMessage>({ type: 'pong' }));
    }
  }

  private handlePlayerLeft(playerId: string) {
    if (!this.players.has(playerId)) return;
    this.players.delete(playerId);
    this.connections.delete(playerId);
    this.broadcastLobbyUpdate();
  }

  /** @param excludePlayerId Skip a just-joined player who already got the snapshot via join_accepted. */
  private broadcastLobbyUpdate(excludePlayerId?: string) {
    const snapshot = this.getSnapshot();
    this.emitter.emit('lobby_update', snapshot);
    const message = encodeMessage<HostToClientMessage>({ type: 'lobby_update', snapshot });
    for (const [playerId, { socket }] of this.connections) {
      if (playerId === excludePlayerId) continue;
      try {
        socket.write(message);
      } catch {
        // socket likely closing — the 'close'/'error' handlers will clean it up
      }
    }
  }
}
