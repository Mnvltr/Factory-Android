import React, {useState} from 'react';
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {MODEL_GROUPS, ModelInfo, ALL_MODELS, findModel} from '../config/models';
import {useThemeStore} from '../store/useThemeStore';

interface Props {
  visible: boolean;
  selectedModel: string;
  onSelect: (modelId: string) => void;
  onClose: () => void;
}

export function ModelPicker({
  visible,
  selectedModel,
  onSelect,
  onClose,
}: Props) {
  const {palette} = useThemeStore();
  const [search, setSearch] = useState('');

  const filtered = search.trim()
    ? ALL_MODELS.filter(
        m =>
          m.label.toLowerCase().includes(search.toLowerCase()) ||
          m.provider.toLowerCase().includes(search.toLowerCase()) ||
          m.id.toLowerCase().includes(search.toLowerCase()),
      )
    : null;

  function handleSelect(model: ModelInfo) {
    onSelect(model.id);
    onClose();
    setSearch('');
  }

  function renderModelItem(model: ModelInfo) {
    const isSelected = model.id === selectedModel;
    return (
      <TouchableOpacity
        key={model.id}
        style={[
          styles.modelItem,
          {
            backgroundColor: isSelected ? palette.accentLight : palette.surface,
            borderColor: isSelected ? palette.accent : palette.border,
          },
        ]}
        onPress={() => handleSelect(model)}
        activeOpacity={0.7}>
        <View style={styles.modelItemContent}>
          <View style={styles.modelItemHeader}>
            <Text
              style={[
                styles.modelName,
                {color: isSelected ? palette.accent : palette.text},
              ]}>
              {model.label}
            </Text>
            {model.contextWindow && (
              <Text
                style={[styles.contextBadge, {color: palette.textTertiary}]}>
                {model.contextWindow}
              </Text>
            )}
          </View>
          <Text style={[styles.modelDesc, {color: palette.textSecondary}]}>
            {model.description}
          </Text>
          <View style={styles.modelMeta}>
            <Text style={[styles.modelId, {color: palette.textTertiary}]}>
              {model.id}
            </Text>
            {model.supportsReasoning && (
              <View
                style={[
                  styles.reasoningBadge,
                  {backgroundColor: palette.surfaceSecondary},
                ]}>
                <Text
                  style={[
                    styles.reasoningText,
                    {color: palette.textSecondary},
                  ]}>
                  reasoning
                </Text>
              </View>
            )}
          </View>
        </View>
        {isSelected && (
          <Text style={[styles.checkmark, {color: palette.accent}]}>
            {'\u2713'}
          </Text>
        )}
      </TouchableOpacity>
    );
  }

  const sections: {title: string; data: ModelInfo[]}[] = filtered
    ? [{title: 'Results', data: filtered}]
    : MODEL_GROUPS.map(g => ({title: g.provider, data: g.models}));

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <View style={[styles.root, {backgroundColor: palette.bg}]}>
        <View
          style={[
            styles.header,
            {
              backgroundColor: palette.surface,
              borderBottomColor: palette.border,
            },
          ]}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={[styles.closeBtnText, {color: palette.accent}]}>
              Cancel
            </Text>
          </TouchableOpacity>
          <Text style={[styles.title, {color: palette.text}]}>
            Select Model
          </Text>
          <View style={styles.closeBtn} />
        </View>

        <View style={styles.searchContainer}>
          <TextInput
            style={[
              styles.searchInput,
              {
                backgroundColor: palette.inputBg,
                color: palette.text,
                borderColor: palette.border,
              },
            ]}
            placeholder="Search models..."
            placeholderTextColor={palette.textTertiary}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <FlatList
          data={sections}
          keyExtractor={item => item.title}
          renderItem={({item: section}) => (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, {color: palette.accent}]}>
                {section.title.toUpperCase()}
              </Text>
              {section.data.map(model => renderModelItem(model))}
            </View>
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptySearch}>
              <Text style={[styles.emptyText, {color: palette.textSecondary}]}>
                No models match "{search}"
              </Text>
            </View>
          }
        />

        {selectedModel && !findModel(selectedModel) && (
          <View
            style={[
              styles.customModelBar,
              {
                backgroundColor: palette.surface,
                borderTopColor: palette.border,
              },
            ]}>
            <Text style={[styles.customLabel, {color: palette.textSecondary}]}>
              Custom: {selectedModel}
            </Text>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {fontSize: 17, fontWeight: '600'},
  closeBtn: {width: 60},
  closeBtnText: {fontSize: 16, fontWeight: '500'},
  searchContainer: {paddingHorizontal: 16, paddingVertical: 10},
  searchInput: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
  },
  listContent: {paddingBottom: 40},
  section: {paddingHorizontal: 16, marginTop: 16},
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  modelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  modelItemContent: {flex: 1},
  modelItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  modelName: {fontSize: 15, fontWeight: '600'},
  contextBadge: {fontSize: 11, fontWeight: '500'},
  modelDesc: {fontSize: 13, marginBottom: 4},
  modelMeta: {flexDirection: 'row', alignItems: 'center', gap: 8},
  modelId: {fontSize: 11, fontFamily: 'monospace'},
  reasoningBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  reasoningText: {fontSize: 10, fontWeight: '600'},
  checkmark: {fontSize: 20, fontWeight: '700', marginLeft: 8},
  emptySearch: {alignItems: 'center', paddingTop: 40},
  emptyText: {fontSize: 15},
  customModelBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  customLabel: {fontSize: 13},
});
