import React, {useState} from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {getModelLabel} from '../config/models';
import {
  REASONING_OPTIONS,
  ReasoningEffort,
  useSettingsStore,
} from '../store/useSettingsStore';
import {useThemeStore} from '../store/useThemeStore';
import {ModelPicker} from './ModelPicker';

interface Props {
  sessionModel?: string;
  sessionReasoning?: string;
  onChangeModel?: (model: string) => void;
  onChangeReasoning?: (reasoning: string) => void;
}

const REASONING_LABELS: Record<string, string> = {
  dynamic: 'Auto',
  off: 'Off',
  minimal: 'Min',
  low: 'Low',
  medium: 'Med',
  high: 'High',
  xhigh: 'XHigh',
  max: 'Max',
};

export function QuickSettings({
  sessionModel,
  sessionReasoning,
  onChangeModel,
  onChangeReasoning,
}: Props) {
  const {palette} = useThemeStore();
  const settings = useSettingsStore();
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [showReasoningPicker, setShowReasoningPicker] = useState(false);

  const currentModel = sessionModel || settings.model;
  const currentReasoning = sessionReasoning || settings.reasoningEffort;

  function handleModelSelect(modelId: string) {
    if (onChangeModel) {
      onChangeModel(modelId);
    } else {
      settings.update({model: modelId});
    }
  }

  function handleReasoningSelect(reasoning: string) {
    if (onChangeReasoning) {
      onChangeReasoning(reasoning);
    } else {
      settings.update({reasoningEffort: reasoning as ReasoningEffort});
    }
    setShowReasoningPicker(false);
  }

  return (
    <>
      <View style={styles.bar}>
        <TouchableOpacity
          style={[
            styles.pill,
            {
              backgroundColor: palette.surfaceSecondary,
              borderColor: palette.border,
            },
          ]}
          onPress={() => setShowModelPicker(true)}
          activeOpacity={0.7}>
          <Text style={[styles.pillLabel, {color: palette.textTertiary}]}>
            Model
          </Text>
          <Text
            style={[styles.pillValue, {color: palette.text}]}
            numberOfLines={1}>
            {getModelLabel(currentModel)}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.pill,
            {
              backgroundColor: palette.surfaceSecondary,
              borderColor: palette.border,
            },
          ]}
          onPress={() => setShowReasoningPicker(true)}
          activeOpacity={0.7}>
          <Text style={[styles.pillLabel, {color: palette.textTertiary}]}>
            Reasoning
          </Text>
          <Text style={[styles.pillValue, {color: palette.text}]}>
            {REASONING_LABELS[currentReasoning] || currentReasoning}
          </Text>
        </TouchableOpacity>
      </View>

      <ModelPicker
        visible={showModelPicker}
        selectedModel={currentModel}
        onSelect={handleModelSelect}
        onClose={() => setShowModelPicker(false)}
      />

      <Modal
        visible={showReasoningPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowReasoningPicker(false)}>
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setShowReasoningPicker(false)}>
          <View
            style={[
              styles.reasoningSheet,
              {backgroundColor: palette.surface, borderColor: palette.border},
            ]}>
            <Text style={[styles.sheetTitle, {color: palette.text}]}>
              Reasoning Level
            </Text>
            <Text
              style={[styles.sheetSubtitle, {color: palette.textSecondary}]}>
              "Auto" dynamically picks the best level for each prompt
            </Text>
            <ScrollView contentContainerStyle={styles.reasoningGrid}>
              {REASONING_OPTIONS.map(opt => {
                const isActive = opt === currentReasoning;
                return (
                  <TouchableOpacity
                    key={opt}
                    style={[
                      styles.reasoningOption,
                      {
                        backgroundColor: isActive
                          ? palette.accent
                          : palette.surfaceSecondary,
                        borderColor: isActive ? palette.accent : palette.border,
                      },
                    ]}
                    onPress={() => handleReasoningSelect(opt)}>
                    <Text
                      style={[
                        styles.reasoningOptText,
                        {color: isActive ? '#fff' : palette.text},
                      ]}>
                      {REASONING_LABELS[opt] || opt}
                    </Text>
                    {opt === 'dynamic' && (
                      <Text
                        style={[
                          styles.reasoningOptHint,
                          {
                            color: isActive
                              ? 'rgba(255,255,255,0.8)'
                              : palette.textTertiary,
                          },
                        ]}>
                        recommended
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 4,
  },
  pillLabel: {fontSize: 11, fontWeight: '500'},
  pillValue: {fontSize: 12, fontWeight: '600', maxWidth: 120},
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  reasoningSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
  sheetTitle: {fontSize: 17, fontWeight: '600', marginBottom: 4},
  sheetSubtitle: {fontSize: 13, marginBottom: 16},
  reasoningGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingBottom: 20,
  },
  reasoningOption: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    minWidth: 70,
  },
  reasoningOptText: {fontSize: 14, fontWeight: '600'},
  reasoningOptHint: {fontSize: 10, marginTop: 2},
});
