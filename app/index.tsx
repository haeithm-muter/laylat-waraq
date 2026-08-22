import { Redirect } from 'expo-router';
import { useAuthStore } from '@/store/authStore';

/**
 * Entry route. app/_layout.tsx only mounts the Stack once fonts are loaded
 * and the first Firebase auth check has resolved, so `user` here already
 * reflects the real signed-in state — no flash of the wrong screen.
 */
export default function Index() {
  const user = useAuthStore((s) => s.user);
  return <Redirect href={user ? '/(game)/home' : '/(auth)/login'} />;
}
