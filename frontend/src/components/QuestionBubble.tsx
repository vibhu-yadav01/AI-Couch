import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../utils/colors';

interface QuestionBubbleProps {
  text: string;
  timestamp?: string;
  typewriter?: boolean;
}

export default function QuestionBubble({ text, timestamp }: QuestionBubbleProps) {
  const [displayedText, setDisplayedText] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    setDisplayedText('');
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: Platform.OS !== 'web' }),
    ]).start();

    let index = 0;
    const timer = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1));
        index++;
      } else {
        clearInterval(timer);
      }
    }, 20);

    return () => clearInterval(timer);
  }, [text]);

  return (
    <Animated.View
      style={[
        styles.container,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={styles.avatarContainer}>
        <Ionicons name="hardware-chip" size={20} color={Colors.primary} />
      </View>
      <View style={styles.bubble}>
        <Text style={styles.senderLabel}>AI Coach</Text>
        <Text style={styles.questionText}>{displayedText}</Text>
        {timestamp && <Text style={styles.timestamp}>{timestamp}</Text>}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 8,
    paddingHorizontal: 16,
  },
  avatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 4,
  },
  bubble: {
    flex: 1,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 16,
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
  },
  senderLabel: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  questionText: {
    color: Colors.text,
    fontSize: 15,
    lineHeight: 22,
  },
  timestamp: {
    color: Colors.textMuted,
    fontSize: 10,
    marginTop: 6,
    textAlign: 'right',
  },
});
