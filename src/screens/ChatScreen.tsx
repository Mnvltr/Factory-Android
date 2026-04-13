import {RouteProp} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  getComputer,
  getMessages,
  getSession,
  interruptSession,
  Message,
  postMessage,
  restartComputer,
  updateSession,
} from '../api/factoryApi';
import {MessageBubble} from '../components/MessageBubble';
import {QuickSettings} from '../components/QuickSettings';
import {RootStackParamList} from '../navigation/AppNavigator';
import {useStore} from '../store/useStore';
import {useThemeStore} from '../store/useThemeStore';
import {useDraftStore} from '../store/useDraftStore';
import {useOfflineQueue} from '../store/useOfflineQueue';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Chat'>;
  route: RouteProp<RootStackParamList, 'Chat'>;
};

const POLL_INTERVAL_MS = 3000;

function mergeMessages(existing: Message[], incoming: Message[]): Message[] {
  const map = new Map(existing.map(m => [m.id, m]));
  for (const m of incoming) {
    map.set(m.id, m);
  }
  return Array.from(map.values()).sort((a, b) => a.createdAt - b.createdAt);
}

function StopButton({onPress, color}: {onPress: () => void; color: string}) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.headerBtn}>
      <Text style={[styles.headerBtnText, {color}]}>Stop</Text>
    </TouchableOpacity>
  );
}

