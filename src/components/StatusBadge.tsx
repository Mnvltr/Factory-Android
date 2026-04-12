import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

type Status = 'idle' | 'pending' | 'running';

const COLORS: Record<Status, {bg: string; text: string; label: string}> = {
  idle: {bg: '#e8f5e9', text: '#2e7d32', label: 'Idle'},
  pending: {bg: '#fff3e0', text: '#e65100', label: 'Pending'},
  running: {bg: '#e3f2fd', text: '#1565c0', label: 'Running'},
};

export function StatusBadge({status}: {status: Status}) {
  const colors = COLORS[status] ?? COLORS.idle;
  return (
    <View style={[styles.badge, {backgroundColor: colors.bg}]}>
      <Text style={[styles.label, {color: colors.text}]}>{colors.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
  },
});
