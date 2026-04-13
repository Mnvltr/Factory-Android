import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import React, {useEffect} from 'react';
import {ActivityIndicator, StyleSheet, View} from 'react-native';
import {useStore} from '../store/useStore';
import {useThemeStore} from '../store/useThemeStore';
import {useSettingsStore} from '../store/useSettingsStore';
import {ApiKeyScreen} from '../screens/ApiKeyScreen';
import {SessionsScreen} from '../screens/SessionsScreen';
import {ChatScreen} from '../screens/ChatScreen';
import {NewSessionScreen} from '../screens/NewSessionScreen';
import {SettingsScreen} from '../screens/SettingsScreen';

export type RootStackParamList = {
  ApiKey: undefined;
  Sessions: undefined;
  Chat: {
    sessionId: string;
    title?: string;
    status: 'idle' | 'pending' | 'running';
  };
  NewSession: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

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
              name="Sessions"
              component={SessionsScreen}
              options={{title: 'Factory'}}
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
