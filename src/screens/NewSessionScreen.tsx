import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {Computer, createSession, listComputers} from '../api/factoryApi';
import {useStore} from '../store/useStore';
import {useThemeStore} from '../store/useThemeStore';
import {useSettingsStore} from '../store/useSettingsStore';
import {RootStackParamList} from '../navigation/AppNavigator';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'NewSession'>;
};

const STATUS_COLORS: Record<string, string> = {
  active: '#22c55e',
  provisioning: '#f59e0b',
  error: '#ef4444',
};

export function NewSessionScreen({navigation}: Props) {
  const {apiKey} = useStore();
  const {palette, fonts} = useThemeStore();
  const settings = useSettingsStore();
  const [computers, setComputers] = useState<Computer[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState<string | null>(null);

  const fetchComputers = useCallback(async () => {
    try {
      const data = await listComputers(apiKey);
      setComputers(data.computers);
    } catch (e: any) {
      Alert.alert(
        'Error',
        e?.response?.data?.detail ?? 'Failed to load computers.',
      );
    }
  }, [apiKey]);

  useEffect(() => {
    setLoading(true);
    fetchComputers().finally(() => setLoading(false));
  }, [fetchComputers]);

  async function handleSelect(computer: Computer) {
    if (computer.status !== 'active') {
      Alert.alert(
        'Computer Not Ready',
        `"${computer.name}" is ${
          computer.status ?? 'not active'
        }. Only active computers can be used.`,
      );
      return;
    }

    setCreating(computer.id);
    try {
      const sessionSettings: Record<string, string> = {};
      if (settings.model) {
        sessionSettings.model = settings.model;
      }
      if (settings.reasoningEffort) {
        sessionSettings.reasoningEffort = settings.reasoningEffort;
      }
      if (settings.interactionMode) {
        sessionSettings.interactionMode = settings.interactionMode;
      }
      if (settings.autonomyLevel) {
        sessionSettings.autonomyLevel = settings.autonomyLevel;
      }

      const session = await createSession(
        apiKey,
        computer.id,
        Object.keys(sessionSettings).length > 0 ? sessionSettings : undefined,
      );
      navigation.replace('Chat', {
        sessionId: session.sessionId,
        title: session.title,
        status: session.status,
      });
    } catch (e: any) {
      Alert.alert(
        'Error',
        e?.response?.data?.detail ?? 'Failed to create session.',
      );
    } finally {
      setCreating(null);
    }
  }

  if (loading) {
    return (
      <View style={[styles.center, {backgroundColor: palette.bg}]}>
        <ActivityIndicator size="large" color={palette.accent} />
      </View>
    );
  }

  return (
    <View style={[styles.root, {backgroundColor: palette.bg}]}>
      <Text style={[styles.heading, {color: palette.textSecondary}]}>
        Select a computer to start a new session
      </Text>
      <FlatList
        data={computers}
        keyExtractor={item => item.id}
        renderItem={({item}) => {
          const isActive = item.status === 'active';
          const statusColor =
            STATUS_COLORS[item.status ?? 'error'] ?? '#94a3b8';
          const isCreating = creating === item.id;

          return (
            <TouchableOpacity
              style={[
                styles.computerCard,
                {
                  backgroundColor: palette.surface,
                  borderColor: palette.border,
                  opacity: isActive ? 1 : 0.5,
                },
              ]}
              onPress={() => handleSelect(item)}
              disabled={isCreating || creating !== null}
              activeOpacity={0.7}>
              <View style={styles.computerRow}>
                <View
                  style={[
                    styles.computerIcon,
                    {backgroundColor: palette.surfaceSecondary},
                  ]}>
                  <Text style={{fontSize: 20}}>
                    {item.providerType === 'e2b' ? '\u2601' : '\uD83D\uDCBB'}
                  </Text>
                </View>
                <View style={styles.computerInfo}>
                  <Text
                    style={[
                      styles.computerName,
                      {color: palette.text, fontSize: fonts.body},
                    ]}
                    numberOfLines={1}>
                    {item.name}
                  </Text>
                  <View style={styles.statusRow}>
                    <View
                      style={[styles.statusDot, {backgroundColor: statusColor}]}
                    />
                    <Text
                      style={[
                        styles.statusText,
                        {color: palette.textTertiary},
                      ]}>
                      {item.status ?? 'unknown'} {'\u00B7'}{' '}
                      {item.providerType === 'e2b' ? 'Cloud' : 'BYOM'}
                    </Text>
                  </View>
                </View>
                {isCreating ? (
                  <ActivityIndicator size="small" color={palette.accent} />
                ) : (
                  <Text style={[styles.chevron, {color: palette.textTertiary}]}>
                    {'\u203A'}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, {color: palette.textSecondary}]}>
              No computers found.
            </Text>
            <Text style={[styles.emptyHint, {color: palette.textTertiary}]}>
              Set up a computer in the Factory web app or CLI first.
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heading: {
    fontSize: 14,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  computerCard: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    marginBottom: 10,
  },
  computerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  computerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  computerInfo: {
    flex: 1,
  },
  computerName: {
    fontWeight: '600',
    marginBottom: 3,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
  },
  chevron: {
    fontSize: 28,
    fontWeight: '300',
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});
