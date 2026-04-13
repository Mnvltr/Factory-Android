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
  getMessages,
  getSession,
  interruptSession,
  Message,
  postMessage,
  restartComputer,
} from '../api/factoryApi';
import {MessageBubble} from '../components/MessageBubble';
import {RootStackParamList} from '../navigation/AppNavigator';
import {useStore} from '../store/useStore';
import {useThemeStore} from '../store/useThemeStore';

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

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState('');
  const [sessionStatus, setSessionStatus] = useState(route.params.status);
  const [computerId, setComputerId] = useState<string | undefined>(undefined);
  const [restarting, setRestarting] = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const messagesRef = useRef<Message[]>([]);

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
  }, [navigation, sessionId, title, sessionStatus, handleInterrupt, palette]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchMessages(),
      getSession(apiKey, sessionId).then(s => setComputerId(s.computerId)),
    ]).finally(() => setLoading(false));
    if (route.params.status !== 'idle') {
      startPolling();
    }
    return stopPolling;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function isComputerError(e: any): boolean {
    const detail = e?.response?.data?.detail;
    if (typeof detail !== 'string') {
      return false;
    }
    const lower = detail.toLowerCase();
    return (
      lower.includes('computer') ||
      lower.includes('sandbox') ||
      lower.includes('not active') ||
      lower.includes('not running') ||
      lower.includes('paused')
    );
  }

  async function handleRestart(pendingText?: string) {
    if (!computerId) {
      Alert.alert(
        'Error',
        'No computer is connected to this session. Create a new session from the sessions list.',
      );
      return;
    }
    setRestarting(true);
    try {
      await restartComputer(apiKey, computerId);
      // Give the computer a moment to come up
      await new Promise(r => setTimeout(r, 3000));
      if (pendingText) {
        await sendMessage(pendingText);
      }
    } catch (e: any) {
      Alert.alert(
        'Restart Failed',
        e?.response?.data?.detail ??
          'Could not restart the computer. Try from the Factory web app.',
      );
    } finally {
      setRestarting(false);
    }
  }

  async function sendMessage(msg: string) {
    try {
      const result = await postMessage(apiKey, sessionId, msg);
      setSessionStatus(result.status as 'idle' | 'pending' | 'running');
      await fetchMessages();
      if (result.status !== 'idle') {
        startPolling();
      }
    } catch (e: any) {
      if (isComputerError(e)) {
        Alert.alert(
          'Computer Not Active',
          'The computer connected to this session is paused. Would you like to restart it and resend?',
          [
            {text: 'Cancel', style: 'cancel', onPress: () => setText(msg)},
            {text: 'Restart & Send', onPress: () => handleRestart(msg)},
          ],
        );
      } else {
        const detail = e?.response?.data?.detail;
        Alert.alert(
          'Error',
          typeof detail === 'string'
            ? detail
            : 'Failed to send message. Check your connection and try again.',
        );
        setText(msg);
      }
    }
  }

  async function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || sending || restarting) {
      return;
    }
    setSending(true);
    setText('');
    await sendMessage(trimmed);
    setSending(false);
  }

  const isThinking =
    sessionStatus === 'running' || sessionStatus === 'pending' || restarting;

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
        data={messages}
        keyExtractor={m => m.id}
        renderItem={({item}) => <MessageBubble message={item} />}
        contentContainerStyle={styles.messageList}
        ListEmptyComponent={
          <View style={styles.emptyChat}>
            <Text style={[styles.emptyChatText, {color: palette.textTertiary}]}>
              Send a message to start the conversation
            </Text>
          </View>
        }
        ListFooterComponent={
          isThinking ? (
            <View style={styles.thinkingRow}>
              <ActivityIndicator size="small" color={palette.accent} />
              <Text
                style={[styles.thinkingText, {color: palette.textSecondary}]}>
                {restarting ? 'Restarting computer...' : 'Droid is thinking...'}
              </Text>
            </View>
          ) : null
        }
      />
      <View
        style={[
          styles.inputBar,
          {backgroundColor: palette.surface, borderTopColor: palette.border},
        ]}>
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
          editable={!isThinking && !sending}
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
          disabled={!text.trim() || isThinking || sending}>
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
  },
  emptyChatText: {
    fontSize: 14,
    fontStyle: 'italic',
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
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 8,
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
