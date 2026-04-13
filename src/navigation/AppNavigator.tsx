import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import React, {useEffect} from 'react';
import {ActivityIndicator, StyleSheet, Text, View} from 'react-native';
import {useStore} from '../store/useStore';
import {useThemeStore} from '../store/useThemeStore';
import {useSettingsStore} from '../store/useSettingsStore';
import {ApiKeyScreen} from '../screens/ApiKeyScreen';
import {SessionsScreen} from '../screens/SessionsScreen';
import {ChatScreen} from '../screens/ChatScreen';
import {NewSessionScreen} from '../screens/NewSessionScreen';
import {SettingsScreen} from '../screens/SettingsScreen';
import {MissionsScreen} from '../screens/MissionsScreen';

export type RootStackParamList = {
  ApiKey: undefined;
  Main: undefined;
  Chat: {
    sessionId: string;
    title?: string;
    status: 'idle' | 'pending' | 'running';
  };
  NewSession: undefined;
  Settings: undefined;
};

export type TabParamList = {
  Sessions: undefined;
  Missions: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function TabIcon({
  label,
  focused,
  color,
}: {
  label: string;
  focused: boolean;
  color: string;
}) {
  return <Text style={{color, fontSize: focused ? 22 : 20}}>{label}</Text>;
}

function MainTabs() {
  const {palette} = useThemeStore();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: palette.surface,
          borderTopColor: palette.border,
        },
        tabBarActiveTintColor: palette.accent,
        tabBarInactiveTintColor: palette.textTertiary,
        tabBarLabelStyle: {fontSize: 11, fontWeight: '600'},
        headerStyle: {backgroundColor: palette.headerBg},
        headerTintColor: palette.headerText,
        headerTitleStyle: {fontWeight: '700'},
        headerShadowVisible: false,
      }}>
      <Tab.Screen
        name="Sessions"
        component={SessionsScreen}
        options={{
          title: 'Factory',
          tabBarLabel: 'Sessions',
          tabBarIcon: ({focused, color}) => (
            <TabIcon label={'\uD83D\uDCAC'} focused={focused} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Missions"
        component={MissionsScreen}
        options={{
          title: 'Missions',
          tabBarLabel: 'Missions',
          tabBarIcon: ({focused, color}) => (
            <TabIcon label={'\uD83D\uDE80'} focused={focused} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const {apiKey, loadApiKey} = useStore();
  const theme = useThemeStore();
  const settingsStore = useSettingsStore();
  const [ready, setReady] = React.useState(false);

  useEffect(() => {
    Promise.all([loadApiKey(), theme.load(), settingsStore.load()]).finally(
      () => setReady(true),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const navTheme = theme.isDark
    ? {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          background: theme.palette.bg,
          card: theme.palette.headerBg,
          text: theme.palette.headerText,
          border: theme.palette.border,
          primary: theme.palette.accent,
        },
      }
    : {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          background: theme.palette.bg,
          card: theme.palette.headerBg,
          text: theme.palette.headerText,
          border: theme.palette.border,
          primary: theme.palette.accent,
        },
      };

  if (!ready) {
    return (
      <View style={[styles.loading, {backgroundColor: theme.palette.bg}]}>
        <ActivityIndicator size="large" color={theme.palette.accent} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {backgroundColor: theme.palette.headerBg},
          headerTintColor: theme.palette.headerText,
          headerTitleStyle: {fontWeight: '700'},
          headerShadowVisible: false,
          headerBackTitleVisible: false,
        }}>
        {!apiKey ? (
          <Stack.Screen
            name="ApiKey"
            component={ApiKeyScreen}
            options={{headerShown: false}}
          />
        ) : (
          <>
            <Stack.Screen
              name="Main"
              component={MainTabs}
              options={{headerShown: false}}
            />
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen
              name="NewSession"
              component={NewSessionScreen}
              options={{title: 'New Session'}}
            />
            <Stack.Screen
              name="Settings"
              component={SettingsScreen}
              options={{title: 'Settings'}}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
