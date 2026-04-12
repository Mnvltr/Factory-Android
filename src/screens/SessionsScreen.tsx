import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {listSessions, Session} from '../api/factoryApi';
import {SessionCard} from '../components/SessionCard';
import {useStore} from '../store/useStore';
import {RootStackParamList} from '../navigation/AppNavigator';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Sessions'>;
};

export function SessionsScreen({navigation}: Props) {
  const {apiKey, setApiKey} = useStore();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

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

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1565c0" />
      </View>
    );
  }

  return (
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
          <Text style={styles.emptyText}>No sessions found.</Text>
          <Text style={styles.emptyHint}>
            Start a session from the Factory CLI or web app.
          </Text>
        </View>
      }
      ListFooterComponent={
        loadingMore ? (
          <ActivityIndicator
            style={styles.footer}
            size="small"
            color="#1565c0"
          />
        ) : null
      }
      contentContainerStyle={
        sessions.length === 0 ? styles.emptyContainer : styles.content
      }
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    paddingVertical: 8,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  empty: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
  },
  emptyContainer: {
    flexGrow: 1,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  footer: {
    paddingVertical: 16,
  },
});
