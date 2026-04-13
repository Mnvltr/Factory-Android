import React, {useState} from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import Markdown from 'react-native-markdown-display';
import {ContentBlock, Message} from '../api/factoryApi';
import {useThemeStore} from '../store/useThemeStore';

function extractText(blocks: ContentBlock[]): string {
  return blocks
    .filter(b => b.type === 'text' && b.text)
    .map(b => b.text!)
    .join('\n');
}

function ThinkingBlock({block, palette}: {block: ContentBlock; palette: any}) {
  const [expanded, setExpanded] = useState(false);
  const text = block.thinking || '';
  const isRedacted = block.type === 'redacted_thinking';
  const preview = text.slice(0, 80);

  return (
    <TouchableOpacity
      style={[
        styles.thinkingBlock,
        {
          backgroundColor: palette.surfaceSecondary,
          borderLeftColor: palette.accent,
        },
      ]}
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.7}>
      <View style={styles.thinkingHeader}>
        <Text style={[styles.thinkingLabel, {color: palette.accent}]}>
          {isRedacted
            ? '\uD83D\uDD12 Redacted thinking'
            : '\uD83D\uDCA1 Thinking'}
        </Text>
        <Text style={[styles.expandIcon, {color: palette.textTertiary}]}>
          {expanded ? '\u25B2' : '\u25BC'}
        </Text>
      </View>
      {!isRedacted && (
        <Text
          style={[styles.thinkingText, {color: palette.textSecondary}]}
          numberOfLines={expanded ? undefined : 2}>
          {expanded ? text : preview + (text.length > 80 ? '...' : '')}
        </Text>
      )}
    </TouchableOpacity>
  );
}

function ToolRow({block, palette}: {block: ContentBlock; palette: any}) {
  const [expanded, setExpanded] = useState(false);
  const isUse = block.type === 'tool_use';
  const label = isUse ? block.name ?? 'tool' : 'result';
  const icon = isUse ? '\u25B6' : '\u25C0';

  return (
    <TouchableOpacity
      style={[
        styles.toolRow,
        {backgroundColor: palette.toolBg, borderLeftColor: palette.toolBorder},
      ]}
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.7}>
      <View style={styles.toolHeader}>
        <Text style={[styles.toolIcon, {color: palette.textTertiary}]}>
          {icon}
        </Text>
        <Text style={[styles.toolText, {color: palette.textTertiary}]}>
          {label}
        </Text>
        {isUse && block.input && (
          <Text style={[styles.expandIcon, {color: palette.textTertiary}]}>
            {expanded ? '\u25B2' : '\u25BC'}
          </Text>
        )}
      </View>
      {expanded && isUse && block.input && (
        <Text
          style={[styles.toolDetail, {color: palette.textTertiary}]}
          numberOfLines={12}>
          {JSON.stringify(block.input, null, 2)}
        </Text>
      )}
    </TouchableOpacity>
  );
}

