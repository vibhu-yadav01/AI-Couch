import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Alert,
  SafeAreaView,
  StatusBar,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, NavigationProp, RouteProp } from '@react-navigation/native';
import { Colors } from '../../utils/colors';
import GlassCard from '../../components/GlassCard';
import ScoreRing from '../../components/ScoreRing';
import SkillBar from '../../components/SkillBar';
import GradientButton from '../../components/GradientButton';
import { getInterview } from '../../api/interview.api';
import { Interview, Answer } from '../../types';
import { HomeStackParamList } from '../../navigation/AppNavigator';

// Enable layout animations for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function ResultsScreen() {
  const navigation = useNavigation<NavigationProp<HomeStackParamList>>();
  const route = useRoute<RouteProp<HomeStackParamList, 'Results'>>();
  const { interviewId } = route.params;

  const [loading, setLoading] = useState(true);
  const [interview, setInterview] = useState<Interview | null>(null);
  const [expandedAnswers, setExpandedAnswers] = useState<Record<number, boolean>>({ 0: true }); // first expanded by default

  useEffect(() => {
    fetchInterviewDetails();
  }, [interviewId]);

  const fetchInterviewDetails = async () => {
    try {
      setLoading(true);
      const result = await getInterview(interviewId);
      if (result.success && result.data) {
        setInterview(result.data);
      } else {
        Alert.alert('Error', 'Failed to retrieve interview results.');
      }
    } catch (err) {
      console.error('Fetch interview results error:', err);
      Alert.alert('Error', 'Could not load interview results.');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedAnswers((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleShare = async () => {
    if (!interview) return;
    try {
      await Share.share({
        message: `I scored ${interview.score}% on my AI Mock Interview for the ${interview.role} role! Practice interviews and level up with AI Interview Coach.`,
      });
    } catch (error: any) {
      console.error('Share error:', error.message);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Generating your interview report...</Text>
      </SafeAreaView>
    );
  }

  if (!interview) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" />
        <Text style={styles.errorText}>No interview details found.</Text>
        <GradientButton
          title="Return Home"
          onPress={() => (navigation as any).navigate('Home', { screen: 'HomeMain' })}
          gradientColors={Colors.gradient.primary}
          style={styles.errorButton}
        />
      </SafeAreaView>
    );
  }

  // Calculate aggregated averages for skills
  const numAnswers = interview.answers.length;
  const skillAverages = {
    relevance: 0,
    clarity: 0,
    communication: 0,
    technical: 0,
    confidence: 0,
  };

  let totalFillerCount = 0;
  let totalSpeechRate = 0;
  let voiceAnswerCount = 0;
  let totalPauses = 0;

  interview.answers.forEach((ans) => {
    const evalObj = ans.evaluation;
    if (evalObj) {
      skillAverages.relevance += evalObj.relevance || 0;
      skillAverages.clarity += evalObj.clarity || 0;
      skillAverages.communication += evalObj.communication || 0;
      skillAverages.technical += evalObj.technicalAccuracy || 0;
      skillAverages.confidence += evalObj.confidence || 0;
    }

    if (ans.speechAnalysis) {
      totalFillerCount += ans.speechAnalysis.fillerWordCount || 0;
      totalSpeechRate += ans.speechAnalysis.speechRate || 0;
      totalPauses += ans.speechAnalysis.pauseCount || 0;
      voiceAnswerCount++;
    }
  });

  if (numAnswers > 0) {
    skillAverages.relevance = Math.round(skillAverages.relevance / numAnswers);
    skillAverages.clarity = Math.round(skillAverages.clarity / numAnswers);
    skillAverages.communication = Math.round(skillAverages.communication / numAnswers);
    skillAverages.technical = Math.round(skillAverages.technical / numAnswers);
    skillAverages.confidence = Math.round(skillAverages.confidence / numAnswers);
  }

  const avgSpeechRate = voiceAnswerCount > 0 ? Math.round(totalSpeechRate / voiceAnswerCount) : 0;
  const avgConfidenceSpeech = voiceAnswerCount > 0 
    ? Math.round(interview.answers.reduce((acc, curr) => acc + (curr.speechAnalysis?.confidenceScore || 0), 0) / voiceAnswerCount) 
    : 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.congratsText}>Interview Completed!</Text>
          <Text style={styles.roleSubtext}>{interview.role}</Text>
        </View>

        {/* Ring & Breakdown */}
        <View style={styles.scoreOverview}>
          <ScoreRing score={interview.score} label="Overall Score" />
          
          <GlassCard style={styles.breakdownCard}>
            <Text style={styles.breakdownTitle}>Performance Metrics</Text>
            <SkillBar name="Relevance" score={skillAverages.relevance} color={Colors.primary} />
            <SkillBar name="Clarity" score={skillAverages.clarity} color={Colors.secondary} />
            <SkillBar name="Communication" score={skillAverages.communication} color={Colors.accentBlue} />
            <SkillBar name="Technical Accuracy" score={skillAverages.technical} color={Colors.accent} />
            <SkillBar name="Confidence" score={skillAverages.confidence} color={Colors.warning} />
          </GlassCard>
        </View>

        {/* Speech Analysis Metrics (only if voice answers exist) */}
        {voiceAnswerCount > 0 && (
          <GlassCard style={styles.speechMetricsCard}>
            <View style={styles.metricsHeader}>
              <Ionicons name="mic" size={18} color={Colors.primary} />
              <Text style={styles.metricsTitle}>Speech Analysis Overview</Text>
            </View>
            <View style={styles.metricsGrid}>
              <View style={styles.metricItem}>
                <Text style={styles.metricVal}>{avgConfidenceSpeech}%</Text>
                <Text style={styles.metricLabel}>Speech Confidence</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricVal}>{totalFillerCount}</Text>
                <Text style={styles.metricLabel}>Filler Words</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricVal}>{avgSpeechRate}</Text>
                <Text style={styles.metricLabel}>Avg WPM Pace</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricVal}>{totalPauses}</Text>
                <Text style={styles.metricLabel}>Total Pauses</Text>
              </View>
            </View>
          </GlassCard>
        )}

        {/* Q&A Breakdown list */}
        <Text style={styles.qaHeader}>Question Breakdown</Text>
        
        {interview.answers.map((answer, index) => {
          const isExpanded = !!expandedAnswers[index];
          const hasEvaluation = !!answer.evaluation;

          return (
            <GlassCard key={index} style={styles.qaCard}>
              <TouchableOpacity
                style={styles.qaAccordionHeader}
                activeOpacity={0.8}
                onPress={() => toggleExpand(index)}
              >
                <View style={styles.qaQuestionContainer}>
                  <Text style={styles.qaQuestionNum}>Q{index + 1}</Text>
                  <Text style={styles.qaQuestionText} numberOfLines={isExpanded ? undefined : 2}>
                    {answer.questionText}
                  </Text>
                </View>
                <Ionicons
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={Colors.textSecondary}
                  style={styles.qaChevron}
                />
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.qaExpandedContent}>
                  {/* User Answer */}
                  <View style={styles.qaSubSection}>
                    <Text style={styles.qaSubTitle}>Your Answer</Text>
                    <Text style={styles.qaAnswerText}>{answer.answerText || '[No response provided]'}</Text>
                  </View>

                  {/* AI Evaluation */}
                  {hasEvaluation && (
                    <View style={styles.evalContainer}>
                      <View style={styles.evalScoreRow}>
                        <Text style={styles.qaSubTitle}>AI Feedback</Text>
                        <Text style={[
                          styles.questionScore,
                          { color: (answer.evaluation?.score || 0) >= 80 ? Colors.success : (answer.evaluation?.score || 0) >= 60 ? Colors.warning : Colors.error }
                        ]}>
                          Score: {answer.evaluation?.score}%
                        </Text>
                      </View>

                      {/* Strengths */}
                      <Text style={styles.feedbackListTitle}>Key Strengths</Text>
                      {answer.evaluation?.strengths?.map((str, sIndex) => (
                        <View key={sIndex} style={styles.feedbackListItem}>
                          <Ionicons name="checkmark-circle-outline" size={14} color={Colors.success} style={styles.listIcon} />
                          <Text style={styles.feedbackListText}>{str}</Text>
                        </View>
                      ))}

                      {/* Improvements */}
                      <Text style={styles.feedbackListTitle}>Areas for Improvement</Text>
                      {answer.evaluation?.improvements?.map((imp, iIndex) => (
                        <View key={iIndex} style={styles.feedbackListItem}>
                          <Ionicons name="trending-up-outline" size={14} color={Colors.warning} style={styles.listIcon} />
                          <Text style={styles.feedbackListText}>{imp}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Speech details if voice */}
                  {answer.speechAnalysis && (
                    <View style={styles.qaSpeechSubSection}>
                      <Text style={styles.qaSubTitle}>Speech Diagnostics</Text>
                      <Text style={styles.speechDiagnosticText}>
                        Pace: {answer.speechAnalysis.speechRate} WPM • {answer.speechAnalysis.fillerWordCount} filler words detected ({answer.speechAnalysis.fillerWords.slice(0, 4).join(', ') || 'none'}).
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </GlassCard>
          );
        })}

        {/* CTAs */}
        <View style={styles.footerCTAs}>
          <GradientButton
            title="Practice Another Session"
            onPress={() => navigation.navigate('InterviewSetup')}
            gradientColors={Colors.gradient.primary}
            style={styles.ctaButton}
          />
          <View style={styles.secondaryButtonsRow}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => (navigation as any).navigate('Home', { screen: 'HomeMain' })}>
              <Ionicons name="home-outline" size={18} color={Colors.text} />
              <Text style={styles.secondaryBtnText}>Dashboard</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.secondaryBtn} onPress={handleShare}>
              <Ionicons name="share-social-outline" size={18} color={Colors.text} />
              <Text style={styles.secondaryBtnText}>Share Results</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
  errorText: {
    fontSize: 16,
    color: Colors.error,
    fontWeight: '600',
    marginBottom: 20,
  },
  errorButton: {
    width: 200,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 25,
  },
  congratsText: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
  },
  roleSubtext: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
    marginTop: 4,
  },
  scoreOverview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  breakdownCard: {
    flex: 1,
    marginLeft: 15,
    padding: 12,
  },
  breakdownTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  speechMetricsCard: {
    padding: 16,
    marginBottom: 25,
  },
  metricsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    paddingBottom: 6,
  },
  metricsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
    marginLeft: 8,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  metricItem: {
    width: '50%',
    paddingVertical: 8,
  },
  metricVal: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  metricLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  qaHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 15,
  },
  qaCard: {
    marginBottom: 12,
    padding: 15,
  },
  qaAccordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  qaQuestionContainer: {
    flex: 1,
    flexDirection: 'row',
    paddingRight: 10,
  },
  qaQuestionNum: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
    marginRight: 8,
  },
  qaQuestionText: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
    fontWeight: '500',
    lineHeight: 18,
  },
  qaChevron: {
    alignSelf: 'center',
  },
  qaExpandedContent: {
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    paddingTop: 15,
  },
  qaSubSection: {
    marginBottom: 15,
  },
  qaSubTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  qaAnswerText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  evalContainer: {
    marginBottom: 15,
  },
  evalScoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  questionScore: {
    fontSize: 13,
    fontWeight: '700',
  },
  feedbackListTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 8,
    marginBottom: 6,
  },
  feedbackListItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 3,
  },
  listIcon: {
    marginTop: 2,
    marginRight: 6,
  },
  feedbackListText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  qaSpeechSubSection: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 8,
    padding: 10,
    marginTop: 5,
  },
  speechDiagnosticText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  footerCTAs: {
    marginTop: 20,
    width: '100%',
  },
  ctaButton: {
    width: '100%',
    marginBottom: 12,
  },
  secondaryButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  secondaryBtn: {
    flex: 0.48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
  },
  secondaryBtnText: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 8,
  },
});
