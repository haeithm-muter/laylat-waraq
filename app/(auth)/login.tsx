import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import { CardTableBackground } from '@/components/ui/CardTableBackground';
import { Logo } from '@/components/branding/Logo';
import { SocialAuthButton } from '@/components/ui/SocialAuthButton';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { TextField } from '@/components/ui/TextField';
import { colors } from '@/theme/colors';
import { fontFamily } from '@/theme/typography';
import { radius, spacing } from '@/theme/spacing';
import { signInWithEmail } from '@/lib/auth';
import { mapAuthErrorToArabic } from '@/utils/authErrors';
import { useFacebookAuth } from '@/hooks/useFacebookAuth';
import { useAppleAuth } from '@/hooks/useAppleAuth';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen() {
  const [mode, setMode] = useState<'social' | 'email'>('social');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const facebook = useFacebookAuth();
  const apple = useAppleAuth();

  const activeError = error ?? facebook.error ?? apple.error;

  const onEmailSubmit = async () => {
    setError(null);
    if (!EMAIL_RE.test(email.trim())) {
      setError('أدخل بريد إلكتروني صحيح');
      return;
    }
    if (password.length < 6) {
      setError('كلمة المرور 6 أحرف على الأقل');
      return;
    }
    setSubmitting(true);
    try {
      await signInWithEmail(email, password);
      // Root layout's onAuthStateChanged listener updates authStore and
      // app/(auth)/_layout.tsx redirects to /(game)/home automatically.
    } catch (err) {
      setError(mapAuthErrorToArabic(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.screen}>
      <CardTableBackground />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.layout}>
          <View style={styles.brandSide}>
            <Logo size="lg" tagline />
          </View>

          <View style={styles.formSide}>
            <ScrollView
              contentContainerStyle={styles.card}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {mode === 'social' ? (
                <>
                  <Text style={styles.welcome}>مرحباً بك 👋</Text>
                  <Text style={styles.subtitle}>سجّل الدخول عشان تبدأ اللعب مع أصحابك</Text>

                  <View style={styles.buttonStack}>
                    <SocialAuthButton
                      provider="email"
                      label="الدخول بالبريد الإلكتروني"
                      onPress={() => {
                        setError(null);
                        setMode('email');
                      }}
                    />
                    {Platform.OS === 'ios' && (
                      <SocialAuthButton
                        provider="apple"
                        label="الدخول عبر Apple"
                        onPress={apple.signIn}
                        loading={apple.loading}
                        disabled={!apple.available}
                      />
                    )}
                    <SocialAuthButton
                      provider="facebook"
                      label="الدخول عبر Facebook"
                      onPress={facebook.signIn}
                      loading={facebook.loading}
                    />
                  </View>
                </>
              ) : (
                <>
                  <Pressable
                    onPress={() => {
                      setError(null);
                      setMode('social');
                    }}
                    style={styles.backRow}
                    hitSlop={8}
                  >
                    <Ionicons name="arrow-forward" size={18} color={colors.textOnDark} />
                    <Text style={styles.backLabel}>رجوع</Text>
                  </Pressable>

                  <Text style={styles.welcome}>الدخول بالبريد الإلكتروني</Text>

                  <View style={styles.fieldStack}>
                    <TextField
                      label="البريد الإلكتروني"
                      icon="mail-outline"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      placeholder="example@email.com"
                    />
                    <TextField
                      label="كلمة المرور"
                      icon="lock-closed-outline"
                      value={password}
                      onChangeText={setPassword}
                      isPassword
                      placeholder="••••••••"
                    />
                  </View>

                  <Link href="/(auth)/forgot-password" asChild>
                    <Pressable hitSlop={6}>
                      <Text style={styles.forgotLink}>نسيت كلمة المرور؟</Text>
                    </Pressable>
                  </Link>

                  <PrimaryButton
                    label="دخول"
                    onPress={onEmailSubmit}
                    loading={submitting}
                    fullWidth
                    style={styles.submitButton}
                  />
                </>
              )}

              {Boolean(activeError) && <Text style={styles.error}>{activeError}</Text>}

              <View style={styles.registerRow}>
                <Text style={styles.registerText}>ليس لديك حساب؟</Text>
                <Pressable onPress={() => router.push('/(auth)/register')} hitSlop={6}>
                  <Text style={styles.registerLink}>إنشاء حساب</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.feltDark,
  },
  flex: {
    flex: 1,
  },
  layout: {
    flex: 1,
    flexDirection: 'row',
  },
  brandSide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  formSide: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  card: {
    backgroundColor: 'rgba(8, 20, 16, 0.55)',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  welcome: {
    fontFamily: fontFamily.extraBold,
    fontSize: 20,
    color: colors.textOnDark,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    color: colors.textOnDarkMuted,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: spacing.sm,
  },
  buttonStack: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  fieldStack: {
    gap: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  backRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
    alignSelf: 'flex-end',
  },
  backLabel: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    color: colors.textOnDark,
    writingDirection: 'rtl',
  },
  forgotLink: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    color: '#D4A657',
    textAlign: 'left',
    writingDirection: 'rtl',
    marginBottom: spacing.sm,
  },
  submitButton: {
    marginTop: spacing.xs,
  },
  error: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    color: '#FFB4AC',
    textAlign: 'center',
    writingDirection: 'rtl',
    marginTop: spacing.sm,
  },
  registerRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  registerText: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    color: colors.textOnDarkMuted,
    writingDirection: 'rtl',
  },
  registerLink: {
    fontFamily: fontFamily.bold,
    fontSize: 13,
    color: '#D4A657',
    writingDirection: 'rtl',
  },
});
