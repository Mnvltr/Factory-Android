import React from 'react';
import {StyleSheet, View} from 'react-native';

type Status = 'idle' | 'pending' | 'running';

const DOT_COLORS: Record<Status, string> = {
  idle: '#22c55e',
  pending: '#f59e0b',
  running: '#2563eb',
};

export function StatusDot({
  status,
  size = 10,
}: {
  status: Status;
  size?: number;
}) {
  return (
    <View
      style={[
        styles.dot,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: DOT_COLORS[status] ?? DOT_COLORS.idle,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  dot: {
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.9)',
  },
});
