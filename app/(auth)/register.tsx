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
import { router } from 'expo-router';
import { CardTableBackground } from '@/components/ui/CardTableBackground';
import { Logo } from '@/components/branding/Logo';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { TextField } from '@/components/ui/TextField';
import { colors } from '@/theme/colors';
import { fontFamily } from '@/theme/typography';
import { radius, spacing } from '@/theme/spacing';
import { registerWithEmail } from '@/lib/auth';
import { mapAuthErrorToArabic } from '@/utils/authErrors';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterScreen() {
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    setError(null);

    if (!nickname.trim()) {
      setError('أدخل اسمك المستعار');
      return;
    }
    if (!EMAIL_RE.test(email.trim())) {
      setError('أدخل بريد إلكتروني صحيح');
      return;
    }
    if (password.length < 6) {
      setError('كلمة المرور 6 أحرف على الأقل');
      return;
    }
    if (password !== confirmPassword) {
      setError('كلمتا المرور غير متطابقتين');
      return;
    }

    setSubmitting(true);
    try {
      await registerWithEmail(nickname, email, password);
      // onAuthStateChanged (app/_layout.tsx) picks this up and
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

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.layout}>
          <View style={styles.brandSide}>
            <Logo size="md" />
          </View>

          <View style={styles.formSide}>
            <ScrollView
              contentContainerStyle={styles.card}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Pressable onPress={() => router.back()} style={styles.backRow} hitSlop={8}>
                <Ionicons name="arrow-forward" size={18} color={colors.textOnDark} />
                <Text style={styles.backLabel}>رجوع</Text>
              </Pressable>

              <Text style={styles.title}>إنشاء حساب جديد</Text>
              <Text style={styles.subtitle}>انضم لـ ليلة ورق وابدأ التحدي مع أصحابك</Text>

              <View style={styles.fieldStack}>
                <TextField
                  label="الاسم المستعار"
                  icon="person-outline"
                  value={nickname}
                  onChangeText={setNickname}
                  placeholder="مثال: أبو فهد"
                  autoCorrect={false}
                />
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
                <TextField
                  label="تأكيد كلمة المرور"
                  icon="lock-closed-outline"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  isPassword
                  placeholder="••••••••"
                />
              </View>

              {Boolean(error) && <Text style={styles.error}>{error}</Text>}

              <PrimaryButton
                label="إنشاء الحساب"
                onPress={onSubmit}
                loading={submitting}
                fullWidth
                style={styles.submitButton}
              />

              <View style={styles.loginRow}>
                <Text style={styles.loginText}>لديك حساب بالفعل؟</Text>
                <Pressable onPress={() => router.replace('/(auth)/login')} hitSlop={6}>
                  <Text style={styles.loginLink}>تسجيل الدخول</Text>
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
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  card: {
    backgroundColor: 'rgba(8, 20, 16, 0.55)',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.xs,
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
  title: {
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
  fieldStack: {
    gap: spacing.md,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  error: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    color: '#FFB4AC',
    textAlign: 'center',
    writingDirection: 'rtl',
    marginTop: spacing.sm,
  },
  submitButton: {
    marginTop: spacing.md,
  },
  loginRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  loginText: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    color: colors.textOnDarkMuted,
    writingDirection: 'rtl',
  },
  loginLink: {
    fontFamily: fontFamily.bold,
    fontSize: 13,
    color: '#D4A657',
    writingDirection: 'rtl',
  },
});
