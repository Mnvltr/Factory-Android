import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import React, {useState} from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {useStore} from '../store/useStore';
import {useThemeStore} from '../store/useThemeStore';
import {
  AUTONOMY_OPTIONS,
  INTERACTION_OPTIONS,
  REASONING_OPTIONS,
  useSettingsStore,
} from '../store/useSettingsStore';
import {ACCENT_OPTIONS, AccentName, FontSizeKey} from '../theme/colors';
import {RootStackParamList} from '../navigation/AppNavigator';
import {ModelPicker} from '../components/ModelPicker';
import {getModelLabel, findModel} from '../config/models';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Settings'>;
};

const REASONING_LABELS: Record<string, string> = {
  dynamic: 'Auto',
  off: 'Off',
  minimal: 'Minimal',
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  xhigh: 'Extra High',
  max: 'Max',
};

function SectionHeader({title, palette}: {title: string; palette: any}) {
  return (
    <Text style={[styles.sectionHeader, {color: palette.accent}]}>{title}</Text>
  );
}

function RowLabel({label, palette}: {label: string; palette: any}) {
  return <Text style={[styles.rowLabel, {color: palette.text}]}>{label}</Text>;
}

function PickerRow({
  label,
  options,
  value,
  onChange,
  palette,
  labels,
}: {
  label: string;
  options: readonly string[];
  value: string;
  onChange: (v: string) => void;
  palette: any;
  labels?: Record<string, string>;
}) {
  return (
    <View style={[styles.row, {borderBottomColor: palette.border}]}>
      <RowLabel label={label} palette={palette} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}>
        {options.map(opt => {
          const active = opt === value;
          return (
            <TouchableOpacity
              key={opt}
              style={[
                styles.chip,
                {
                  backgroundColor: active
                    ? palette.accent
                    : palette.surfaceSecondary,
                  borderColor: active ? palette.accent : palette.border,
                },
              ]}
              onPress={() => onChange(opt)}
              activeOpacity={0.7}>
              <Text
                style={[
                  styles.chipText,
                  {color: active ? '#fff' : palette.textSecondary},
                ]}>
                {labels?.[opt] || opt}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

export function SettingsScreen({navigation: _navigation}: Props) {
  const {setApiKey} = useStore();
  const theme = useThemeStore();
  const settings = useSettingsStore();
  const {palette} = theme;
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [showCustomModel, setShowCustomModel] = useState(false);

  function handleSignOut() {
    Alert.alert('Sign Out', 'Remove your API key and sign out?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => setApiKey(''),
      },
    ]);
  }

  const modelInfo = findModel(settings.model);

  return (
    <ScrollView
      style={[styles.root, {backgroundColor: palette.bg}]}
      contentContainerStyle={styles.content}>
      <SectionHeader title="APPEARANCE" palette={palette} />

      <View style={[styles.row, {borderBottomColor: palette.border}]}>
        <RowLabel label="Dark Mode" palette={palette} />
        <Switch
          value={theme.isDark}
          onValueChange={theme.setDark}
          trackColor={{false: palette.border, true: palette.accent}}
          thumbColor="#fff"
        />
      </View>

      <View style={[styles.row, {borderBottomColor: palette.border}]}>
        <RowLabel label="Accent Color" palette={palette} />
        <View style={styles.colorRow}>
          {ACCENT_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.name}
              style={[
                styles.colorDot,
                {backgroundColor: opt.color},
                theme.accent === opt.name && styles.colorDotActive,
              ]}
              onPress={() => theme.setAccent(opt.name as AccentName)}
            />
          ))}
        </View>
      </View>

      <PickerRow
        label="Font Size"
        options={['small', 'medium', 'large'] as const}
        value={theme.fontSize}
        onChange={v => theme.setFontSize(v as FontSizeKey)}
        palette={palette}
      />

      <SectionHeader title="MODEL" palette={palette} />

      <TouchableOpacity
        style={[styles.modelRow, {borderBottomColor: palette.border}]}
        onPress={() => setShowModelPicker(true)}
        activeOpacity={0.7}>
        <View style={styles.modelInfo}>
          <Text style={[styles.rowLabel, {color: palette.text}]}>
            {getModelLabel(settings.model)}
          </Text>
          {modelInfo && (
            <Text style={[styles.modelDesc, {color: palette.textSecondary}]}>
              {modelInfo.provider} {'\u00B7'} {modelInfo.description}
            </Text>
          )}
          {!settings.model && (
            <Text style={[styles.modelDesc, {color: palette.textTertiary}]}>
              Tap to select a model
            </Text>
          )}
        </View>
        <Text style={[styles.chevron, {color: palette.textTertiary}]}>
          {'\u203A'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.customModelRow, {borderBottomColor: palette.border}]}
        onPress={() => setShowCustomModel(!showCustomModel)}
        activeOpacity={0.7}>
        <Text style={[styles.customModelLabel, {color: palette.textSecondary}]}>
          {showCustomModel ? 'Hide custom model ID' : 'Enter custom model ID'}
        </Text>
      </TouchableOpacity>

      {showCustomModel && (
        <View style={[styles.row, {borderBottomColor: palette.border}]}>
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: palette.inputBg,
                color: palette.text,
                borderColor: palette.border,
              },
            ]}
            value={settings.model}
            onChangeText={v => settings.update({model: v})}
            placeholder="e.g. claude-sonnet-4-20250514"
            placeholderTextColor={palette.textTertiary}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      )}

      <SectionHeader title="REASONING & BEHAVIOR" palette={palette} />

      <PickerRow
        label="Reasoning"
        options={REASONING_OPTIONS}
        value={settings.reasoningEffort}
        onChange={v => settings.update({reasoningEffort: v as any})}
        palette={palette}
        labels={REASONING_LABELS}
      />

      <View style={[styles.hintRow, {borderBottomColor: palette.border}]}>
        <Text style={[styles.hintText, {color: palette.textTertiary}]}>
          "Auto" dynamically picks the best reasoning depth for each prompt. Use
          "High" or "Max" for complex coding tasks.
        </Text>
      </View>

      <PickerRow
        label="Interaction"
        options={INTERACTION_OPTIONS}
        value={settings.interactionMode}
        onChange={v => settings.update({interactionMode: v as any})}
        palette={palette}
      />

      <PickerRow
        label="Autonomy"
        options={AUTONOMY_OPTIONS}
        value={settings.autonomyLevel}
        onChange={v => settings.update({autonomyLevel: v as any})}
        palette={palette}
      />

      <SectionHeader title="ACCOUNT" palette={palette} />

      <TouchableOpacity
        style={[styles.row, {borderBottomColor: palette.border}]}
        onPress={handleSignOut}
        activeOpacity={0.7}>
        <Text style={[styles.rowLabel, {color: palette.danger}]}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={[styles.version, {color: palette.textTertiary}]}>
        Factory Mobile v0.3.0
      </Text>

      <ModelPicker
        visible={showModelPicker}
        selectedModel={settings.model}
        onSelect={model => settings.update({model})}
        onClose={() => setShowModelPicker(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    paddingBottom: 40,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: 52,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  modelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: 56,
  },
  modelInfo: {
    flex: 1,
  },
  modelDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  chevron: {
    fontSize: 24,
    fontWeight: '300',
    marginLeft: 8,
  },
  customModelRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  customModelLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  hintRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  hintText: {
    fontSize: 12,
    lineHeight: 17,
  },
  colorRow: {
    flexDirection: 'row',
    gap: 10,
  },
  colorDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  colorDotActive: {
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  chips: {
    flexDirection: 'row',
    gap: 6,
    paddingLeft: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  textInput: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 24,
  },
});
