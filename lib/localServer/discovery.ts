import { Buffer } from 'buffer';
import dgram from 'react-native-udp';
import * as Network from 'expo-network';
import {
  DISCOVERY_TIMEOUT_MS,
  UDP_BROADCAST_ADDRESS,
  UDP_DISCOVERY_PORT,
} from './config';
import {
  DiscoveryRequest,
  DiscoveryResponse,
  isDiscoveryRequest,
  isDiscoveryResponse,
} from './protocol';

interface RemoteInfo {
  address: string;
  port: number;
  family: string;
  size: number;
}

// react-native-udp's UdpSocket extends the Node `events` EventEmitter, whose
// on/once/emit aren't visible without @types/node (which we deliberately
// don't add — it can shadow RN's own global timer types elsewhere). This
// narrow structural type covers only what we actually call.
interface DiscoverySocket {
  bind(port: number, address: undefined, callback: () => void): void;
  send(msg: string, offset: undefined, length: undefined, port: number, address: string): void;
  close(): void;
  setBroadcast(flag: boolean): void;
  on(event: 'message', handler: (msg: Buffer, rinfo: RemoteInfo) => void): void;
  once(event: 'error', handler: (err: Error) => void): void;
}

function createUdpSocket(): DiscoverySocket {
  return dgram.createSocket({ type: 'udp4' }) as unknown as DiscoverySocket;
}

interface DiscoveryResponderParams {
  code: string;
  tcpPort: number;
  getServerName: () => string;
  getPlayerCount: () => number;
  getMaxPlayers: () => number;
}

/** Host side: answers "who has code XXXXXX?" broadcasts on the LAN. */
export function startDiscoveryResponder(params: DiscoveryResponderParams): { stop: () => void } {
  const socket = createUdpSocket();
  let closed = false;

  socket.once('error', () => {
    // Discovery is a convenience path (QR join still works without it) —
    // swallow errors here rather than surface them as fatal.
  });

  socket.bind(UDP_DISCOVERY_PORT, undefined, () => {
    try {
      socket.setBroadcast(true);
    } catch {
      // best-effort
    }
  });

  socket.on('message', (msg, rinfo) => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(msg.toString('utf8'));
    } catch {
      return;
    }
    if (!isDiscoveryRequest(parsed)) return;
    if (parsed.code.toUpperCase() !== params.code.toUpperCase()) return;

    Network.getIpAddressAsync()
      .then((ip) => {
        if (closed) return;
        const response: DiscoveryResponse = {
          type: 'laylatwaraq_server',
          code: params.code,
          serverName: params.getServerName(),
          ip,
          port: params.tcpPort,
          playerCount: params.getPlayerCount(),
          maxPlayers: params.getMaxPlayers(),
        };
        socket.send(JSON.stringify(response), undefined, undefined, rinfo.port, rinfo.address);
      })
      .catch(() => {});
  });

  return {
    stop: () => {
      closed = true;
      try {
        socket.close();
      } catch {
        // already closed
      }
    },
  };
}

/** Client side: broadcasts "who has code XXXXXX?" and waits for a matching reply. */
export function discoverServerByCode(
  code: string,
  timeoutMs = DISCOVERY_TIMEOUT_MS
): Promise<DiscoveryResponse | null> {
  return new Promise((resolve) => {
    const socket = createUdpSocket();
    let settled = false;

    const finish = (result: DiscoveryResponse | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        socket.close();
      } catch {
        // already closed
      }
      resolve(result);
    };

    const timer = setTimeout(() => finish(null), timeoutMs);

    socket.once('error', () => finish(null));

    socket.on('message', (msg) => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(msg.toString('utf8'));
      } catch {
        return;
      }
      if (!isDiscoveryResponse(parsed)) return;
      if (parsed.code.toUpperCase() !== code.toUpperCase()) return;
      finish(parsed);
    });

    socket.bind(0, undefined, () => {
      try {
        socket.setBroadcast(true);
      } catch {
        finish(null);
        return;
      }
      const request: DiscoveryRequest = { type: 'laylatwaraq_discover', code };
      socket.send(JSON.stringify(request), undefined, undefined, UDP_DISCOVERY_PORT, UDP_BROADCAST_ADDRESS);
    });
  });
}
