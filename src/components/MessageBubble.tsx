import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import Markdown from 'react-native-markdown-display';
import {ContentBlock, Message} from '../api/factoryApi';

function extractText(blocks: ContentBlock[]): string {
  return blocks
    .filter(b => b.type === 'text' && b.text)
    .map(b => b.text!)
    .join('\n');
}

function ToolRow({block}: {block: ContentBlock}) {
  const label =
    block.type === 'tool_use'
      ? `Tool: ${block.name ?? 'unknown'}`
      : 'Tool result';
  return (
    <View style={styles.toolRow}>
      <Text style={styles.toolText}>{label}</Text>
    </View>
  );
}

export function MessageBubble({message}: {message: Message}) {
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
            <ToolRow key={i} block={b} />
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

  return (
    <View
      style={[
        styles.container,
        isUser ? styles.userContainer : styles.assistantContainer,
      ]}>
      {toolBlocks.length > 0 && (
        <View style={styles.toolContainer}>
          {toolBlocks.map((b, i) => (
            <ToolRow key={i} block={b} />
          ))}
        </View>
      )}
      {text.length > 0 && (
        <View
          style={[
            styles.bubble,
            isUser ? styles.userBubble : styles.assistantBubble,
          ]}>
          {isAssistant ? (
            <Markdown style={markdownStyles}>{text}</Markdown>
          ) : (
            <Text style={styles.userText}>{text}</Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
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
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  userBubble: {
    backgroundColor: '#1565c0',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: '#f0f0f0',
    borderBottomLeftRadius: 4,
  },
  userText: {
    color: '#fff',
    fontSize: 15,
    lineHeight: 21,
  },
  toolContainer: {
    marginHorizontal: 12,
    marginVertical: 2,
  },
  toolRow: {
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginVertical: 1,
    borderLeftWidth: 3,
    borderLeftColor: '#ccc',
  },
  toolText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
});

const markdownStyles = StyleSheet.create({
  body: {
    color: '#1a1a1a',
    fontSize: 15,
    lineHeight: 21,
  },
  code_inline: {
    backgroundColor: '#e0e0e0',
    fontFamily: 'monospace',
    fontSize: 13,
    borderRadius: 3,
    paddingHorizontal: 4,
  },
  fence: {
    backgroundColor: '#272822',
    borderRadius: 8,
    padding: 12,
    marginVertical: 6,
  },
  code_block: {
    color: '#f8f8f2',
    fontFamily: 'monospace',
    fontSize: 13,
  },
});
