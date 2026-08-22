import { Redirect, Stack } from 'expo-router';
import { useAuthStore } from '@/store/authStore';

export default function GameLayout() {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Redirect href="/(auth)/login" />;

  return <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />;
}
