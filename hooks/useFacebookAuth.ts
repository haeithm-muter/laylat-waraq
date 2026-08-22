import { useEffect, useState } from 'react';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { signInWithFacebookAccessToken } from '@/lib/auth';
import { mapAuthErrorToArabic } from '@/utils/authErrors';

WebBrowser.maybeCompleteAuthSession();

const FACEBOOK_DISCOVERY: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: 'https://www.facebook.com/v19.0/dialog/oauth',
  tokenEndpoint: 'https://graph.facebook.com/v19.0/oauth/access_token',
};

const FACEBOOK_APP_ID = process.env.EXPO_PUBLIC_FACEBOOK_APP_ID ?? '';

/** Drives the Facebook login dialog and completes Firebase sign-in on success. */
export function useFacebookAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'laylatwaraq' });

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: FACEBOOK_APP_ID,
      scopes: ['public_profile', 'email'],
      responseType: AuthSession.ResponseType.Token,
      redirectUri,
    },
    FACEBOOK_DISCOVERY
  );

  useEffect(() => {
    if (!response) return;

    if (response.type === 'success') {
      const accessToken = response.authentication?.accessToken ?? response.params?.access_token;
      if (!accessToken) {
        setError('تعذر الحصول على بيانات فيسبوك');
        return;
      }
      setLoading(true);
      signInWithFacebookAccessToken(accessToken)
        .catch((err) => setError(mapAuthErrorToArabic(err)))
        .finally(() => setLoading(false));
    } else if (response.type === 'error') {
      setError('تعذر تسجيل الدخول عبر فيسبوك');
    }
  }, [response]);

  const isReady = Boolean(FACEBOOK_APP_ID) && Boolean(request);

  const signIn = async () => {
    setError(null);
    if (!FACEBOOK_APP_ID) {
      setError('لم يتم إعداد تسجيل الدخول عبر فيسبوك بعد');
      return;
    }
    await promptAsync();
  };

  return { signIn, loading, error, isReady, clearError: () => setError(null) };
}
