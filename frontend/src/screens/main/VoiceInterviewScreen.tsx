import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
  StatusBar,
  ScrollView,
  Platform,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../utils/colors';
import GlassCard from '../../components/GlassCard';
import LoadingOverlay from '../../components/LoadingOverlay';
import { useInterview } from '../../context/InterviewContext';
import { HomeStackParamList } from '../../navigation/AppNavigator';
import { extractErrorMessage } from '../../utils/error';

export default function VoiceInterviewScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const { currentInterview, currentQuestionIndex, submitVoiceAnswer, isComplete, isLoading, resetInterview } = useInterview();

  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [pulseAnim] = useState(new Animated.Value(1));

  const timerRef = useRef<any>(null);

  // Immersive timer countdown
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (currentInterview) {
      setTimeLeft(currentInterview.duration * 60);
    }
    requestAudioPermissions();
    return () => {
      cleanupRecording();
    };
  }, [currentInterview]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  useEffect(() => {
    if (isComplete && currentInterview) {
      navigation.replace('Results', { interviewId: currentInterview._id });
    }
  }, [isComplete, currentInterview]);

  // Handle pulse animation during recording
  useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null;
    if (isRecording) {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 800,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(pulseAnim, {
            toValue: 1.0,
            duration: 800,
            useNativeDriver: Platform.OS !== 'web',
          }),
        ])
      );
      animation.start();
    } else {
      pulseAnim.setValue(1);
    }
    return () => {
      if (animation) animation.stop();
    };
  }, [isRecording]);

  const requestAudioPermissions = async () => {
    try {
      const response = await Audio.requestPermissionsAsync();
      setPermissionGranted(response.status === 'granted');
    } catch (err) {
      console.error('Error requesting audio permissions:', err);
    }
  };

  const cleanupRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (recording) {
      recording.stopAndUnloadAsync().catch(() => {});
    }
  };

  const startRecording = async () => {
    try {
      if (!permissionGranted) {
        Alert.alert('Permission Denied', 'Microphone permissions are required for voice interviews.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setIsRecording(true);
      setRecordTime(0);

      // Start duration counter
      timerRef.current = setInterval(() => {
        setRecordTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Failed to start recording:', err);
      Alert.alert('Error', 'Could not access microphone. Please check settings.');
    }
  };

  const stopRecording = async () => {
    try {
      if (!recording) return;

      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      if (uri) {
        try {
          await submitVoiceAnswer(uri);
        } catch (error: any) {
          const msg = extractErrorMessage(error);
          Alert.alert('Recording Submission Failed', msg);
        }
      }
    } catch (err) {
      console.error('Failed to stop recording:', err);
      Alert.alert('Error', 'An error occurred while saving the recording.');
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const getFormatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (!currentInterview) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading interview session...</Text>
      </SafeAreaView>
    );
  }

  const answeredCount = currentInterview.answers.length;
  const question = currentInterview.questions[answeredCount] || currentInterview.questions[currentQuestionIndex];
  const progressPercent = (answeredCount / currentInterview.questions.length) * 100;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => {
            resetInterview();
            navigation.navigate('HomeMain');
          }}
        >
          <Ionicons name="close" size={24} color={Colors.textSecondary} />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {currentInterview.role}
          </Text>
          <Text style={styles.headerSubtitle}>
            Question {Math.min(answeredCount + 1, currentInterview.questions.length)} of{' '}
            {currentInterview.questions.length}
          </Text>
        </View>

        <View style={styles.timerBadge}>
          <Ionicons name="time-outline" size={16} color={Colors.secondary} />
          <Text style={styles.timerText}>{getFormatTime(timeLeft)}</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Question Panel */}
        <GlassCard style={styles.questionCard}>
          <View style={styles.aiBadge}>
            <Ionicons name="logo-android" size={18} color={Colors.primary} />
            <Text style={styles.aiBadgeText}>AI INTERVIEWER</Text>
          </View>
          <Text style={styles.questionText}>{question?.text}</Text>
        </GlassCard>

        {/* Visualizer Area */}
        <View style={styles.visualizerContainer}>
          {isRecording ? (
            <View style={styles.waveform}>
              {/* Fake animated bars */}
              {[40, 60, 20, 80, 50, 90, 30, 70, 40, 60].map((height, i) => (
                <View
                  key={i}
                  style={[
                    styles.waveBar,
                    {
                      height: height + (Math.sin(recordTime + i) * 15),
                      backgroundColor: Colors.primary,
                    },
                  ]}
                />
              ))}
            </View>
          ) : (
            <Text style={styles.hintText}>
              Tap the microphone to start answering. Press again to submit.
            </Text>
          )}
        </View>

        {/* Recording Controls */}
        <View style={styles.controlsContainer}>
          {isRecording && (
            <Text style={styles.recordingTimerText}>
              Recording: {getFormatTime(recordTime)}
            </Text>
          )}

          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity
              style={[
                styles.micButton,
                isRecording && styles.micButtonRecording,
                isLoading && styles.micButtonDisabled,
              ]}
              onPress={toggleRecording}
              disabled={isLoading}
            >
              <Ionicons
                name={isRecording ? 'stop' : 'mic'}
                size={32}
                color={Colors.white}
              />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>

      {/* Full-screen Loading Overlay for Transcription/AI thinking */}
      {isLoading && answeredCount < currentInterview.questions.length && (
        <LoadingOverlay />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    color: Colors.textSecondary,
    marginTop: 15,
    fontSize: 15,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)',
  },
  closeButton: {
    padding: 4,
  },
  headerTitleContainer: {
    flex: 1,
    paddingHorizontal: 15,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 101, 132, 0.12)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  timerText: {
    color: Colors.secondary,
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  progressBarBg: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.05)',
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 40,
  },
  questionCard: {
    width: '100%',
    padding: 20,
    marginTop: 10,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(108, 99, 255, 0.15)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  aiBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
    marginLeft: 6,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    lineHeight: 25,
  },
  visualizerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 120,
  },
  waveBar: {
    width: 4,
    borderRadius: 2,
    marginHorizontal: 3,
  },
  hintText: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 18,
  },
  controlsContainer: {
    alignItems: 'center',
    width: '100%',
  },
  recordingTimerText: {
    color: Colors.secondary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 15,
  },
  micButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        boxShadow: `0px 4px 10px ${Colors.primary}4d`,
      },
      default: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
      },
    }),
  },
  micButtonRecording: {
    backgroundColor: Colors.error,
    ...Platform.select({
      web: {
        boxShadow: `0px 4px 10px ${Colors.error}4d`,
      },
      default: {
        shadowColor: Colors.error,
      },
    }),
  },
  micButtonDisabled: {
    backgroundColor: Colors.textMuted,
  },
});
