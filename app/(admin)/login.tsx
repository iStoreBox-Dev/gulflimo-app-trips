import React, { useState } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { loginApi, getApiError } from '@/lib/api';
import { saveToken, saveUser } from '@/lib/auth';
import { queryClient } from '@/lib/queryClient';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const loginMutation = useMutation({
    mutationFn: () => loginApi(email.trim(), password),
    onSuccess: async (data) => {
      await saveToken(data.token);
      await saveUser(data.user);
      queryClient.clear();
      router.replace('/(admin)/');
    },
    onError: (err) => {
      setError(getApiError(err) || 'Invalid email or password');
    },
  });

  const handleLogin = () => {
    setError('');
    if (!email.trim() || !password) {
      setError('Please enter email and password');
      return;
    }
    loginMutation.mutate();
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.logo}>GULF LIMO</Text>
        <Text style={styles.subtitle}>Admin Portal</Text>

        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="admin@gulflimo.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Input
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          secureTextEntry
        />

        <Button
          label="Sign In"
          onPress={handleLogin}
          loading={loginMutation.isPending}
          size="lg"
          style={styles.btn}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  content: {
    flex: 1,
    padding: 32,
    justifyContent: 'center',
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  logo: {
    color: '#C9A84C',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 4,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: '#6b6b6b',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 32,
  },
  errorBanner: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderColor: '#EF4444',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
  },
  btn: {
    marginTop: 8,
  },
});
