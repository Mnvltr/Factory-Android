import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import React from 'react';
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

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Settings'>;
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
}: {
  label: string;
  options: readonly string[];
  value: string;
  onChange: (v: string) => void;
  palette: any;
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
                {opt}
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

      <SectionHeader title="FACTORY DEFAULTS" palette={palette} />

      <View style={[styles.row, {borderBottomColor: palette.border}]}>
        <RowLabel label="Model" palette={palette} />
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

      <PickerRow
        label="Reasoning"
        options={REASONING_OPTIONS}
        value={settings.reasoningEffort}
        onChange={v => settings.update({reasoningEffort: v as any})}
        palette={palette}
      />

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
        Factory Mobile v0.2.0
      </Text>
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
    marginLeft: 12,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    maxWidth: 220,
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 24,
  },
});
