import { create } from 'zustand';
import { HostServer } from '@/lib/localServer/HostServer';
import { ClientConnection } from '@/lib/localServer/ClientConnection';
import { discoverServerByCode } from '@/lib/localServer/discovery';
import {
  LobbyPlayer,
  LobbySnapshot,
  RulesMode,
  ServerSettings,
} from '@/lib/localServer/protocol';
import { TOPICS_PER_GAME } from '@/content/topics';

export type ServerRole = 'host' | 'client' | 'local' | null;
export type ServerStatus = 'idle' | 'connecting' | 'lobby' | 'category_select' | 'starting' | 'error';

interface ServerState {
  role: ServerRole;
  status: ServerStatus;
  error: string | null;

  serverName: string;
  code: string;
  ip: string;
  port: number;
  maxPlayers: number;
  questionTimeSec: number;
  rulesMode: RulesMode;
  rulesMandatory: boolean;
  players: LobbyPlayer[];
  selectedCategoryIds: string[];

  myPlayerId: string | null;
  isHost: boolean;

  /** مع الأصدقاء — same device, no networking. */
  friendNames: [string, string];

  createServer: (settings: ServerSettings, hostName: string) => Promise<void>;
  joinByQr: (params: { ip: string; port: number; code: string }, name: string) => Promise<void>;
  joinByCode: (code: string, name: string) => Promise<void>;
  toggleCategory: (categoryId: string) => void;
  updateGameSettings: (
    partial: Partial<Pick<ServerState, 'maxPlayers' | 'questionTimeSec' | 'rulesMode' | 'rulesMandatory'>>
  ) => void;
  goToCategorySelect: () => void;
  backToLobby: () => void;
  startGame: () => void;
  leaveServer: () => void;
  setFriendNames: (p1: string, p2: string) => void;
  clearError: () => void;
  reset: () => void;
}

let hostServer: HostServer | null = null;
let clientConnection: ClientConnection | null = null;

function applySnapshot(snapshot: LobbySnapshot): Partial<ServerState> {
  return {
    serverName: snapshot.serverName,
    code: snapshot.code,
    maxPlayers: snapshot.maxPlayers,
    questionTimeSec: snapshot.questionTimeSec,
    rulesMode: snapshot.rulesMode,
    rulesMandatory: snapshot.rulesMandatory,
    players: snapshot.players,
    selectedCategoryIds: snapshot.selectedCategoryIds,
    status: snapshot.phase,
  };
}

const initialState = {
  role: null as ServerRole,
  status: 'idle' as ServerStatus,
  error: null as string | null,
  serverName: '',
  code: '',
  ip: '',
  port: 0,
  maxPlayers: 5,
  questionTimeSec: 40,
  rulesMode: 'random' as RulesMode,
  rulesMandatory: true,
  players: [] as LobbyPlayer[],
  selectedCategoryIds: [] as string[],
  myPlayerId: null as string | null,
  isHost: false,
  friendNames: ['', ''] as [string, string],
};

