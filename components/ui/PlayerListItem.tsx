import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LobbyPlayer } from '@/lib/localServer/protocol';
import { Avatar } from './Avatar';
import { fontFamily } from '@/theme/typography';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

interface PlayerListItemProps {
  player: LobbyPlayer;
  isMe: boolean;
}

export function PlayerListItem({ player, isMe }: PlayerListItemProps) {
  return (
    <View style={styles.row}>
      <Avatar name={player.name} size={36} />
      <View style={styles.nameGroup}>
        <Text style={styles.name} numberOfLines={1}>
          {player.name}
          {isMe ? ' (أنت)' : ''}
        </Text>
        {player.isHost && <Text style={styles.hostBadge}>المضيف</Text>}
      </View>
      <Ionicons
        name={player.connected ? 'checkmark-circle' : 'time'}
        size={18}
        color={player.connected ? colors.success : colors.warning}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: radius.md,
  },
  nameGroup: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.xs,
  },
  name: {
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
    color: colors.textOnDark,
    writingDirection: 'rtl',
  },
  hostBadge: {
    fontFamily: fontFamily.medium,
    fontSize: 10,
    color: '#D4A657',
    backgroundColor: 'rgba(212,166,87,0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
});
