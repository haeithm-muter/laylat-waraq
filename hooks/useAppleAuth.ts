import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { signInWithAppleIdToken } from '@/lib/auth';
import { mapAuthErrorToArabic } from '@/utils/authErrors';

/** Drives Sign in with Apple (iOS only) and completes Firebase sign-in on success. */
export function useAppleAuth() {
  const [available, setAvailable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    AppleAuthentication.isAvailableAsync().then(setAvailable);
  }, []);

  const signIn = async () => {
    setError(null);
    setLoading(true);
    try {
      const rawNonce = Crypto.randomUUID();
      const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });

      if (!credential.identityToken) {
        throw new Error('missing-identity-token');
      }

      await signInWithAppleIdToken(credential.identityToken, rawNonce);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === 'ERR_REQUEST_CANCELED') {
        // user dismissed the sheet — not an error worth surfacing
      } else {
        setError(mapAuthErrorToArabic(err));
      }
    } finally {
      setLoading(false);
    }
  };

  return { signIn, available, loading, error, clearError: () => setError(null) };
}
