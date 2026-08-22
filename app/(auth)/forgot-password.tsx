import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { CardTableBackground } from '@/components/ui/CardTableBackground';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { TextField } from '@/components/ui/TextField';
import { colors } from '@/theme/colors';
import { fontFamily } from '@/theme/typography';
import { radius, spacing } from '@/theme/spacing';
import { sendPasswordReset } from '@/lib/auth';
import { mapAuthErrorToArabic } from '@/utils/authErrors';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    setError(null);
    if (!EMAIL_RE.test(email.trim())) {
      setError('أدخل بريد إلكتروني صحيح');
      return;
    }
    setSubmitting(true);
    try {
      await sendPasswordReset(email);
      setSent(true);
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
        <View style={styles.centerWrap}>
          <View style={styles.card}>
            <Pressable onPress={() => router.back()} style={styles.backRow} hitSlop={8}>
              <Ionicons name="arrow-forward" size={18} color={colors.textOnDark} />
              <Text style={styles.backLabel}>رجوع</Text>
            </Pressable>

            <Ionicons
              name={sent ? 'checkmark-circle' : 'key-outline'}
              size={36}
              color="#D4A657"
              style={styles.headerIcon}
            />

            {sent ? (
              <>
                <Text style={styles.title}>تحقق من بريدك الإلكتروني</Text>
                <Text style={styles.subtitle}>
                  أرسلنا رابط إعادة تعيين كلمة المرور إلى {email.trim()}
                </Text>
                <PrimaryButton
                  label="العودة لتسجيل الدخول"
                  onPress={() => router.replace('/(auth)/login')}
                  fullWidth
                  style={styles.submitButton}
                />
              </>
            ) : (
              <>
                <Text style={styles.title}>نسيت كلمة المرور؟</Text>
                <Text style={styles.subtitle}>أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين</Text>

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
                </View>

                {Boolean(error) && <Text style={styles.error}>{error}</Text>}

                <PrimaryButton
                  label="إرسال رابط إعادة التعيين"
                  onPress={onSubmit}
                  loading={submitting}
                  fullWidth
                  style={styles.submitButton}
                />
              </>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.feltDark },
  flex: { flex: 1 },
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  card: {
    width: 420,
    maxWidth: '100%',
    backgroundColor: 'rgba(8, 20, 16, 0.55)',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
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
  headerIcon: {
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontFamily: fontFamily.extraBold,
    fontSize: 20,
    color: colors.textOnDark,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    color: colors.textOnDarkMuted,
    textAlign: 'center',
    writingDirection: 'rtl',
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  fieldStack: {
    gap: spacing.md,
    marginTop: spacing.sm,
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
});
