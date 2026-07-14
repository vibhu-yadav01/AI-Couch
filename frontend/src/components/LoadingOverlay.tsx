import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Modal, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../utils/colors';

interface LoadingOverlayProps {
  visible?: boolean;
  message?: string;
}

export default function LoadingOverlay({ visible = false, message = 'Processing...' }: LoadingOverlayProps) {
  const pulse1 = useRef(new Animated.Value(0.3)).current;
  const pulse2 = useRef(new Animated.Value(0.3)).current;
  const pulse3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const createPulse = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: Platform.OS !== 'web' }),
          Animated.timing(anim, { toValue: 0.3, duration: 800, useNativeDriver: Platform.OS !== 'web' }),
        ])
      );

    const p1 = createPulse(pulse1, 0);
    const p2 = createPulse(pulse2, 250);
    const p3 = createPulse(pulse3, 500);

    p1.start();
    p2.start();
    p3.start();

    return () => {
      p1.stop();
      p2.stop();
      p3.stop();
    };
  }, []);

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.circles}>
            {[pulse1, pulse2, pulse3].map((anim, i) => (
              <Animated.View key={i} style={[styles.circleWrapper, { opacity: anim, transform: [{ scale: anim }] }]}>
                <LinearGradient
                  colors={[Colors.primary, Colors.secondary]}
                  style={[styles.circle, { width: 20 + i * 10, height: 20 + i * 10, borderRadius: 10 + i * 5 }]}
                />
              </Animated.View>
            ))}
          </View>
          <Text style={styles.message}>{message}</Text>
          <Text style={styles.subMessage}>AI is analyzing your response...</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 10, 26, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    alignItems: 'center',
    padding: 40,
  },
  circles: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 32,
  },
  circleWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    ...Platform.select({
      web: {
        boxShadow: `0px 0px 12px ${Colors.primary}cc`,
      },
      default: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 12,
        elevation: 8,
      },
    }),
  },
  message: {
    color: Colors.text,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  subMessage: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
});
