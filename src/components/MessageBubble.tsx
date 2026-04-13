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

function ToolRow({block, palette}: {block: ContentBlock; palette: any}) {
  const [expanded, setExpanded] = useState(false);
  const label =
    block.type === 'tool_use' ? `> ${block.name ?? 'tool'}` : '< result';

  return (
    <TouchableOpacity
      style={[
        styles.toolRow,
        {backgroundColor: palette.toolBg, borderLeftColor: palette.toolBorder},
      ]}
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.7}>
      <Text style={[styles.toolText, {color: palette.textTertiary}]}>
        {label}
      </Text>
      {expanded && block.type === 'tool_use' && block.input && (
        <Text
          style={[styles.toolDetail, {color: palette.textTertiary}]}
          numberOfLines={6}>
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

  if (textBlocks.length === 0 && toolBlocks.length === 0) {
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
  };

  return (
    <View
      style={[
        styles.container,
        isUser ? styles.userContainer : styles.assistantContainer,
      ]}>
      {toolBlocks.length > 0 && (
        <View style={styles.toolContainer}>
          {toolBlocks.map((b, i) => (
            <ToolRow key={i} block={b} palette={palette} />
          ))}
        </View>
      )}
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
  toolContainer: {
    marginHorizontal: 12,
    marginVertical: 2,
  },
  toolRow: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginVertical: 1,
    borderLeftWidth: 3,
  },
  toolText: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  toolDetail: {
    fontSize: 11,
    fontFamily: 'monospace',
    marginTop: 4,
  },
});
