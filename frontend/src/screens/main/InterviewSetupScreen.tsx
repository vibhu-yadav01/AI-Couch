import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { Colors } from '../../utils/colors';
import GlassCard from '../../components/GlassCard';
import GradientButton from '../../components/GradientButton';
import { useInterview } from '../../context/InterviewContext';
import { HomeStackParamList } from '../../navigation/AppNavigator';

type InterviewType = 'behavioral' | 'technical' | 'hr' | 'mixed';
type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';
type InterviewMode = 'text' | 'voice';

export default function InterviewSetupScreen() {
  const navigation = useNavigation<NavigationProp<HomeStackParamList>>();
  const { startInterview, isLoading } = useInterview();

  const [role, setRole] = useState('');
  const [type, setType] = useState<InterviewType>('mixed');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('intermediate');
  const [duration, setDuration] = useState<number>(5); // 5 minutes default
  const [mode, setMode] = useState<InterviewMode>('text');

  const presetRoles = [
    'Software Engineer',
    'Data Analyst',
    'Product Manager',
    'UX Designer',
    'Financial Analyst',
  ];

  const handleStart = async () => {
    if (!role.trim()) {
      Alert.alert('Role Required', 'Please enter or select a target job role.');
      return;
    }

    try {
      const interview = await startInterview({
        role: role.trim(),
        type,
        difficulty,
        duration,
      });

      if (interview && interview._id) {
        if (mode === 'voice') {
          navigation.navigate('VoiceInterview', { interviewId: interview._id });
        } else {
          navigation.navigate('TextInterview', { interviewId: interview._id });
        }
      } else {
        Alert.alert('Error', 'Failed to initialize the interview. Please try again.');
      }
    } catch (error: any) {
      console.error('Start interview error:', error);
      Alert.alert('Error', error.message || 'An error occurred. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Interview Setup</Text>
            <Text style={styles.headerSubtitle}>
              Configure your mock interview session. The AI will customize questions based on your selections.
            </Text>
          </View>

          {/* Job Role Input */}
          <Text style={styles.label}>Target Job Role</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. Frontend Developer"
            placeholderTextColor={Colors.textMuted}
            value={role}
            onChangeText={setRole}
          />

          {/* Preset Roles chips */}
          <View style={styles.presetsWrapper}>
            {presetRoles.map((preset) => (
              <TouchableOpacity
                key={preset}
                style={[
                  styles.presetChip,
                  role === preset && styles.presetChipActive,
                ]}
                onPress={() => setRole(preset)}
              >
                <Text
                  style={[
                    styles.presetText,
                    role === preset && styles.presetTextActive,
                  ]}
                >
                  {preset}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Interview Type Selector */}
          <Text style={styles.label}>Interview Type</Text>
          <View style={styles.typeGrid}>
            {[
              { id: 'technical', name: 'Technical', desc: 'Coding, system design, theory', icon: 'code-slash' },
              { id: 'behavioral', name: 'Behavioral', desc: 'STAR format, experiences', icon: 'people-outline' },
              { id: 'hr', name: 'Fit / HR', desc: 'Culture fit, goals, values', icon: 'briefcase-outline' },
              { id: 'mixed', name: 'Mixed Session', desc: 'Combination of all areas', icon: 'shuffle-outline' },
            ].map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.typeCard,
                  type === item.id && styles.typeCardActive,
                ]}
                onPress={() => setType(item.id as InterviewType)}
              >
                <Ionicons
                  name={item.icon as any}
                  size={24}
                  color={type === item.id ? Colors.primary : Colors.textSecondary}
                  style={styles.cardIcon}
                />
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={styles.cardDesc}>{item.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Difficulty Level */}
          <Text style={styles.label}>Difficulty Level</Text>
          <View style={styles.difficultyRow}>
            {[
              { id: 'beginner', name: 'Beginner', color: Colors.success, bg: 'rgba(67,233,123,0.1)' },
              { id: 'intermediate', name: 'Intermediate', color: Colors.warning, bg: 'rgba(247,151,30,0.1)' },
              { id: 'advanced', name: 'Advanced', color: Colors.error, bg: 'rgba(255,101,132,0.1)' },
            ].map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.difficultyCard,
                  difficulty === item.id && {
                    borderColor: item.color,
                    backgroundColor: item.bg,
                  },
                ]}
                onPress={() => setDifficulty(item.id as DifficultyLevel)}
              >
                <Text
                  style={[
                    styles.difficultyText,
                    { color: difficulty === item.id ? item.color : Colors.textSecondary },
                  ]}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Duration Selector */}
          <Text style={styles.label}>Interview Duration</Text>
          <View style={styles.durationRow}>
            {[
              { mins: 3, label: '3 Qs (Quick)' },
              { mins: 5, label: '5 Qs (Standard)' },
              { mins: 10, label: '10 Qs (Deep)' },
            ].map((item) => (
              <TouchableOpacity
                key={item.mins}
                style={[
                  styles.durationCard,
                  duration === item.mins && styles.durationCardActive,
                ]}
                onPress={() => setDuration(item.mins)}
              >
                <Text
                  style={[
                    styles.durationText,
                    duration === item.mins && styles.durationTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Interview Mode Selector */}
          <Text style={styles.label}>Answering Mode</Text>
          <View style={styles.modeRow}>
            <TouchableOpacity
              style={[
                styles.modeCard,
                mode === 'text' && styles.modeCardActive,
              ]}
              onPress={() => setMode('text')}
            >
              <Ionicons
                name="chatbox-ellipses-outline"
                size={22}
                color={mode === 'text' ? Colors.primary : Colors.textSecondary}
              />
              <Text style={[styles.modeText, mode === 'text' && styles.modeTextActive]}>
                Text Answer
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modeCard,
                mode === 'voice' && styles.modeCardActive,
              ]}
              onPress={() => setMode('voice')}
            >
              <Ionicons
                name="mic-outline"
                size={22}
                color={mode === 'voice' ? Colors.primary : Colors.textSecondary}
              />
              <Text style={[styles.modeText, mode === 'voice' && styles.modeTextActive]}>
                Voice Answer
              </Text>
            </TouchableOpacity>
          </View>

          {/* Start CTA */}
          <View style={styles.ctaContainer}>
            <GradientButton
              title="Generate Interview Questions"
              onPress={handleStart}
              loading={isLoading}
              disabled={isLoading}
              gradientColors={Colors.gradient.primary}
              style={styles.startButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  backButton: {
    marginBottom: 15,
    alignSelf: 'flex-start',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 20,
    marginBottom: 10,
  },
  textInput: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    color: Colors.text,
    fontSize: 15,
  },
  presetsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    marginHorizontal: -4,
  },
  presetChip: {
    backgroundColor: Colors.surfaceLight,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
    margin: 4,
  },
  presetChipActive: {
    backgroundColor: 'rgba(108, 99, 255, 0.2)',
    borderColor: Colors.primary,
    borderWidth: 1,
  },
  presetText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  presetTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  typeCard: {
    width: '47%',
    backgroundColor: Colors.surface,
    borderColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    margin: '1.5%',
  },
  typeCardActive: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(108, 99, 255, 0.08)',
  },
  cardIcon: {
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 14,
  },
  difficultyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: -4,
  },
  difficultyCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  difficultyText: {
    fontSize: 13,
    fontWeight: '600',
  },
  durationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: -4,
  },
  durationCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  durationCardActive: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(108, 99, 255, 0.08)',
  },
  durationText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  durationTextActive: {
    color: Colors.primary,
  },
  modeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: -6,
  },
  modeCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    marginHorizontal: 6,
  },
  modeCardActive: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(108, 99, 255, 0.08)',
  },
  modeText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginLeft: 8,
    fontWeight: '600',
  },
  modeTextActive: {
    color: Colors.primary,
  },
  ctaContainer: {
    marginTop: 30,
  },
  startButton: {
    width: '100%',
  },
});
