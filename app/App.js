// App.js
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { LoadingScreen } from './src/components';
import { colors } from './src/theme';

// Screens
import LoginScreen        from './src/screens/LoginScreen';
import AdminLoginScreen   from './src/screens/AdminLoginScreen';
import ClienteHomeScreen  from './src/screens/cliente/HomeScreen';
import AdminHomeScreen    from './src/screens/admin/HomeScreen';
import ClienteDetalheScreen from './src/screens/admin/ClienteDetalheScreen';

const Stack = createNativeStackNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: colors.bg, card: colors.surface, text: colors.cream, border: colors.border },
};

function RootNavigator() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        // Auth Stack
        <>
          <Stack.Screen name="Login"       component={LoginScreen} />
          <Stack.Screen name="AdminLogin"  component={AdminLoginScreen} />
        </>
      ) : user.tipo === 'cliente' ? (
        // Cliente Stack
        <Stack.Screen name="ClienteHome" component={ClienteHomeScreen} />
      ) : (
        // Admin Stack
        <>
          <Stack.Screen name="AdminHome"      component={AdminHomeScreen} />
          <Stack.Screen name="ClienteDetalhe" component={ClienteDetalheScreen}
            options={{ headerShown: true, headerStyle: { backgroundColor: colors.surface }, headerTintColor: colors.cream, headerTitle: 'Perfil do Cliente' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer theme={navTheme}>
          <StatusBar style="light" backgroundColor={colors.bg} />
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
