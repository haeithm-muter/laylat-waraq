import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Switch,
  ScrollView,
  BackHandler,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, cardColorThemes } from '@/theme/colors';
import { fontFamily } from '@/theme/typography';
import { radius, spacing } from '@/theme/spacing';
import { useSettingsStore } from '@/store/settingsStore';
import { ColorThemeSwatch } from './ColorThemeSwatch';
import { useActiveCardTheme } from '@/hooks/useActiveCardTheme';
import { signOutUser } from '@/lib/auth';

interface SettingsPanelProps {
  visible: boolean;
  onClose: () => void;
}

const PANEL_WIDTH = 340;

export function SettingsPanel({ visible, onClose }: SettingsPanelProps) {
  // The panel is always in the tree (resting off-screen at -PANEL_WIDTH when
  // closed) and interaction is gated by pointerEvents instead of mount state.
  // This sidesteps timing races between "the Animated.View just entered the
  // tree" and "the open animation started ticking" that a conditional-mount
  // + start-on-mount pattern is prone to.
  const translateX = useRef(new Animated.Value(-PANEL_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
  const toggleSound = useSettingsStore((s) => s.toggleSound);
  // Language is locked to Arabic for now (see langPillDisabled below) —
  // wire this up to useSettingsStore's `language`/`setLanguage` when
  // English ships.
  const cardColorTheme = useSettingsStore((s) => s.cardColorTheme);
  const setCardColorTheme = useSettingsStore((s) => s.setCardColorTheme);
  const activeTheme = useActiveCardTheme();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: visible ? 0 : -PANEL_WIDTH,
        duration: visible ? 260 : 220,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: visible ? 1 : 0,
        duration: visible ? 260 : 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible]);

  // Mirrors Modal's onRequestClose so the Android hardware/gesture back
  // action closes the panel instead of leaving the app or the Home screen.
  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [visible, onClose]);

  return (
    // Rendered as a plain overlay (not <Modal>) — react-native-web's Modal
    // wraps children in a portal whose positioning context breaks our
    // absolutely-positioned slide-in panel. A sibling overlay avoids that
    // on every platform and is simpler for a same-screen drawer like this.
    <View style={styles.root} pointerEvents={visible ? 'box-none' : 'none'}>
      <Animated.View
        style={[styles.overlay, { opacity: overlayOpacity }]}
        pointerEvents={visible ? 'auto' : 'none'}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="إغلاق الإعدادات" />
      </Animated.View>

      <Animated.View style={[styles.panel, { transform: [{ translateX }] }]}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.panelContent}>
          <View style={styles.header}>
            <Pressable onPress={onClose} hitSlop={10} style={styles.closeButton}>
              <Ionicons name="close" size={22} color={colors.textOnDark} />
            </Pressable>
            <Text style={styles.title}>الإعدادات</Text>
          </View>

          {/* Sound */}
          <View style={styles.row}>
            <Switch
              value={soundEnabled}
              onValueChange={toggleSound}
              trackColor={{ true: activeTheme.accent, false: 'rgba(255,255,255,0.2)' }}
              thumbColor={colors.cream}
            />
            <View style={styles.rowLabelGroup}>
              <Ionicons
                name={soundEnabled ? 'volume-high' : 'volume-mute'}
                size={18}
                color={colors.textOnDark}
              />
              <Text style={styles.rowLabel}>الصوت</Text>
            </View>
          </View>

          {/* Language */}
          <View style={styles.sectionGap}>
            <View style={styles.rowLabelGroup}>
              <Ionicons name="language" size={18} color={colors.textOnDark} />
              <Text style={styles.rowLabel}>اللغة</Text>
            </View>
            <View style={styles.languageRow}>
              <View style={[styles.langPill, styles.langPillActive, { backgroundColor: activeTheme.accent }]}>
                <Text style={[styles.langPillText, { color: activeTheme.onAccent }]}>العربية</Text>
              </View>
              <View style={[styles.langPill, styles.langPillDisabled]}>
                <Text style={styles.langPillTextDisabled}>English</Text>
                <Text style={styles.comingSoonBadge}>قريباً</Text>
              </View>
            </View>
          </View>

          {/* Card colors */}
          <View style={styles.sectionGap}>
            <View style={styles.rowLabelGroup}>
              <Ionicons name="color-palette" size={18} color={colors.textOnDark} />
              <Text style={styles.rowLabel}>ألوان الورق</Text>
            </View>
            <View style={styles.swatchGrid}>
              {Object.values(cardColorThemes).map((t) => (
                <ColorThemeSwatch
                  key={t.id}
                  theme={t}
                  selected={t.id === cardColorTheme}
                  onPress={() => setCardColorTheme(t.id)}
                />
              ))}
            </View>
          </View>

          <Pressable
            onPress={() => {
              onClose();
              signOutUser().catch(() => {});
            }}
            style={styles.signOutRow}
          >
            <Ionicons name="log-out-outline" size={18} color={colors.danger} />
            <Text style={styles.signOutLabel}>تسجيل الخروج</Text>
          </Pressable>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    zIndex: 20,
    elevation: 20,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.overlay,
  },
  panel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: PANEL_WIDTH,
    backgroundColor: colors.feltDarker,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  panelContent: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: fontFamily.extraBold,
    fontSize: 20,
    color: colors.textOnDark,
    writingDirection: 'rtl',
  },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLabelGroup: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rowLabel: {
    fontFamily: fontFamily.semiBold,
    fontSize: 15,
    color: colors.textOnDark,
    writingDirection: 'rtl',
  },
  sectionGap: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  languageRow: {
    flexDirection: 'row-reverse',
    gap: spacing.sm,
  },
  langPill: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
  },
  langPillActive: {},
  langPillDisabled: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  langPillText: {
    fontFamily: fontFamily.bold,
    fontSize: 13,
  },
  langPillTextDisabled: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    color: colors.textOnDarkMuted,
  },
  comingSoonBadge: {
    fontFamily: fontFamily.medium,
    fontSize: 10,
    color: colors.textOnDarkMuted,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  swatchGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  signOutRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  signOutLabel: {
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
    color: colors.danger,
    writingDirection: 'rtl',
  },
});
