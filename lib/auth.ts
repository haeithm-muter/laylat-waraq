import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  signInWithCredential,
  FacebookAuthProvider,
  OAuthProvider,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from './firebase';

class AuthNotConfiguredError extends Error {
  code = 'auth/not-configured';
  constructor() {
    super('Firebase is not configured. See .env.example.');
  }
}

function assertConfigured() {
  if (!isFirebaseConfigured) throw new AuthNotConfiguredError();
}

export async function registerWithEmail(nickname: string, email: string, password: string) {
  assertConfigured();
  const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
  if (nickname.trim()) {
    await updateProfile(credential.user, { displayName: nickname.trim() });
  }
  return credential.user;
}

export async function signInWithEmail(email: string, password: string) {
  assertConfigured();
  const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
  return credential.user;
}

export async function sendPasswordReset(email: string) {
  assertConfigured();
  await sendPasswordResetEmail(auth, email.trim());
}

export async function signOutUser() {
  assertConfigured();
  await signOut(auth);
}

/** Exchanges a Facebook access token (from the OAuth prompt) for a Firebase session. */
export async function signInWithFacebookAccessToken(accessToken: string) {
  assertConfigured();
  const credential = FacebookAuthProvider.credential(accessToken);
  const result = await signInWithCredential(auth, credential);
  return result.user;
}

/** Exchanges an Apple identity token + raw nonce for a Firebase session. */
export async function signInWithAppleIdToken(idToken: string, rawNonce: string) {
  assertConfigured();
  const provider = new OAuthProvider('apple.com');
  const credential = provider.credential({ idToken, rawNonce });
  const result = await signInWithCredential(auth, credential);
  return result.user;
}
