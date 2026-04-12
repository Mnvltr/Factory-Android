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

export function ApiKeyScreen() {
  const {setApiKey} = useStore();
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
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.inner}>
        <Text style={styles.title}>Factory</Text>
        <Text style={styles.subtitle}>Enter your API key to get started</Text>
        <TextInput
          style={styles.input}
          placeholder="factory_..."
          placeholderTextColor="#aaa"
          value={input}
          onChangeText={setInput}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
          onSubmitEditing={handleSave}
          returnKeyType="done"
        />
        <TouchableOpacity
          style={[styles.button, saving && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={saving}>
          <Text style={styles.buttonText}>
            {saving ? 'Saving...' : 'Continue'}
          </Text>
        </TouchableOpacity>
        <Text style={styles.hint}>
          Get your API key from app.factory.ai/settings
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#1565c0',
    borderRadius: 10,
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
    color: '#999',
    textAlign: 'center',
  },
});
