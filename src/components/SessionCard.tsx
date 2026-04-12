import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {Session} from '../api/factoryApi';
import {StatusBadge} from './StatusBadge';

interface Props {
  session: Session;
  onPress: () => void;
}

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function SessionCard({session, onPress}: Props) {
  const title = session.title || `Session ${session.sessionId.slice(0, 8)}`;
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.row}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <StatusBadge status={session.status} />
      </View>
      <View style={styles.meta}>
        <Text style={styles.metaText}>{session.messageCount} messages</Text>
        <Text style={styles.metaText}>{formatDate(session.updatedAt)}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 14,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  metaText: {
    fontSize: 12,
    color: '#888',
  },
});
