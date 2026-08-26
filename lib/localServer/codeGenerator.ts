/** 4-digit numeric PIN — doubles as the LAN discovery key and the join credential. */
export function generateAccessCode(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export function generatePlayerId(): string {
  return `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
