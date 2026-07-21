import React, { Component, ErrorInfo, ReactNode } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Colors } from '../utils/colors';
import GlassCard from './GlassCard';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  fallbackText?: string;
  style?: any;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <GlassCard style={[styles.fallbackCard, this.props.style]}>
          <Text style={styles.fallbackTitle}>
            {this.props.fallbackText || 'Chart unavailable'}
          </Text>
          <Text style={styles.fallbackSub}>
            An error occurred while rendering this component.
          </Text>
        </GlassCard>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  fallbackCard: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
    minHeight: 120,
    width: '100%',
  },
  fallbackTitle: {
    color: Colors.error || '#ff6584',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  fallbackSub: {
    color: Colors.textSecondary || '#aaa',
    fontSize: 12,
    textAlign: 'center',
  },
});
