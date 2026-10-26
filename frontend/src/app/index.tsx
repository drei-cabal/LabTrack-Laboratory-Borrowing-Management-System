import { screenStyles } from '../components/ui/ScreenStyles';
import { AppTypography } from '../constants/typography';
import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
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
import { Button } from '../components/ui/Button';
import { AppColors } from '../constants/colors';
import { ROUTES } from '../routing/routes';

import { authService } from '../services/authService';
import '../login-focus.css';

const navy = AppColors.navy;

export default function LoginScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('admin.cruz');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('Incorrect username or password.');
  const [loggingIn, setLoggingIn] = useState(false);

  // Auto-redirect to home if already authenticated
  React.useEffect(() => {
    authService.getCurrentUser().then((user) => {
      if (user) router.replace(ROUTES.HOME as any);
    });
  }, []);

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
    } catch (error: unknown) {
      setHasError(true);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to sign in. Please check the backend connection and try again.'
      );
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
            <Image
              source={require('../../assets/branding/labtrack-logo.png')}
              style={styles.brandLogo}
              resizeMode="contain"
              accessibilityLabel="LabTrack logo"
            />
            <Text style={styles.brandSubtitle}>UMTC Engineering Laboratory</Text>
          </View>

          {/* Form section */}
          <View style={styles.form}>
            <Text style={styles.label}>Username</Text>
            <View id="labtrack-login-username" style={styles.inputWrapper}>
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
              id="labtrack-login-password"
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

            <Button
              title={loggingIn ? 'Signing in…' : 'Log In'}
              onPress={handleLogin}
              disabled={loggingIn}
              style={styles.loginButton}
            />

            <Text style={styles.helpText}>Forgot your login? Contact your Lab Admin.</Text>
          </View>

          {/* Offline version label */}
          <View style={styles.footer}>
            <Text style={styles.versionText}>v1.0.0 · UMTC Engineering Lab</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    ...screenStyles.screen,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 36,
    paddingTop: Platform.OS === 'web' ? 24 : 36,
    paddingBottom: 24,
  },
  brandSection: {
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  brandLogo: {
    width: 100,
    height: 100,
  },
  brandSubtitle: {
    color: '#59708F',
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.small,
    lineHeight: AppTypography.lineHeight.supporting,
    marginTop: 2,
  },
  form: {
    width: '100%',
  },
  label: {
    color: '#0F1725',
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.small,
    fontWeight: AppTypography.weight.semibold,
    marginBottom: 8,
  },
  passwordLabel: {
    marginTop: 18,
  },
  inputWrapper: {
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AppColors.border,
    backgroundColor: AppColors.white,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputWrapperError: {
    borderColor: AppColors.red,
  },
  textInput: {
    flex: 1,
    color: navy,
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.supporting,
    height: '100%',
    padding: 0,
  },
  errorText: {
    color: AppColors.red,
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.chip,
    marginTop: 6,
  },
  loginButton: { marginTop: 24 },
  helpText: {
    color: '#5D6F8A',
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.chip,
    lineHeight: AppTypography.lineHeight.small,
    marginTop: 16,
  },
  footer: {
    marginTop: 'auto',
    alignItems: 'center',
    paddingTop: 36,
  },
  versionText: {
    color: '#96A1B5',
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.chip,

  },
});
