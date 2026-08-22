import * as ScreenOrientation from 'expo-screen-orientation';

/** Forces landscape at runtime — needed in Expo Go, which ignores app.json's native orientation lock and config plugins. */
export async function lockLandscape() {
  try {
    await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
  } catch {
    // Unsupported on this platform (e.g. web) — safe to ignore.
  }
}
