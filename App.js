import "react-native-gesture-handler";
import React from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { AlertProvider } from "./src/components/CustomAlert";
import { Loading } from "./src/components";
import { C } from "./src/theme";

import ClienteLoginScreen from "./src/screens/auth/ClienteLoginScreen";
import AdminLoginScreen from "./src/screens/auth/AdminLoginScreen";
import ClienteHomeScreen from "./src/screens/cliente/HomeScreen";
import AdminHomeScreen from "./src/screens/admin/HomeScreen";
import ClienteDetalheScreen from "./src/screens/admin/ClienteDetalheScreen";

const Stack = createNativeStackNavigator();

function RootNavigator() {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: C.bg },
        animation: "slide_from_right",
      }}
    >
      {!user ? (
        <>
          <Stack.Screen name="Login" component={ClienteLoginScreen} />
          <Stack.Screen name="AdminLogin" component={AdminLoginScreen} />
        </>
      ) : user.tipo === "cliente" ? (
        <Stack.Screen name="ClienteHome" component={ClienteHomeScreen} />
      ) : (
        <>
          <Stack.Screen name="AdminHome" component={AdminHomeScreen} />
          <Stack.Screen
            name="ClienteDetalhe"
            component={ClienteDetalheScreen}
            options={{
              headerShown: true,
              title: "Perfil do Cliente",
              headerStyle: { backgroundColor: C.surface },
              headerTintColor: C.cream,
              headerTitleStyle: { fontWeight: "700" },
              headerBackTitleVisible: false,
            }}
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
        <AlertProvider>
          <NavigationContainer
            theme={{
              dark: true,
              colors: {
                primary: C.gold,
                background: C.bg,
                card: C.surface,
                text: C.cream,
                border: C.border,
                notification: C.gold,
              },
            }}
          >
            <StatusBar style="light" backgroundColor={C.bg} />
            <RootNavigator />
          </NavigationContainer>
        </AlertProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