export function ChatScreen({navigation, route}: Props) {
  const {sessionId, title} = route.params;
  const {apiKey} = useStore();
  const {palette} = useThemeStore();
  const draftStore = useDraftStore();
  const offlineQueue = useOfflineQueue();

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState('');
  const [sessionStatus, setSessionStatus] = useState(route.params.status);
  const [computerId, setComputerId] = useState<string | undefined>(undefined);
  const [restarting, setRestarting] = useState(false);
  const [sessionModel, setSessionModel] = useState('');
  const [sessionReasoning, setSessionReasoning] = useState('');
  const [showQuickSettings, setShowQuickSettings] = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const messagesRef = useRef<Message[]>([]);
  const flatListRef = useRef<FlatList>(null);

  // Load draft on mount
  useEffect(() => {
    const draft = draftStore.getDraft(sessionId);
    if (draft) {
      setText(draft);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // Persist draft on text change
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (text.trim()) {
        draftStore.setDraft(sessionId, text);
      }
    }, 500);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, sessionId]);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const fetchMessages = useCallback(async () => {
    try {
      const data = await getMessages(apiKey, sessionId);
      const merged = mergeMessages([], data.messages);
      setMessages(merged);
      messagesRef.current = merged;

      if (data.pagination.hasMore) {
        let cursor = data.pagination.nextCursor;
        while (cursor) {
          const more = await getMessages(apiKey, sessionId, cursor);
          const next = mergeMessages(messagesRef.current, more.messages);
          setMessages(next);
          messagesRef.current = next;
          cursor = more.pagination.hasMore ? more.pagination.nextCursor : null;
        }
      }
    } catch {
      // silent fail on poll
    }
  }, [apiKey, sessionId]);

  const checkStatus = useCallback(async () => {
    try {
      const session = await getSession(apiKey, sessionId);
      setSessionStatus(session.status);
      await fetchMessages();
      if (session.status === 'idle') {
        stopPolling();
      }
    } catch {
      // ignore
    }
  }, [apiKey, sessionId, fetchMessages, stopPolling]);

  const checkStatusRef = useRef(checkStatus);
  useEffect(() => {
    checkStatusRef.current = checkStatus;
  }, [checkStatus]);

  const startPolling = useCallback(() => {
    if (pollRef.current) {
      return;
    }
    pollRef.current = setInterval(
      () => checkStatusRef.current(),
      POLL_INTERVAL_MS,
    );
  }, []);

  const handleInterrupt = useCallback(async () => {
    try {
      await interruptSession(apiKey, sessionId);
      stopPolling();
      setSessionStatus('idle');
    } catch {
      Alert.alert('Error', 'Failed to interrupt session.');
    }
  }, [apiKey, sessionId, stopPolling]);

  useEffect(() => {
    navigation.setOptions({
      title: title || `Session ${sessionId.slice(0, 8)}`,
      headerRight:
        sessionStatus === 'running' || sessionStatus === 'pending'
          ? () => (
              <StopButton onPress={handleInterrupt} color={palette.danger} />
            )
          : undefined,
    });
  }, [
    navigation,
    sessionId,
    title,
    sessionStatus,
    handleInterrupt,
    palette,
    sessionModel,
  ]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchMessages(),
      getSession(apiKey, sessionId).then(s => {
        setComputerId(s.computerId);
        if (s.sessionSettings?.model) {
          setSessionModel(s.sessionSettings.model);
        }
        if (s.sessionSettings?.reasoningEffort) {
          setSessionReasoning(s.sessionSettings.reasoningEffort);
        }
      }),
      offlineQueue.load(),
    ]).finally(() => setLoading(false));
    if (route.params.status !== 'idle') {
      startPolling();
    }
    return stopPolling;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleModelChange(model: string) {
    setSessionModel(model);
    try {
      await updateSession(apiKey, sessionId, {model});
    } catch {
      // Settings change failed silently, local state still updated
    }
  }

  async function handleReasoningChange(reasoning: string) {
    setSessionReasoning(reasoning);
    try {
      await updateSession(apiKey, sessionId, {reasoningEffort: reasoning});
    } catch {
      // Settings change failed silently
    }
  }

  async function ensureComputerRunning(): Promise<boolean> {
    if (!computerId) {
      return true;
    }
    try {
      const computer = await getComputer(apiKey, computerId);
      if (computer.status === 'active') {
        return true;
      }
      setRestarting(true);
      await restartComputer(apiKey, computerId);
      for (let i = 0; i < 10; i++) {
        await new Promise(r => setTimeout(r, 3000));
        const updated = await getComputer(apiKey, computerId);
        if (updated.status === 'active') {
          return true;
        }
      }
      Alert.alert(
        'Timeout',
        'Computer is still starting up. Your message has been queued and will be sent when ready.',
      );
      return false;
    } catch (e: any) {
      Alert.alert(
        'Computer Not Ready',
        'Your message has been queued and will be sent when the computer is available.',
      );
      return false;
    } finally {
      setRestarting(false);
    }
  }

  async function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || sending || restarting) {
      return;
    }
    setSending(true);
    setText('');
    draftStore.clearDraft(sessionId);

    const ready = await ensureComputerRunning();
    if (!ready) {
      await offlineQueue.enqueue(sessionId, trimmed);
      setSending(false);
      return;
    }

    try {
      const result = await postMessage(apiKey, sessionId, trimmed);
      setSessionStatus(result.status as 'idle' | 'pending' | 'running');
      await fetchMessages();
      if (result.status !== 'idle') {
        startPolling();
      }
      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({animated: true});
      }, 200);
    } catch (e: any) {
      const status = e?.response?.status;
      const detail = e?.response?.data?.detail;

      if (!e?.response) {
        // Network error - queue for offline
        await offlineQueue.enqueue(sessionId, trimmed);
        Alert.alert(
          'Offline',
          'Message queued. It will be sent when you reconnect.',
        );
        setSending(false);
        return;
      }

      if (status === 503 || status === 502) {
        const retryReady = await ensureComputerRunning();
        if (retryReady) {
          try {
            const result = await postMessage(apiKey, sessionId, trimmed);
            setSessionStatus(result.status as 'idle' | 'pending' | 'running');
            await fetchMessages();
            if (result.status !== 'idle') {
              startPolling();
            }
            setSending(false);
            return;
          } catch {
            // fall through
          }
        }
      }
      Alert.alert(
        'Error',
        typeof detail === 'string'
          ? detail
          : 'Failed to send message. Check your connection and try again.',
      );
      setText(trimmed);
    } finally {
      setSending(false);
    }
  }

  // Process queued messages when session becomes idle
  useEffect(() => {
    if (sessionStatus === 'idle') {
      const queued = offlineQueue.getSessionQueue(sessionId);
      if (queued.length > 0) {
        offlineQueue.processQueue(apiKey).then(() => {
          fetchMessages();
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionStatus]);

  const isThinking =
    sessionStatus === 'running' || sessionStatus === 'pending' || restarting;

  const queuedMessages = offlineQueue.getSessionQueue(sessionId);

  if (loading) {
    return (
      <View style={[styles.center, {backgroundColor: palette.bg}]}>
        <ActivityIndicator size="large" color={palette.accent} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.root, {backgroundColor: palette.bg}]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={80}>
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={m => m.id}
        renderItem={({item}) => <MessageBubble message={item} />}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => {
          flatListRef.current?.scrollToEnd({animated: false});
        }}
        ListEmptyComponent={
          <View style={styles.emptyChat}>
            <Text style={[styles.emptyChatIcon, {color: palette.textTertiary}]}>
              {'\uD83D\uDCAC'}
            </Text>
            <Text style={[styles.emptyChatText, {color: palette.textTertiary}]}>
              Send a message to start the conversation
            </Text>
            <TouchableOpacity
              style={styles.quickSettingsHint}
              onPress={() => setShowQuickSettings(!showQuickSettings)}>
              <Text style={[styles.hintText, {color: palette.accent}]}>
                Tap to configure model & reasoning
              </Text>
            </TouchableOpacity>
          </View>
        }
        ListFooterComponent={
          <>
            {queuedMessages.length > 0 && (
              <View
                style={[
                  styles.queueBanner,
                  {backgroundColor: palette.surfaceSecondary},
                ]}>
                <Text
                  style={[styles.queueText, {color: palette.textSecondary}]}>
                  {queuedMessages.length} message(s) queued
                </Text>
              </View>
            )}
            {isThinking ? (
              <View style={styles.thinkingRow}>
                <ActivityIndicator size="small" color={palette.accent} />
                <Text
                  style={[styles.thinkingText, {color: palette.textSecondary}]}>
                  {restarting ? 'Starting computer...' : 'Droid is thinking...'}
                </Text>
              </View>
            ) : null}
          </>
        }
      />

      {(showQuickSettings || messages.length === 0) && (
        <QuickSettings
          sessionModel={sessionModel}
          sessionReasoning={sessionReasoning}
          onChangeModel={handleModelChange}
          onChangeReasoning={handleReasoningChange}
        />
      )}

      <View
        style={[
          styles.inputBar,
          {backgroundColor: palette.surface, borderTopColor: palette.border},
        ]}>
        <TouchableOpacity
          style={[
            styles.settingsToggle,
            {backgroundColor: palette.surfaceSecondary},
          ]}
          onPress={() => setShowQuickSettings(!showQuickSettings)}
          activeOpacity={0.7}>
          <Text
            style={[styles.settingsToggleText, {color: palette.textSecondary}]}>
            {'\u2699'}
          </Text>
        </TouchableOpacity>

        <TextInput
          style={[
            styles.textInput,
            {backgroundColor: palette.inputBg, color: palette.text},
          ]}
          value={text}
          onChangeText={setText}
          placeholder="Message Droid..."
          placeholderTextColor={palette.textTertiary}
          multiline
          maxLength={10000}
          editable={!sending}
        />
        <TouchableOpacity
          style={[
            styles.sendBtn,
            {backgroundColor: palette.accent},
            (!text.trim() || isThinking || sending) && {
              backgroundColor: palette.surfaceSecondary,
            },
          ]}
          onPress={handleSend}
          disabled={!text.trim() || sending}>
          <Text
            style={[
              styles.sendBtnText,
              {
                color:
                  !text.trim() || isThinking || sending
                    ? palette.textTertiary
                    : '#fff',
              },
            ]}>
            {'\u2191'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
  messageList: {
    paddingVertical: 12,
    paddingBottom: 8,
  },
  emptyChat: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 12,
  },
  emptyChatIcon: {
    fontSize: 48,
  },
  emptyChatText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  quickSettingsHint: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  hintText: {
    fontSize: 13,
    fontWeight: '500',
  },
  queueBanner: {
    marginHorizontal: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  queueText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  thinkingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  thinkingText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 6,
  },
  settingsToggle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 3,
  },
  settingsToggleText: {
    fontSize: 18,
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  sendBtnText: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerBtn: {
    paddingHorizontal: 12,
  },
  headerBtnText: {
    fontWeight: '600',
    fontSize: 15,
  },
});
