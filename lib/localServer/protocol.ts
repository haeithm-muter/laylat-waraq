export type RulesMode = 'random' | 'manual' | 'off';

export interface ServerSettings {
  serverName: string;
  /** 4-digit PIN — the sole join credential, chosen or auto-generated at creation. */
  code: string;
  maxPlayers: number;
  questionTimeSec: number;
  rulesMode: RulesMode;
  rulesMandatory: boolean;
}

export interface LobbyPlayer {
  id: string;
  name: string;
  isHost: boolean;
  connected: boolean;
}

export type LobbyPhase = 'lobby' | 'category_select' | 'starting';

export interface LobbySnapshot {
  serverName: string;
  code: string;
  maxPlayers: number;
  questionTimeSec: number;
  rulesMode: RulesMode;
  rulesMandatory: boolean;
  players: LobbyPlayer[];
  selectedCategoryIds: string[];
  phase: LobbyPhase;
}

// ---- TCP game-channel protocol (newline-delimited JSON) ----

export type ClientToHostMessage =
  | { type: 'join_request'; name: string; code: string }
  | { type: 'leave' }
  | { type: 'ping' };

export type HostToClientMessage =
  | { type: 'join_accepted'; playerId: string; snapshot: LobbySnapshot }
  | { type: 'join_rejected'; reason: 'wrong_code' | 'server_full' | 'name_taken' | 'invalid' }
  | { type: 'lobby_update'; snapshot: LobbySnapshot }
  | { type: 'kicked' }
  | { type: 'host_closed' }
  | { type: 'pong' };

// ---- UDP discovery protocol (code -> host IP resolution) ----

export interface DiscoveryRequest {
  type: 'laylatwaraq_discover';
  code: string;
}

export interface DiscoveryResponse {
  type: 'laylatwaraq_server';
  code: string;
  serverName: string;
  ip: string;
  port: number;
  playerCount: number;
  maxPlayers: number;
}

/** Payload encoded into the join QR code. */
export interface QrJoinPayload {
  app: 'laylatwaraq';
  code: string;
  ip: string;
  port: number;
}

export function isQrJoinPayload(value: unknown): value is QrJoinPayload {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Partial<QrJoinPayload>;
  return v.app === 'laylatwaraq' && typeof v.code === 'string' && typeof v.ip === 'string' && typeof v.port === 'number';
}

export function isDiscoveryRequest(value: unknown): value is DiscoveryRequest {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { type?: unknown }).type === 'laylatwaraq_discover'
  );
}

export function isDiscoveryResponse(value: unknown): value is DiscoveryResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { type?: unknown }).type === 'laylatwaraq_server'
  );
}
