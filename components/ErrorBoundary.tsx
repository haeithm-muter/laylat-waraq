import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { colors } from '@/theme/colors';
import { fontFamily } from '@/theme/typography';
import { spacing } from '@/theme/spacing';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

/** Catches render-time crashes anywhere in the app and shows a recoverable
 * Arabic fallback instead of a native red/white screen. Resetting just
 * re-renders the tree — most crashes here stem from bad transient state
 * (a stale store value, a null a screen didn't guard against), so a fresh
 * render is often enough; if not, the user can back out to Home. */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    if (__DEV__) console.error('ErrorBoundary caught:', error);
  }

  reset = () => this.setState({ hasError: false });

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <View style={styles.screen}>
        <LinearGradient colors={[colors.feltDark, colors.feltDarker]} style={StyleSheet.absoluteFill} />
        <SafeAreaView style={styles.flex}>
          <View style={styles.body}>
            <Text style={styles.emoji}>😕</Text>
            <Text style={styles.title}>حدث خطأ غير متوقع</Text>
            <Text style={styles.subtitle}>ما نقدر نكمل هالصفحة حالياً — جرّب مرة ثانية</Text>
            <PrimaryButton label="أعد المحاولة" onPress={this.reset} />
          </View>
        </SafeAreaView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.feltDark },
  flex: { flex: 1 },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  emoji: { fontSize: 48 },
  title: {
    fontFamily: fontFamily.black,
    fontSize: 20,
    color: colors.textOnDark,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: colors.textOnDarkMuted,
    textAlign: 'center',
    writingDirection: 'rtl',
    marginBottom: spacing.sm,
  },
});