export function MessageBubble({message}: {message: Message}) {
  const {palette, fonts} = useThemeStore();
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  const textBlocks = message.content.filter(b => b.type === 'text' && b.text);
  const toolBlocks = message.content.filter(
    b => b.type === 'tool_use' || b.type === 'tool_result',
  );
  const thinkingBlocks = message.content.filter(
    b => b.type === 'thinking' || b.type === 'redacted_thinking',
  );

  if (!isUser && !isAssistant) {
    if (toolBlocks.length > 0) {
      return (
        <View style={styles.toolContainer}>
          {toolBlocks.map((b, i) => (
            <ToolRow key={i} block={b} palette={palette} />
          ))}
        </View>
      );
    }
    return null;
  }

  if (
    textBlocks.length === 0 &&
    toolBlocks.length === 0 &&
    thinkingBlocks.length === 0
  ) {
    return null;
  }

  const text = extractText(message.content);

  const mdStyles = {
    body: {
      color: isUser ? palette.userBubbleText : palette.assistantBubbleText,
      fontSize: fonts.body,
      lineHeight: fonts.body * 1.45,
    },
    code_inline: {
      backgroundColor: isUser
        ? 'rgba(255,255,255,0.2)'
        : palette.surfaceSecondary,
      fontFamily: 'monospace',
      fontSize: fonts.body - 2,
      borderRadius: 4,
      paddingHorizontal: 5,
    },
    fence: {
      backgroundColor: '#1e1e2e',
      borderRadius: 10,
      padding: 12,
      marginVertical: 6,
    },
    code_block: {
      color: '#cdd6f4',
      fontFamily: 'monospace',
      fontSize: fonts.body - 2,
    },
    link: {color: isUser ? '#93c5fd' : palette.accent},
    heading1: {
      color: isUser ? palette.userBubbleText : palette.assistantBubbleText,
      fontSize: fonts.body + 4,
      fontWeight: '700' as const,
      marginBottom: 6,
      marginTop: 8,
    },
    heading2: {
      color: isUser ? palette.userBubbleText : palette.assistantBubbleText,
      fontSize: fonts.body + 2,
      fontWeight: '600' as const,
      marginBottom: 4,
      marginTop: 6,
    },
    bullet_list: {paddingLeft: 4},
    ordered_list: {paddingLeft: 4},
    list_item: {
      marginBottom: 4,
    },
  };

  return (
    <View
      style={[
        styles.container,
        isUser ? styles.userContainer : styles.assistantContainer,
      ]}>
      {/* Thinking blocks shown before content */}
      {thinkingBlocks.length > 0 && (
        <View style={styles.thinkingContainer}>
          {thinkingBlocks.map((b, i) => (
            <ThinkingBlock key={i} block={b} palette={palette} />
          ))}
        </View>
      )}

      {/* Tool blocks */}
      {toolBlocks.length > 0 && (
        <View style={styles.toolContainer}>
          {toolBlocks.map((b, i) => (
            <ToolRow key={i} block={b} palette={palette} />
          ))}
        </View>
      )}

      {/* Text content */}
      {text.length > 0 && (
        <View
          style={[
            styles.bubble,
            isUser
              ? [styles.userBubble, {backgroundColor: palette.userBubble}]
              : [
                  styles.assistantBubble,
                  {
                    backgroundColor: palette.assistantBubble,
                    borderColor: palette.border,
                    borderWidth: StyleSheet.hairlineWidth,
                  },
                ],
          ]}>
          {isAssistant ? (
            <Markdown style={mdStyles}>{text}</Markdown>
          ) : (
            <Text
              style={{
                color: palette.userBubbleText,
                fontSize: fonts.body,
                lineHeight: fonts.body * 1.45,
              }}>
              {text}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 3,
    marginHorizontal: 12,
    maxWidth: '85%',
  },
  userContainer: {
    alignSelf: 'flex-end',
  },
  assistantContainer: {
    alignSelf: 'flex-start',
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  userBubble: {
    borderBottomRightRadius: 6,
  },
  assistantBubble: {
    borderBottomLeftRadius: 6,
  },
  thinkingContainer: {
    marginBottom: 4,
  },
  thinkingBlock: {
    borderRadius: 10,
    borderLeftWidth: 3,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginVertical: 2,
  },
  thinkingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  thinkingLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  thinkingText: {
    fontSize: 12,
    marginTop: 4,
    lineHeight: 17,
  },
  toolContainer: {
    marginHorizontal: 12,
    marginVertical: 2,
  },
  toolRow: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginVertical: 1,
    borderLeftWidth: 3,
  },
  toolHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  toolIcon: {
    fontSize: 8,
  },
  toolText: {
    fontSize: 12,
    fontFamily: 'monospace',
    flex: 1,
  },
  expandIcon: {
    fontSize: 10,
  },
  toolDetail: {
    fontSize: 11,
    fontFamily: 'monospace',
    marginTop: 6,
    lineHeight: 16,
  },
});
