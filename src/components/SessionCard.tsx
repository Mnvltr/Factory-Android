import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {Session} from '../api/factoryApi';
import {StatusDot} from './StatusBadge';
import {useThemeStore} from '../store/useThemeStore';

interface Props {
  session: Session;
  onPress: () => void;
}

function timeAgo(ms: number): string {
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) {
    return 'now';
  }
  if (mins < 60) {
    return `${mins}m`;
  }
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) {
    return `${hrs}h`;
  }
  const days = Math.floor(hrs / 24);
  if (days < 7) {
    return `${days}d`;
  }
  return new Date(ms).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

export function SessionCard({session, onPress}: Props) {
  const {palette, fonts} = useThemeStore();
  const title = session.title || `Session ${session.sessionId.slice(0, 8)}`;
  const initial = title.charAt(0).toUpperCase();

  return (
    <TouchableOpacity
      style={[styles.card, {borderBottomColor: palette.border}]}
      onPress={onPress}
      activeOpacity={0.6}>
      <View style={[styles.avatar, {backgroundColor: palette.accent}]}>
        <Text style={styles.avatarText}>{initial}</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text
            style={[styles.title, {color: palette.text, fontSize: fonts.body}]}
            numberOfLines={1}>
            {title}
          </Text>
          <Text style={[styles.time, {color: palette.textTertiary}]}>
            {timeAgo(session.updatedAt)}
          </Text>
        </View>
        <View style={styles.bottomRow}>
          <Text
            style={[
              styles.preview,
              {color: palette.textSecondary, fontSize: fonts.body - 2},
            ]}
            numberOfLines={1}>
            {session.messageCount > 0
              ? `${session.messageCount} messages`
              : 'No messages yet'}
          </Text>
          <StatusDot status={session.status} size={9} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  time: {
    fontSize: 12,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  preview: {
    flex: 1,
    marginRight: 8,
  },
});
