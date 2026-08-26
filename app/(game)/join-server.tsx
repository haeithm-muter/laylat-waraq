import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ToggleGroup } from '@/components/ui/ToggleGroup';
import { TextField } from '@/components/ui/TextField';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { colors } from '@/theme/colors';
import { fontFamily } from '@/theme/typography';
import { radius, spacing } from '@/theme/spacing';
import { useServerStore } from '@/store/serverStore';
import { isQrJoinPayload, QrJoinPayload } from '@/lib/localServer/protocol';

type JoinMode = 'code' | 'scan';

export default function JoinServerScreen() {
  const [mode, setMode] = useState<JoinMode>('code');
  const [codeInput, setCodeInput] = useState('');
  const [scannedPayload, setScannedPayload] = useState<QrJoinPayload | null>(null);
  const [name, setName] = useState('');
  const [permission, requestPermission] = useCameraPermissions();

  const status = useServerStore((s) => s.status);
  const error = useServerStore((s) => s.error);
  const joinByCode = useServerStore((s) => s.joinByCode);
  const joinByQr = useServerStore((s) => s.joinByQr);
  const clearError = useServerStore((s) => s.clearError);
  const reset = useServerStore((s) => s.reset);

  useEffect(() => {
    if (status === 'lobby') {
      router.push('/(game)/lobby');
    }
  }, [status]);

  useEffect(() => reset, [reset]);

  const onScan = (result: BarcodeScanningResult) => {
    if (scannedPayload) return;
    try {
      const parsed = JSON.parse(result.data);
      if (isQrJoinPayload(parsed)) setScannedPayload(parsed);
    } catch {
      // not our QR format — ignore and keep scanning
    }
  };

  const canSubmit =
    name.trim().length > 0 && (mode === 'code' ? codeInput.trim().length === 4 : Boolean(scannedPayload));

  const onSubmit = () => {
    clearError();
    if (mode === 'code') {
      joinByCode(codeInput.trim(), name.trim());
    } else if (scannedPayload) {
      joinByQr(scannedPayload, name.trim());
    }
  };

  return (
    <View style={styles.screen}>
      <LinearGradient colors={[colors.feltDark, colors.feltDarker]} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={styles.flex} edges={['top', 'left', 'right']}>
        <ScreenHeader title="الانضمام لسيرفر" subtitle="أدخل كود المضيف أو امسح رمز QR" />

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.content}>
            <View style={styles.leftColumn}>
              <ToggleGroup
                options={[
                  { value: 'code' as JoinMode, label: 'أدخل الكود' },
                  { value: 'scan' as JoinMode, label: 'مسح QR' },
                ]}
                value={mode}
                onChange={(next) => {
                  setMode(next);
                  setScannedPayload(null);
                  clearError();
                }}
              />

              {mode === 'code' ? (
                <TextField
                  label="كود السيرفر"
                  value={codeInput}
                  onChangeText={(t) => setCodeInput(t.replace(/[^0-9]/g, '').slice(0, 4))}
                  placeholder="0000"
                  keyboardType="number-pad"
                  maxLength={4}
                />
              ) : (
                <View style={styles.scanArea}>
                  {!permission?.granted ? (
                    <Pressable onPress={requestPermission} style={styles.permissionButton}>
                      <Ionicons name="camera-outline" size={22} color={colors.textOnDark} />
                      <Text style={styles.permissionText}>السماح باستخدام الكاميرا</Text>
                    </Pressable>
                  ) : scannedPayload ? (
                    <View style={styles.scannedChip}>
                      <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                      <Text style={styles.scannedText}>تم مسح سيرفر: {scannedPayload.code}</Text>
                      <Pressable onPress={() => setScannedPayload(null)} hitSlop={8}>
                        <Text style={styles.rescanLink}>امسح مرة أخرى</Text>
                      </Pressable>
                    </View>
                  ) : (
                    <View style={styles.cameraWrap}>
                      <CameraView
                        style={StyleSheet.absoluteFill}
                        facing="back"
                        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                        onBarcodeScanned={onScan}
                      />
                    </View>
                  )}
                </View>
              )}
            </View>

            <View style={styles.rightColumn}>
              <TextField
                label="اسمك"
                icon="person-outline"
                value={name}
                onChangeText={setName}
                placeholder="مثال: أبو فهد"
                autoCorrect={false}
              />

              {Boolean(error) && <Text style={styles.error}>{error}</Text>}

              <PrimaryButton
                label="انضمام"
                onPress={onSubmit}
                disabled={!canSubmit}
                loading={status === 'connecting'}
                fullWidth
                style={styles.submitButton}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.feltDark },
  flex: { flex: 1 },
  content: {
    flex: 1,
    flexDirection: 'row-reverse',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.lg,
  },
  leftColumn: {
    flex: 1,
    gap: spacing.md,
  },
  rightColumn: {
    flex: 1,
    gap: spacing.md,
    justifyContent: 'center',
  },
  scanArea: {
    height: 180,
  },
  cameraWrap: {
    flex: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#D4A657',
  },
  permissionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  permissionText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 13,
    color: colors.textOnDark,
    writingDirection: 'rtl',
  },
  scannedChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.success,
    backgroundColor: 'rgba(63,190,122,0.08)',
  },
  scannedText: {
    fontFamily: fontFamily.bold,
    fontSize: 14,
    color: colors.textOnDark,
    writingDirection: 'rtl',
  },
  rescanLink: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    color: '#D4A657',
    writingDirection: 'rtl',
  },
  error: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    color: '#FFB4AC',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  submitButton: {
    marginTop: spacing.xs,
  },
});
