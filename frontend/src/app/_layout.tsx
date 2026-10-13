import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { AppColors } from '../constants/colors';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // No local DB init needed — data comes from the REST API server
    SplashScreen.hideAsync()
      .catch(() => {})
      .finally(() => setIsReady(true));
  }, []);

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={AppColors.navy} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#FFFFFF' },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="equipment/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="equipment/add" options={{ headerShown: false }} />
        <Stack.Screen name="equipment/edit/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="borrow/new" options={{ headerShown: false }} />
        <Stack.Screen name="records/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="records/return" options={{ headerShown: false }} />
        <Stack.Screen name="staff/add" options={{ headerShown: false }} />
        <Stack.Screen name="staff/[id]" options={{ headerShown: false }} />
      </Stack>

    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
});
