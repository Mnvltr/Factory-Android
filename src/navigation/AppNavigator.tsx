import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import React, {useEffect} from 'react';
import {ActivityIndicator, StyleSheet, View} from 'react-native';
import {useStore} from '../store/useStore';
import {ApiKeyScreen} from '../screens/ApiKeyScreen';
import {SessionsScreen} from '../screens/SessionsScreen';
import {ChatScreen} from '../screens/ChatScreen';

export type RootStackParamList = {
  ApiKey: undefined;
  Sessions: undefined;
  Chat: {
    sessionId: string;
    title?: string;
    status: 'idle' | 'pending' | 'running';
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  const {apiKey, loadApiKey} = useStore();
  const [ready, setReady] = React.useState(false);

  useEffect(() => {
    loadApiKey().finally(() => setReady(true));
  }, [loadApiKey]);

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#1565c0" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {backgroundColor: '#1565c0'},
          headerTintColor: '#fff',
          headerTitleStyle: {fontWeight: '700'},
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
              options={{title: 'Factory Sessions'}}
            />
            <Stack.Screen name="Chat" component={ChatScreen} />
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
