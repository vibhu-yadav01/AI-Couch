import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Colors } from '../utils/colors';

interface SkillBarProps {
  skillName?: string;
  name?: string;
  score: number; // 0-100
  color?: string;
}

export default function SkillBar({ skillName, name, score, color = Colors.primary }: SkillBarProps) {
  const resolvedName = skillName || name || 'Skill';
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: score,
      duration: 1000,
      delay: 200,
      useNativeDriver: false,
    }).start();
  }, [score]);

  const width = widthAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  const getScoreColor = (s: number) => {
    if (s >= 80) return Colors.success;
    if (s >= 60) return Colors.warning;
    return Colors.error;
  };

  const barColor = color === Colors.primary ? getScoreColor(score) : color;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.skillName}>{resolvedName}</Text>
        <Text style={[styles.scoreValue, { color: barColor }]}>{Math.round(score)}%</Text>
      </View>
      <View style={styles.trackBackground}>
        <Animated.View
          style={[
            styles.fill,
            {
              width,
              backgroundColor: barColor,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  skillName: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  scoreValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  trackBackground: {
    height: 8,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
});
