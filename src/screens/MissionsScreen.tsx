import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createSession,
  getSession,
  listComputers,
  postMessage,
  Computer,
} from '../api/factoryApi';
import {useStore} from '../store/useStore';
import {useThemeStore} from '../store/useThemeStore';
import {useSettingsStore} from '../store/useSettingsStore';
type Props = {
  navigation: any;
};

interface MissionFeature {
  id: string;
  title: string;
  description: string;
  sessionId?: string;
  status: 'pending' | 'running' | 'done' | 'failed';
}

interface MissionData {
  id: string;
  goal: string;
  computerId: string;
  features: MissionFeature[];
  createdAt: number;
  status: 'planning' | 'running' | 'done';
}

const MISSIONS_KEY = 'factory_missions';

async function loadMissions(): Promise<MissionData[]> {
  try {
    const raw = await AsyncStorage.getItem(MISSIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveMissions(missions: MissionData[]) {
  await AsyncStorage.setItem(MISSIONS_KEY, JSON.stringify(missions));
}

function FeatureRow({
  feature,
  palette,
  onTap,
}: {
  feature: MissionFeature;
  palette: any;
  onTap: () => void;
}) {
  const statusIcons: Record<string, string> = {
    pending: '\u25CB',
    running: '\u25D4',
    done: '\u2713',
    failed: '\u2717',
  };
  const statusColors: Record<string, string> = {
    pending: palette.textTertiary,
    running: palette.accent,
    done: palette.statusIdle,
    failed: palette.danger,
  };

  return (
    <TouchableOpacity
      style={[styles.featureRow, {borderBottomColor: palette.border}]}
      onPress={onTap}
      activeOpacity={0.7}>
      <Text style={{color: statusColors[feature.status], fontSize: 18}}>
        {statusIcons[feature.status]}
      </Text>
      <View style={styles.featureContent}>
        <Text
          style={[styles.featureTitle, {color: palette.text}]}
          numberOfLines={1}>
          {feature.title}
        </Text>
        <Text
          style={[styles.featureDesc, {color: palette.textSecondary}]}
          numberOfLines={1}>
          {feature.description}
        </Text>
      </View>
      {feature.sessionId && (
        <Text style={[styles.chevron, {color: palette.textTertiary}]}>
          {'\u203A'}
        </Text>
      )}
    </TouchableOpacity>
  );
}

export function MissionsScreen({navigation}: Props) {
  const {apiKey} = useStore();
  const {palette} = useThemeStore();
  const settings = useSettingsStore();
  const [missions, setMissions] = useState<MissionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [goal, setGoal] = useState('');
  const [computers, setComputers] = useState<Computer[]>([]);
  const [selectedComputer, setSelectedComputer] = useState<string>('');
  const [planning, setPlanning] = useState(false);
  const [runningMission, setRunningMission] = useState<string | null>(null);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    Promise.all([
      loadMissions().then(setMissions),
      listComputers(apiKey).then(d => {
        setComputers(d.computers.filter(c => c.status === 'active'));
        if (settings.defaultComputerId) {
          setSelectedComputer(settings.defaultComputerId);
        } else if (d.computers.length > 0) {
          const active = d.computers.find(c => c.status === 'active');
          if (active) {
            setSelectedComputer(active.id);
          }
        }
      }),
    ]).finally(() => setLoading(false));

    const ref = pollRef;
    return () => {
      if (ref.current) {
        clearInterval(ref.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreateMission() {
    if (!goal.trim() || !selectedComputer) {
      Alert.alert('Error', 'Enter a goal and select a computer.');
      return;
    }
    setPlanning(true);

    try {
      // Create a planning session to decompose the goal
      const planSession = await createSession(apiKey, selectedComputer, {
        model: settings.model || undefined,
        reasoningEffort: 'high',
        interactionMode: 'auto',
        autonomyLevel: 'high',
      });

      const planPrompt = `You are a project planner. Decompose the following goal into 3-8 discrete features/tasks. For each, provide a short title and a one-sentence description. Respond ONLY with valid JSON in this format:
{"features": [{"title": "...", "description": "..."}]}

Goal: ${goal.trim()}`;

      await postMessage(apiKey, planSession.sessionId, planPrompt);

      // Poll for planning to complete
      let planText = '';
      for (let i = 0; i < 20; i++) {
        await new Promise(r => setTimeout(r, 3000));
        const s = await getSession(apiKey, planSession.sessionId);
        if (s.status === 'idle') {
          // Fetch the response
          const {getMessages} = require('../api/factoryApi');
          const data = await getMessages(apiKey, planSession.sessionId);
          const assistantMsgs = data.messages.filter(
            (m: any) => m.role === 'assistant',
          );
          if (assistantMsgs.length > 0) {
            const last = assistantMsgs[assistantMsgs.length - 1];
            const textBlocks = last.content.filter(
              (b: any) => b.type === 'text' && b.text,
            );
            planText = textBlocks.map((b: any) => b.text).join('\n');
          }
          break;
        }
      }

      // Parse features from JSON
      let features: {title: string; description: string}[] = [];
      try {
        const jsonMatch = planText.match(/\{[\s\S]*"features"[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          features = parsed.features || [];
        }
      } catch {
        // If parsing fails, create a single feature from the goal
      }

      if (features.length === 0) {
        features = [
          {title: goal.trim().slice(0, 60), description: goal.trim()},
        ];
      }

      const mission: MissionData = {
        id: Date.now().toString(),
        goal: goal.trim(),
        computerId: selectedComputer,
        features: features.map((f, i) => ({
          id: `${Date.now()}-${i}`,
          title: f.title,
          description: f.description,
          status: 'pending',
        })),
        createdAt: Date.now(),
        status: 'planning',
      };

      const updated = [mission, ...missions];
      setMissions(updated);
      await saveMissions(updated);
      setGoal('');
      setShowCreate(false);
    } catch (e: any) {
      Alert.alert(
        'Planning Failed',
        e?.response?.data?.detail ?? 'Could not create mission plan.',
      );
    } finally {
      setPlanning(false);
    }
  }

  const runMission = useCallback(
    async (mission: MissionData) => {
      setRunningMission(mission.id);
      const updatedMissions = [...missions];
      const idx = updatedMissions.findIndex(m => m.id === mission.id);
      if (idx === -1) {
        return;
      }

      updatedMissions[idx] = {...updatedMissions[idx], status: 'running'};
      setMissions([...updatedMissions]);
      await saveMissions(updatedMissions);

      for (let fi = 0; fi < mission.features.length; fi++) {
        const feature = updatedMissions[idx].features[fi];
        if (feature.status === 'done') {
          continue;
        }

        // Update status to running
        updatedMissions[idx].features[fi] = {...feature, status: 'running'};
        setMissions([...updatedMissions]);
        await saveMissions(updatedMissions);

        try {
          // Create a session for this feature
          const session = await createSession(apiKey, mission.computerId, {
            model: settings.model || undefined,
            reasoningEffort: settings.reasoningEffort,
            interactionMode: 'auto',
            autonomyLevel: 'high',
          });

          updatedMissions[idx].features[fi].sessionId = session.sessionId;
          setMissions([...updatedMissions]);

          // Send the feature task
          const prompt = `Complete this task as part of a larger project.\n\nOverall project goal: ${mission.goal}\n\nYour specific task: ${feature.title}\nDetails: ${feature.description}\n\nComplete this task fully. When done, summarize what you accomplished.`;

          await postMessage(apiKey, session.sessionId, prompt);

          // Poll until done (max 5 minutes per feature)
          for (let p = 0; p < 100; p++) {
            await new Promise(r => setTimeout(r, 3000));
            const s = await getSession(apiKey, session.sessionId);
            if (s.status === 'idle') {
              break;
            }
          }

          updatedMissions[idx].features[fi].status = 'done';
        } catch {
          updatedMissions[idx].features[fi].status = 'failed';
        }

        setMissions([...updatedMissions]);
        await saveMissions(updatedMissions);
      }

      updatedMissions[idx].status = 'done';
      setMissions([...updatedMissions]);
      await saveMissions(updatedMissions);
      setRunningMission(null);
    },
    [apiKey, missions, settings],
  );

  async function handleDeleteMission(missionId: string) {
    Alert.alert('Delete Mission', 'Remove this mission?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const updated = missions.filter(m => m.id !== missionId);
          setMissions(updated);
          await saveMissions(updated);
        },
      },
    ]);
  }

  if (loading) {
    return (
      <View style={[styles.center, {backgroundColor: palette.bg}]}>
        <ActivityIndicator size="large" color={palette.accent} />
      </View>
    );
  }

  return (
    <View style={[styles.root, {backgroundColor: palette.bg}]}>
      {showCreate ? (
        <View style={styles.createPanel}>
          <Text style={[styles.createTitle, {color: palette.text}]}>
            Describe your mission goal
          </Text>
          <TextInput
            style={[
              styles.goalInput,
              {
                backgroundColor: palette.surface,
                color: palette.text,
                borderColor: palette.border,
              },
            ]}
            value={goal}
            onChangeText={setGoal}
            placeholder="e.g. Build a REST API with auth, database, and tests"
            placeholderTextColor={palette.textTertiary}
            multiline
            maxLength={2000}
          />

          {computers.length > 0 && (
            <View style={styles.computerSelect}>
              <Text
                style={[styles.selectLabel, {color: palette.textSecondary}]}>
                Computer:
              </Text>
              {computers.map(c => (
                <TouchableOpacity
                  key={c.id}
                  style={[
                    styles.computerChip,
                    {
                      backgroundColor:
                        selectedComputer === c.id
                          ? palette.accent
                          : palette.surfaceSecondary,
                      borderColor:
                        selectedComputer === c.id
                          ? palette.accent
                          : palette.border,
                    },
                  ]}
                  onPress={() => setSelectedComputer(c.id)}>
                  <Text
                    style={{
                      color: selectedComputer === c.id ? '#fff' : palette.text,
                      fontSize: 13,
                      fontWeight: '600',
                    }}>
                    {c.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.createButtons}>
            <TouchableOpacity
              style={[styles.cancelBtn, {borderColor: palette.border}]}
              onPress={() => setShowCreate(false)}>
              <Text style={{color: palette.textSecondary}}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.planBtn,
                {backgroundColor: palette.accent},
                planning && {opacity: 0.6},
              ]}
              onPress={handleCreateMission}
              disabled={planning || !goal.trim()}>
              {planning ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.planBtnText}>Plan Mission</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <FlatList
          data={missions}
          keyExtractor={m => m.id}
          renderItem={({item: mission}) => {
            const doneCount = mission.features.filter(
              f => f.status === 'done',
            ).length;
            const total = mission.features.length;
            const isRunning = runningMission === mission.id;

            return (
              <View
                style={[
                  styles.missionCard,
                  {
                    backgroundColor: palette.surface,
                    borderColor: palette.border,
                  },
                ]}>
                <View style={styles.missionHeader}>
                  <Text
                    style={[styles.missionGoal, {color: palette.text}]}
                    numberOfLines={2}>
                    {mission.goal}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleDeleteMission(mission.id)}>
                    <Text style={{color: palette.danger, fontSize: 18}}>
                      {'\u2715'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.progressRow}>
                  <View
                    style={[
                      styles.progressBar,
                      {backgroundColor: palette.surfaceSecondary},
                    ]}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          backgroundColor: palette.accent,
                          width:
                            total > 0 ? `${(doneCount / total) * 100}%` : '0%',
                        },
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.progressText,
                      {color: palette.textSecondary},
                    ]}>
                    {doneCount}/{total}
                  </Text>
                </View>

                {mission.features.map(feature => (
                  <FeatureRow
                    key={feature.id}
                    feature={feature}
                    palette={palette}
                    onTap={() => {
                      if (feature.sessionId) {
                        navigation.navigate('Chat', {
                          sessionId: feature.sessionId,
                          title: feature.title,
                          status: 'idle',
                        });
                      }
                    }}
                  />
                ))}

                {mission.status !== 'done' && !isRunning && (
                  <TouchableOpacity
                    style={[styles.runBtn, {backgroundColor: palette.accent}]}
                    onPress={() => runMission(mission)}>
                    <Text style={styles.runBtnText}>
                      {mission.status === 'planning'
                        ? 'Start Mission'
                        : 'Resume'}
                    </Text>
                  </TouchableOpacity>
                )}
                {isRunning && (
                  <View style={styles.runningRow}>
                    <ActivityIndicator size="small" color={palette.accent} />
                    <Text
                      style={[
                        styles.runningText,
                        {color: palette.textSecondary},
                      ]}>
                      Running...
                    </Text>
                  </View>
                )}
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={{color: palette.textTertiary, fontSize: 48}}>
                {'\uD83D\uDE80'}
              </Text>
              <Text style={[styles.emptyText, {color: palette.textSecondary}]}>
                No missions yet
              </Text>
              <Text style={[styles.emptyHint, {color: palette.textTertiary}]}>
                Create a mission to orchestrate multi-step work
              </Text>
            </View>
          }
          contentContainerStyle={
            missions.length === 0 ? styles.emptyList : styles.listContent
          }
        />
      )}

      {!showCreate && (
        <TouchableOpacity
          style={[styles.fab, {backgroundColor: palette.fab}]}
          onPress={() => setShowCreate(true)}
          activeOpacity={0.8}>
          <Text style={[styles.fabText, {color: palette.fabText}]}>+</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1},
  center: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  createPanel: {padding: 16},
  createTitle: {fontSize: 17, fontWeight: '600', marginBottom: 12},
  goalInput: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  computerSelect: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  selectLabel: {fontSize: 14, fontWeight: '500'},
  computerChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
  },
  createButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  planBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  planBtnText: {color: '#fff', fontWeight: '600', fontSize: 15},
  listContent: {padding: 16, paddingBottom: 80},
  emptyList: {flexGrow: 1, justifyContent: 'center', alignItems: 'center'},
  emptyContainer: {alignItems: 'center', paddingHorizontal: 32},
  emptyText: {fontSize: 17, fontWeight: '600', marginTop: 12, marginBottom: 6},
  emptyHint: {fontSize: 14, textAlign: 'center'},
  missionCard: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 16,
    overflow: 'hidden',
  },
  missionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 14,
    paddingBottom: 8,
  },
  missionGoal: {fontSize: 16, fontWeight: '600', flex: 1, marginRight: 8},
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingBottom: 10,
    gap: 8,
  },
  progressBar: {flex: 1, height: 6, borderRadius: 3, overflow: 'hidden'},
  progressFill: {height: '100%', borderRadius: 3},
  progressText: {fontSize: 12, fontWeight: '600', minWidth: 30},
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  featureContent: {flex: 1},
  featureTitle: {fontSize: 14, fontWeight: '500', marginBottom: 2},
  featureDesc: {fontSize: 12},
  chevron: {fontSize: 24, fontWeight: '300'},
  runBtn: {
    margin: 14,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  runBtnText: {color: '#fff', fontWeight: '600', fontSize: 15},
  runningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
  },
  runningText: {fontSize: 14, fontStyle: 'italic'},
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  fabText: {fontSize: 28, fontWeight: '400', marginTop: -2},
});
