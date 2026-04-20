import React from 'react';
import { View, Text, Button } from 'react-native';
import { log } from '@/lib/logger';

type Props = { children: React.ReactNode };

type State = { hasError: boolean; error?: any };

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, info: any) {
    try {
      console.error('[ErrorBoundary] Caught error:', error, info);
      log('error', '[ErrorBoundary] Caught error', { error, info });
    } catch (e) {}
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 }}>
          <Text style={{ fontWeight: '700', marginBottom: 8 }}>Something went wrong.</Text>
          <Text style={{ marginBottom: 12 }}>{String(this.state.error ?? 'Unknown error')}</Text>
          <Button title="Reload" onPress={() => location.reload()} />
        </View>
      );
    }
    return this.props.children as any;
  }
}
