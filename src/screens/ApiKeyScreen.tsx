import React, {useState} from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {useStore} from '../store/useStore';
import {useThemeStore} from '../store/useThemeStore';

export function ApiKeyScreen() {
  const {setApiKey} = useStore();
  const {palette, fonts} = useThemeStore();
  const [input, setInput] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const trimmed = input.trim();
    if (!trimmed) {
      Alert.alert('Error', 'Please enter your Factory API key.');
      return;
    }
    setSaving(true);
    try {
      await setApiKey(trimmed);
    } catch {
      Alert.alert('Error', 'Failed to save API key.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.root, {backgroundColor: palette.bg}]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.inner}>
        <Text
          style={[
            styles.title,
            {color: palette.text, fontSize: fonts.heading},
          ]}>
          Factory
        </Text>
        <Text style={[styles.subtitle, {color: palette.textSecondary}]}>
          Enter your API key to get started
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: palette.surface,
              color: palette.text,
              borderColor: palette.border,
            },
          ]}
          placeholder="factory_..."
          placeholderTextColor={palette.textTertiary}
          value={input}
          onChangeText={setInput}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
          onSubmitEditing={handleSave}
          returnKeyType="done"
        />
        <TouchableOpacity
          style={[
            styles.button,
            {backgroundColor: palette.accent},
            saving && styles.buttonDisabled,
          ]}
          onPress={handleSave}
          disabled={saving}>
          <Text style={styles.buttonText}>
            {saving ? 'Saving...' : 'Continue'}
          </Text>
        </TouchableOpacity>
        <Text style={[styles.hint, {color: palette.textTertiary}]}>
          Get your API key from app.factory.ai/settings
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  title: {
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  hint: {
    fontSize: 13,
    textAlign: 'center',
  },
});
