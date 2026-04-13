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
import {listSessions, quickCreateSession, Session} from '../api/factoryApi';
import {SessionCard} from '../components/SessionCard';
import {useStore} from '../store/useStore';
import {useThemeStore} from '../store/useThemeStore';
import {useSettingsStore} from '../store/useSettingsStore';

type Props = {
  navigation: any;
};

function GearButton({onPress, color}: {onPress: () => void; color: string}) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.headerBtn}>
      <Text style={[styles.gearIcon, {color}]}>{'\u2699'}</Text>
    </TouchableOpacity>
  );
}

export function SessionsScreen({navigation}: Props) {
  const {apiKey, setApiKey} = useStore();
  const {palette, fonts} = useThemeStore();
  const settings = useSettingsStore();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [quickStarting, setQuickStarting] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <GearButton
          onPress={() => navigation.navigate('Settings')}
          color={palette.textSecondary}
        />
      ),
    });
  }, [navigation, palette]);

  const fetchSessions = useCallback(
    async (cursor?: string) => {
      try {
        const data = await listSessions(apiKey, cursor);
        if (cursor) {
          setSessions(prev => [...prev, ...data.sessions]);
        } else {
          setSessions(data.sessions);
        }
        setNextCursor(data.pagination.nextCursor);
      } catch (e: any) {
        if (e?.response?.status === 401) {
          Alert.alert('Invalid API Key', 'Please re-enter your API key.', [
            {text: 'OK', onPress: () => setApiKey('')},
          ]);
        } else {
          Alert.alert('Error', 'Failed to load sessions.');
        }
      }
    },
    [apiKey, setApiKey],
  );

  useEffect(() => {
    setLoading(true);
    fetchSessions().finally(() => setLoading(false));
  }, [fetchSessions]);

  useEffect(() => {
    const unsub = navigation.addListener('focus', () => {
      fetchSessions();
    });
    return unsub;
  }, [navigation, fetchSessions]);

  async function handleRefresh() {
    setRefreshing(true);
    await fetchSessions();
    setRefreshing(false);
  }

  async function handleLoadMore() {
    if (!nextCursor || loadingMore) {
      return;
    }
    setLoadingMore(true);
    await fetchSessions(nextCursor);
    setLoadingMore(false);
  }

  async function handleQuickStart() {
    setQuickStarting(true);
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

      const session = await quickCreateSession(
        apiKey,
        settings.defaultComputerId || undefined,
        Object.keys(sessionSettings).length > 0 ? sessionSettings : undefined,
      );
      navigation.navigate('Chat', {
        sessionId: session.sessionId,
        title: session.title,
        status: session.status,
      });
    } catch (e: any) {
      if (
        e?.message?.includes('No computers') ||
        e?.response?.data?.detail?.includes('computer')
      ) {
        navigation.navigate('NewSession');
      } else {
        Alert.alert(
          'Error',
          e?.response?.data?.detail ??
            e?.message ??
            'Quick start failed. Try selecting a computer manually.',
        );
      }
    } finally {
      setQuickStarting(false);
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
      <FlatList
        style={styles.list}
        data={sessions}
        keyExtractor={item => item.sessionId}
        renderItem={({item}) => (
          <SessionCard
            session={item}
            onPress={() =>
              navigation.navigate('Chat', {
                sessionId: item.sessionId,
                title: item.title,
                status: item.status,
              })
            }
          />
        )}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[styles.emptyIcon, {color: palette.textTertiary}]}>
              {'\uD83D\uDCAC'}
            </Text>
            <Text
              style={[
                styles.emptyText,
                {color: palette.textSecondary, fontSize: fonts.title},
              ]}>
              No sessions yet
            </Text>
            <Text style={[styles.emptyHint, {color: palette.textTertiary}]}>
              Tap the button below to start a conversation
            </Text>
          </View>
        }
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator
              style={styles.footer}
              size="small"
              color={palette.accent}
            />
          ) : null
        }
        contentContainerStyle={
          sessions.length === 0 ? styles.emptyContainer : undefined
        }
      />

      {/* FAB with long-press for manual computer selection */}
      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={[
            styles.fabSecondary,
            {backgroundColor: palette.surface, borderColor: palette.border},
          ]}
          onPress={() => navigation.navigate('NewSession')}
          activeOpacity={0.7}>
          <Text
            style={[styles.fabSecondaryText, {color: palette.textSecondary}]}>
            {'\uD83D\uDCBB'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.fab,
            {backgroundColor: palette.fab},
            quickStarting && {opacity: 0.7},
          ]}
          onPress={handleQuickStart}
          disabled={quickStarting}
          activeOpacity={0.8}>
          {quickStarting ? (
            <ActivityIndicator size="small" color={palette.fabText} />
          ) : (
            <Text style={[styles.fabText, {color: palette.fabText}]}>+</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyContainer: {
    flexGrow: 1,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 14,
    textAlign: 'center',
  },
  footer: {
    paddingVertical: 16,
  },
  headerBtn: {
    paddingHorizontal: 12,
  },
  gearIcon: {
    fontSize: 24,
  },
  fabContainer: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    alignItems: 'center',
    gap: 12,
  },
  fabSecondary: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  fabSecondaryText: {
    fontSize: 18,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  fabText: {
    fontSize: 28,
    fontWeight: '400',
    marginTop: -2,
  },
});
