import { Redirect, Stack } from 'expo-router';
import { useAuthStore } from '@/store/authStore';

export default function AuthLayout() {
  const user = useAuthStore((s) => s.user);
  if (user) return <Redirect href="/(game)/home" />;

  return <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />;
}
