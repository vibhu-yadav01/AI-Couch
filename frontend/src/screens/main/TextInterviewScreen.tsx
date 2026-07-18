import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../utils/colors';
import GlassCard from '../../components/GlassCard';
import QuestionBubble from '../../components/QuestionBubble';
import LoadingOverlay from '../../components/LoadingOverlay';
import { useInterview } from '../../context/InterviewContext';
import { HomeStackParamList } from '../../navigation/AppNavigator';
import { extractErrorMessage } from '../../utils/error';

export default function TextInterviewScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const route = useRoute<RouteProp<HomeStackParamList, 'TextInterview'>>();
  const { currentInterview, currentQuestionIndex, submitAnswer, isComplete, isLoading, resetInterview } = useInterview();
  const [inputText, setInputText] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);

  // Time remaining tracking
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (currentInterview) {
      setTimeLeft(currentInterview.duration * 60);
    }
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

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;
    const textToSend = inputText.trim();
    setInputText('');
    try {
      await submitAnswer(textToSend);
    } catch (error: any) {
      const msg = extractErrorMessage(error);
      console.error('[TextInterviewScreen.handleSend Error]', {
        name: error?.name || 'Error',
        status: error?.status || error?.response?.status || 'unknown',
        backendMessage: error?.response?.data?.error || error?.message || 'none',
        genericMessage: msg,
      });
      Alert.alert('Submission Error', msg);
      setInputText(textToSend); // restore user's input
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

  // Get chat messages list
  const messages: any[] = [];
  const answeredCount = currentInterview.answers.length;

  for (let i = 0; i < currentInterview.questions.length; i++) {
    // Show AI question if it is the first or if the user answered the previous ones
    if (i <= answeredCount) {
      messages.push({
        id: `q_${i}`,
        text: currentInterview.questions[i].text,
        sender: 'ai',
        typewriter: i === currentQuestionIndex && answeredCount === i, // typewriter effect only on current unanswered question
      });
    }
    // Show user answer if it exists
    if (i < answeredCount) {
      messages.push({
        id: `a_${i}`,
        text: currentInterview.answers[i].answerText,
        sender: 'user',
      });
    }
  }

  const progressPercent = (answeredCount / currentInterview.questions.length) * 100;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Immersive Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.closeButton} 
          onPress={() => {
            resetInterview();
            (navigation as any).navigate('Home', { screen: 'HomeMain' });
          }}
        >
          <Ionicons name="close" size={24} color={Colors.textSecondary} />
        </TouchableOpacity>
        
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>{currentInterview.role}</Text>
          <Text style={styles.headerSubtitle}>
            Question {Math.min(currentQuestionIndex + 1, currentInterview.questions.length)} of {currentInterview.questions.length}
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

      {/* Message Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.messageScrollContent}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((msg) => (
            <View
              key={msg.id}
              style={[
                styles.bubbleRow,
                msg.sender === 'user' ? styles.bubbleRowUser : styles.bubbleRowAi,
              ]}
            >
              {msg.sender === 'ai' ? (
                <QuestionBubble 
                  text={msg.text} 
                  typewriter={msg.typewriter} 
                />
              ) : (
                <GlassCard style={styles.userBubble}>
                  <Text style={styles.userBubbleText}>{msg.text}</Text>
                </GlassCard>
              )}
            </View>
          ))}
        </ScrollView>

        {/* Input Bar */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Type your response here..."
            placeholderTextColor={Colors.textMuted}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={1000}
            editable={!isLoading}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || isLoading) && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!inputText.trim() || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Ionicons name="send" size={18} color={Colors.white} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Full-screen Loading Overlay for AI thinking */}
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
  messageScrollContent: {
    padding: 20,
    paddingBottom: 30,
  },
  bubbleRow: {
    flexDirection: 'row',
    marginBottom: 20,
    width: '100%',
    flexShrink: 1,
  },
  bubbleRowAi: {
    justifyContent: 'flex-start',
  },
  bubbleRowUser: {
    justifyContent: 'flex-end',
  },
  userBubble: {
    backgroundColor: Colors.primary,
    borderColor: 'transparent',
    maxWidth: '80%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderBottomRightRadius: 4,
  },
  userBubbleText: {
    color: Colors.white,
    fontSize: 14,
    lineHeight: 20,
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    backgroundColor: Colors.surface,
  },
  textInput: {
    flex: 1,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    color: Colors.text,
    fontSize: 14,
    maxHeight: 100,
    marginRight: 10,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: Colors.textMuted,
  },
});
