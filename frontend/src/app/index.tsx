import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ROUTES } from '../routing/routes';

import { authService } from '../services/authService';

const navy = '#0A234A';

function LabMark() {
  return (
    <View style={styles.mark}>
      {/* Clipboard Icon Body */}
      <View style={styles.clipboard}>
        <View style={styles.clipboardClip} />
        <View style={styles.clipboardLine} />
        <View style={styles.clipboardLine} />
      </View>
      {/* Check/Close Badge */}
      <View style={styles.checkBadge}>
        <Ionicons name="close" size={8} color="#FFFFFF" />
      </View>
    </View>
  );
}

export default function LoginScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('admin.cruz');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('Incorrect username or password.');
  const [loggingIn, setLoggingIn] = useState(false);

  const handleLogin = async () => {
    try {
      setLoggingIn(true);
      setHasError(false);

      const res = await authService.login({ username, password });

      if (!res.success) {
        setHasError(true);
        setErrorMessage(res.error || 'Incorrect username or password.');
        return;
      }

      router.replace(ROUTES.HOME as any);
    } finally {
      setLoggingIn(false);
    }

  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Brand section */}
          <View style={styles.brandSection}>
            <LabMark />
            <Text style={styles.brandTitle}>LabTrack</Text>
            <Text style={styles.brandSubtitle}>UMTC Engineering Laboratory</Text>
          </View>

          {/* Form section */}
          <View style={styles.form}>
            <Text style={styles.label}>Username</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                accessibilityLabel="Username"
                autoCapitalize="none"
                autoCorrect={false}
                value={username}
                onChangeText={(val) => {
                  setUsername(val);
                  if (hasError) setHasError(false);
                }}
                placeholder="admin.cruz"
                placeholderTextColor="#9DA8B7"
                returnKeyType="next"
                style={styles.textInput}
              />
            </View>

            <Text style={[styles.label, styles.passwordLabel]}>Password</Text>
            <View
              style={[
                styles.inputWrapper,
                hasError ? styles.inputWrapperError : null,
              ]}
            >
              <TextInput
                accessibilityLabel="Password"
                autoCapitalize="none"
                autoCorrect={false}
                value={password}
                onChangeText={(val) => {
                  setPassword(val);
                  if (hasError) setHasError(false);
                }}
                onSubmitEditing={handleLogin}
                placeholder="••••••••"
                placeholderTextColor="#9DA8B7"
                returnKeyType="go"
                secureTextEntry={!passwordVisible}
                style={styles.textInput}
              />
              <Pressable
                accessibilityLabel={passwordVisible ? 'Hide password' : 'Show password'}
                hitSlop={10}
                onPress={() => setPasswordVisible((v) => !v)}
              >
                <Ionicons
                  name={passwordVisible ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color="#9DA8B7"
                />
              </Pressable>
            </View>

            {hasError ? (
              <Text style={styles.errorText}>{errorMessage}</Text>
            ) : null}

            <Pressable
              accessibilityRole="button"
              onPress={handleLogin}
              disabled={loggingIn}
              style={({ pressed }) => [
                styles.loginButton,
                (pressed || loggingIn) && styles.loginButtonPressed,
              ]}
            >
              <Text style={styles.loginText}>{loggingIn ? 'Signing in…' : 'Log In'}</Text>
            </Pressable>

            <Text style={styles.helpText}>Forgot your login? Contact your Lab Admin.</Text>
          </View>

          {/* Offline version label */}
          <View style={styles.footer}>
            <Text style={styles.versionText}>v1.0.0 · Offline</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 36,
    paddingTop: 60,
    paddingBottom: 24,
  },
  brandSection: {
    alignItems: 'flex-start',
    marginBottom: 32,
  },
  mark: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: navy,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  clipboard: {
    width: 22,
    height: 22,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    paddingTop: 6,
    alignItems: 'center',
    gap: 3,
  },
  clipboardClip: {
    position: 'absolute',
    top: -5,
    width: 10,
    height: 5,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    borderRadius: 2,
    backgroundColor: navy,
  },
  clipboardLine: {
    width: 12,
    height: 1.25,
    backgroundColor: '#FFFFFF',
  },
  checkBadge: {
    position: 'absolute',
    right: 11,
    bottom: 11,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: navy,
    borderWidth: 1.25,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    color: navy,
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 28,
  },
  brandSubtitle: {
    color: '#59708F',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 2,
  },
  form: {
    width: '100%',
  },
  label: {
    color: '#0F1725',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  passwordLabel: {
    marginTop: 18,
  },
  inputWrapper: {
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D9DDE4',
    backgroundColor: '#F4F5F7',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputWrapperError: {
    borderColor: '#EF4444',
  },
  textInput: {
    flex: 1,
    color: navy,
    fontSize: 13,
    height: '100%',
    padding: 0,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 11,
    marginTop: 6,
  },
  loginButton: {
    height: 44,
    borderRadius: 8,
    backgroundColor: navy,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  loginButtonPressed: {
    opacity: 0.85,
  },
  loginText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  helpText: {
    color: '#5D6F8A',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 16,
  },
  footer: {
    marginTop: 'auto',
    alignItems: 'center',
    paddingTop: 36,
  },
  versionText: {
    color: '#96A1B5',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});