export const useServerStore = create<ServerState>()((set, get) => ({
  ...initialState,

  createServer: async (settings, hostName) => {
    get().reset();
    set({ role: 'host', status: 'connecting', error: null });

    const server = new HostServer(settings, hostName);
    hostServer = server;
    server.on('lobby_update', (snapshot) => set(applySnapshot(snapshot)));
    server.on('error', (message) => set({ status: 'error', error: message }));

    try {
      const { code, ip, port } = await server.start();
      set({
        ...applySnapshot(server.getSnapshot()),
        code,
        ip,
        port,
        myPlayerId: server.hostId,
        isHost: true,
        status: 'lobby',
      });
    } catch {
      hostServer = null;
      set({ status: 'error', error: 'تعذر إنشاء السيرفر، تحقق من اتصال الواي فاي وحاول مرة أخرى' });
    }
  },

  joinByQr: async ({ ip, port, code }, name) => {
    get().reset();
    set({ role: 'client', status: 'connecting', error: null, ip, port, code });
    await connectClient(ip, port, name, code, set);
  },

  joinByCode: async (code, name) => {
    get().reset();
    const trimmedCode = code.trim();
    set({ role: 'client', status: 'connecting', error: null, code: trimmedCode });

    const found = await discoverServerByCode(trimmedCode);
    if (!found) {
      set({ status: 'error', error: 'ما لقينا سيرفر بهذا الرمز — تأكد إنكم على نفس شبكة الواي فاي' });
      return;
    }
    set({ ip: found.ip, port: found.port });
    await connectClient(found.ip, found.port, name, trimmedCode, set);
  },

  toggleCategory: (categoryId) => {
    const current = get().selectedCategoryIds;
    const isSelected = current.includes(categoryId);
    // Exactly TOPICS_PER_GAME topics per game — ignore attempts to add a
    // 7th rather than silently bumping something else off the list.
    if (!isSelected && current.length >= TOPICS_PER_GAME) return;
    const next = isSelected
      ? current.filter((id) => id !== categoryId)
      : [...current, categoryId];
    // Local state is the source of truth for the UI regardless of network
    // state; syncing to connected clients is a best-effort side effect.
    set({ selectedCategoryIds: next });
    hostServer?.setSelectedCategories(next);
  },

  updateGameSettings: (partial) => {
    // Same best-effort pattern as toggleCategory: local state updates
    // immediately, the running server (if any) is patched as a side effect.
    set(partial);
    hostServer?.updateSettings(partial);
  },

  goToCategorySelect: () => {
    hostServer?.setPhase('category_select');
    set({ status: 'category_select' });
  },

  backToLobby: () => {
    hostServer?.setPhase('lobby');
    set({ status: 'lobby' });
  },

  startGame: () => {
    hostServer?.setPhase('starting');
    set({ status: 'starting' });
  },

  leaveServer: () => {
    hostServer?.close();
    hostServer = null;
    clientConnection?.leave();
    clientConnection = null;
    set({ ...initialState });
  },

  setFriendNames: (p1, p2) => set({ role: 'local', friendNames: [p1, p2] }),

  clearError: () => set({ error: null }),

  reset: () => {
    hostServer?.close();
    hostServer = null;
    clientConnection?.leave();
    clientConnection = null;
    set({ ...initialState });
  },
}));

async function connectClient(
  ip: string,
  port: number,
  name: string,
  code: string,
  set: (partial: Partial<ServerState>) => void
) {
  const connection = new ClientConnection();
  clientConnection = connection;
  connection.on('lobby_update', (snapshot) => set(applySnapshot(snapshot)));
  connection.on('kicked', () => set({ status: 'error', error: 'تم إخراجك من السيرفر' }));
  connection.on('host_closed', () => set({ status: 'error', error: 'المضيف أنهى السيرفر' }));
  // Unexpected drop (wifi loss, host crash, etc.) — 'kicked'/'host_closed'
  // above already cover the intentional teardown paths and won't double-fire
  // this (see ClientConnection's expectedDisconnect flag).
  connection.on('disconnected', () =>
    set({ status: 'error', error: 'انقطع الاتصال بالسيرفر — تحقق من الواي فاي وحاول الانضمام من جديد' })
  );

  try {
    const { playerId, snapshot } = await connection.connect(ip, port, name, code);
    set({ ...applySnapshot(snapshot), myPlayerId: playerId, isHost: false, status: 'lobby' });
  } catch (err) {
    clientConnection = null;
    set({ status: 'error', error: mapJoinError(err) });
  }
}

function mapJoinError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  switch (message) {
    case 'wrong_code':
      return 'رمز الدخول غير صحيح';
    case 'server_full':
      return 'السيرفر مكتمل العدد';
    case 'name_taken':
      return 'الاسم مستخدم بالفعل، جرب اسم ثاني';
    case 'connection_closed':
      return 'تعذر الاتصال بالسيرفر';
    default:
      return 'تعذر الاتصال — تأكد إنكم على نفس شبكة الواي فاي';
  }
}
