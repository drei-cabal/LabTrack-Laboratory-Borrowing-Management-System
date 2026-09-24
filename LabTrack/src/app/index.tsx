import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const navy = '#0a244d';

function LabMark() {
  return (
    <View style={styles.mark}>
      <View style={styles.clipboard}>
        <View style={styles.clipboardClip} />
        <View style={styles.clipboardLine} />
        <View style={styles.clipboardLine} />
      </View>
      <View style={styles.checkBadge}>
        <Text style={styles.checkText}>x</Text>
      </View>
    </View>
  );
}

function EyeIcon() {
  return (
    <View style={styles.eye}>
      <View style={styles.eyePupil} />
    </View>
  );
}

export default function HomeScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  function clearMessage() {
    setMessage('');
    setIsError(false);
  }

  function handleLogin() {
    if (!username.trim() || !password) {
      setMessage('Enter your username and password to continue.');
      setIsError(true);
      return;
    }

    setMessage(`Welcome back, ${username.trim()}.`);
    setIsError(false);
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.content}>
          <View style={styles.brandSection}>
            <LabMark />
            <Text style={styles.title}>LabTrack</Text>
            <Text style={styles.subtitle}>UMTC Engineering Laboratory</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Username</Text>
            <View style={styles.input}>
              <TextInput
                accessibilityLabel="Username"
                autoCapitalize="none"
                autoCorrect={false}
                onChangeText={(value) => {
                  setUsername(value);
                  clearMessage();
                }}
                placeholder="Enter your username"
                placeholderTextColor="#9da8b7"
                returnKeyType="next"
                style={styles.textInput}
                value={username}
              />
            </View>

            <Text style={[styles.label, styles.passwordLabel]}>Password</Text>
            <View style={styles.input}>
              <TextInput
                accessibilityLabel="Password"
                autoCapitalize="none"
                autoCorrect={false}
                onChangeText={(value) => {
                  setPassword(value);
                  clearMessage();
                }}
                onSubmitEditing={handleLogin}
                placeholder="Enter your password"
                placeholderTextColor="#9da8b7"
                returnKeyType="go"
                secureTextEntry={!passwordVisible}
                style={styles.textInput}
                value={password}
              />
              <Pressable
                accessibilityLabel={passwordVisible ? 'Hide password' : 'Show password'}
                hitSlop={10}
                onPress={() => setPasswordVisible((visible) => !visible)}>
                <EyeIcon />
              </Pressable>
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={handleLogin}
              style={({ pressed }) => [styles.loginButton, pressed && styles.loginButtonPressed]}>
              <Text style={styles.loginText}>Log In</Text>
            </Pressable>

            <Text style={styles.helpText}>Forgot your login? Contact your Lab Admin.</Text>
            {message ? (
              <Text style={[styles.message, isError ? styles.errorMessage : styles.successMessage]}>
                {message}
              </Text>
            ) : null}
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#ffffff' },
  safeArea: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 41, paddingTop: 75, paddingBottom: 27 },
  brandSection: { alignItems: 'flex-start' },
  mark: {
    width: 53,
    height: 53,
    borderRadius: 6,
    backgroundColor: navy,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 11,
  },
  clipboard: {
    width: 20,
    height: 20,
    borderRadius: 2,
    borderWidth: 1.25,
    borderColor: '#ffffff',
    paddingTop: 5,
    alignItems: 'center',
    gap: 3,
  },
  clipboardClip: {
    position: 'absolute',
    top: -4,
    width: 9,
    height: 5,
    borderWidth: 1.25,
    borderColor: '#ffffff',
    borderRadius: 2,
    backgroundColor: navy,
  },
  clipboardLine: { width: 11, height: 1, backgroundColor: '#ffffff' },
  checkBadge: {
    position: 'absolute',
    right: 13,
    bottom: 14,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: navy,
    borderWidth: 1.25,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: { color: '#ffffff', fontSize: 8, fontWeight: '700', lineHeight: 9 },
  title: { color: navy, fontSize: 21, fontWeight: '700', lineHeight: 25 },
  subtitle: { color: '#59708f', fontSize: 11, lineHeight: 16 },
  form: { marginTop: 28 },
  label: { color: '#0f1725', fontSize: 11, fontWeight: '600', lineHeight: 15, marginBottom: 8 },
  passwordLabel: { marginTop: 14 },
  input: {
    height: 40,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#d9dde4',
    backgroundColor: '#f4f5f7',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  textInput: { flex: 1, color: navy, fontSize: 12, height: '100%', padding: 0 },
  eye: {
    width: 12,
    height: 8,
    borderWidth: 1.25,
    borderColor: '#9da8b7',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyePupil: { width: 3, height: 3, borderRadius: 2, backgroundColor: '#9da8b7' },
  loginButton: {
    height: 38,
    borderRadius: 7,
    backgroundColor: navy,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 27,
  },
  loginButtonPressed: { opacity: 0.82 },
  loginText: { color: '#ffffff', fontSize: 12, fontWeight: '700' },
  helpText: { color: '#5d6f8a', fontSize: 10, lineHeight: 14, marginTop: 14 },
  message: { fontSize: 10, lineHeight: 14, marginTop: 8 },
  errorMessage: { color: '#b42318' },
  successMessage: { color: '#317443' },
  version: { color: '#96a1b5', fontSize: 9, fontFamily: 'monospace', marginTop: 'auto' },
});
