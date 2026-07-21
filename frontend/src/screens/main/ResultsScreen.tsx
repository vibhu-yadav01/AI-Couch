import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Share,
  Alert,
  SafeAreaView,
  StatusBar,
  LayoutAnimation,
  Platform,
  UIManager,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, NavigationProp, RouteProp } from '@react-navigation/native';
import { Colors } from '../../utils/colors';
import GlassCard from '../../components/GlassCard';
import ScoreRing from '../../components/ScoreRing';
import SkillBar from '../../components/SkillBar';
import ErrorBoundary from '../../components/ErrorBoundary';
import GradientButton from '../../components/GradientButton';
import { getInterview } from '../../api/interview.api';
import { Interview, Answer } from '../../types';
import { HomeStackParamList } from '../../navigation/AppNavigator';

const { width: screenWidth } = Dimensions.get('window');
const isLargeScreen = screenWidth > 768;

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

  // Generate SaaS score status feedback
  const getScoreFeedback = (s: number) => {
    if (s >= 80) return {
      status: 'Excellent placement readiness',
      color: Colors.success,
      badge: 'Tier 1 Certified',
      desc: 'Outstanding performance! Your answers demonstrate clarity, precise technical depth, and strong structure. You are highly ready for live loops.',
    };
    if (s >= 60) return {
      status: 'Good potential - Polishing recommended',
      color: Colors.warning,
      badge: 'Mid-Tier Competent',
      desc: 'Solid logic. You understand core concepts, but using cleaner response frameworks (e.g. STAR) and pacing your speech will optimize your output.',
    };
    return {
      status: 'Refinement recommended',
      color: Colors.error,
      badge: 'Needs Focused Practice',
      desc: 'A great start! We suggest practicing more mock rounds, focusing on structuring your points and filtering out verbal fillers.',
    };
  };

  const scoreFeedback = getScoreFeedback(interview.score);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.responsiveContent}>
          {/* Header */}
          <View style={styles.titleContainer}>
            <View style={styles.topBadge}>
              <Text style={styles.topBadgeText}>📊 ANALYSIS DIAGNOSTIC REPORT</Text>
            </View>
            <Text style={styles.congratsText}>Results Assessment</Text>
            <Text style={styles.roleSubtext}>
              {interview.role} • {numAnswers} Qs Completed
            </Text>
          </View>

          {/* SaaS Score Overview Row / Hero Card */}
          <GlassCard style={styles.heroOverviewCard}>
            <View style={[styles.heroFlexRow, isLargeScreen && styles.heroFlexRowWeb]}>
              <View style={styles.ringWrapper}>
                <ErrorBoundary fallbackText="Score Ring failed to load">
                  <ScoreRing score={interview.score} label="Overall Score" size={130} strokeWidth={11} />
                </ErrorBoundary>
              </View>
              <View style={styles.heroTextSection}>
                <View style={styles.heroBadgeRow}>
                  <View style={[styles.statusIndicator, { backgroundColor: scoreFeedback.color }]} />
                  <Text style={[styles.statusText, { color: scoreFeedback.color }]}>
                    {scoreFeedback.status}
                  </Text>
                </View>
                <Text style={styles.statusBadgeText}>{scoreFeedback.badge}</Text>
                <Text style={styles.statusDescription}>{scoreFeedback.desc}</Text>
              </View>
            </View>
          </GlassCard>

          {/* Performance Breakdown Columns */}
          <View style={styles.sectionDividerRow}>
            <Text style={styles.sectionHeaderTitle}>Granular Competencies</Text>
          </View>

          <GlassCard style={styles.breakdownCard}>
            <ErrorBoundary fallbackText="Breakdown metrics failed to load">
              <SkillBar name="Relevance & Coverage" score={skillAverages.relevance} color={Colors.primary} />
              <SkillBar name="Structure & Clarity" score={skillAverages.clarity} color={Colors.secondary} />
              <SkillBar name="Vocal Delivery" score={skillAverages.communication} color={Colors.accentBlue} />
              <SkillBar name="Technical Accuracy" score={skillAverages.technical} color={Colors.accent} />
              <SkillBar name="Confidence & Calmness" score={skillAverages.confidence} color={Colors.warning} />
            </ErrorBoundary>
          </GlassCard>

          {/* Speech Analysis Overview Widgets */}
          {voiceAnswerCount > 0 && (
            <>
              <View style={styles.sectionDividerRow}>
                <Text style={styles.sectionHeaderTitle}>Vocal Delivery Diagnostics</Text>
              </View>

              <View style={styles.widgetsGrid}>
                <GlassCard style={styles.widgetItem}>
                  <Ionicons name="volume-high-outline" size={20} color={Colors.accentBlue} style={styles.widgetIcon} />
                  <Text style={styles.widgetVal}>{avgConfidenceSpeech}%</Text>
                  <Text style={styles.widgetLabel}>Speech Clarity</Text>
                </GlassCard>

                <GlassCard style={styles.widgetItem}>
                  <Ionicons name="alert-circle-outline" size={20} color={Colors.secondary} style={styles.widgetIcon} />
                  <Text style={styles.widgetVal}>{totalFillerCount}</Text>
                  <Text style={styles.widgetLabel}>Filler Words Count</Text>
                </GlassCard>

                <GlassCard style={styles.widgetItem}>
                  <Ionicons name="speedometer-outline" size={20} color={Colors.primary} style={styles.widgetIcon} />
                  <Text style={styles.widgetVal}>{avgSpeechRate} <Text style={styles.widgetValSub}>WPM</Text></Text>
                  <Text style={styles.widgetLabel}>Speaking Speed</Text>
                </GlassCard>

                <GlassCard style={styles.widgetItem}>
                  <Ionicons name="hourglass-outline" size={20} color={Colors.warning} style={styles.widgetIcon} />
                  <Text style={styles.widgetVal}>{totalPauses}</Text>
                  <Text style={styles.widgetLabel}>Silent Pauses</Text>
                </GlassCard>
              </View>
            </>
          )}

          {/* Q&A Breakdown list */}
          <View style={styles.sectionDividerRow}>
            <Text style={styles.sectionHeaderTitle}>Question-by-Question Breakdown</Text>
          </View>

          {interview.answers.map((answer, index) => {
            const isExpanded = !!expandedAnswers[index];
            const hasEvaluation = !!answer.evaluation;
            const itemScore = answer.evaluation?.score || 0;

            // Score Badge style details
            const getItemScoreDetails = (s: number) => {
              if (s >= 80) return { label: 'Pass', color: Colors.success };
              if (s >= 60) return { label: 'Review', color: Colors.warning };
              return { label: 'Critical', color: Colors.error };
            };
            const scoreDetails = getItemScoreDetails(itemScore);

            return (
              <GlassCard key={index} style={[styles.qaCard, isExpanded && styles.qaCardExpanded]}>
                <Pressable
                  style={({ pressed }) => [
                    styles.qaAccordionHeader,
                    { opacity: pressed ? 0.8 : 1.0 }
                  ]}
                  onPress={() => toggleExpand(index)}
                >
                  <View style={styles.qaQuestionContainer}>
                    <View style={styles.numberIndexContainer}>
                      <Text style={styles.qaQuestionNum}>Q{index + 1}</Text>
                    </View>
                    <Text style={styles.qaQuestionText} numberOfLines={isExpanded ? undefined : 2}>
                      {answer.questionText}
                    </Text>
                  </View>

                  <View style={styles.headerRightInfo}>
                    <View style={[styles.itemScoreBadge, { backgroundColor: `${scoreDetails.color}15`, borderColor: `${scoreDetails.color}35` }]}>
                      <Text style={[styles.itemScoreText, { color: scoreDetails.color }]}>
                        {itemScore}% {scoreDetails.label}
                      </Text>
                    </View>
                    <Ionicons
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color={Colors.textSecondary}
                      style={styles.qaChevron}
                    />
                  </View>
                </Pressable>

                {isExpanded && (
                  <View style={styles.qaExpandedContent}>
                    {/* User Answer Cite Block */}
                    <View style={styles.qaSubSection}>
                      <Text style={styles.qaSubTitle}>Candidate Response</Text>
                      <View style={styles.citeBorderBlock}>
                        <Text style={styles.qaAnswerText}>
                          {answer.answerText ? `"${answer.answerText}"` : '[No response recorded]'}
                        </Text>
                      </View>
                    </View>

                    {/* AI Evaluation Strengths/Weaknesses Split */}
                    {hasEvaluation && (
                      <View style={styles.evalContainer}>
                        <View style={[styles.feedbackSplitGrid, isLargeScreen && styles.feedbackSplitGridWeb]}>
                          
                          {/* Strengths */}
                          <View style={styles.feedbackColumn}>
                            <Text style={styles.feedbackListTitle}>
                              <Ionicons name="checkmark-circle-outline" size={14} color={Colors.success} /> Key Strengths
                            </Text>
                            {answer.evaluation?.strengths?.map((str, sIndex) => (
                              <View key={sIndex} style={styles.feedbackListItem}>
                                <View style={[styles.dotPointIcon, { backgroundColor: `${Colors.success}18` }]}>
                                  <Ionicons name="checkmark" size={11} color={Colors.success} />
                                </View>
                                <Text style={styles.feedbackListText}>{str}</Text>
                              </View>
                            ))}
                            {(!answer.evaluation?.strengths || answer.evaluation.strengths.length === 0) && (
                              <Text style={styles.noFeedbackText}>No specific strengths documented</Text>
                            )}
                          </View>

                          {/* Improvements */}
                          <View style={styles.feedbackColumn}>
                            <Text style={styles.feedbackListTitle}>
                              <Ionicons name="trending-up-outline" size={14} color={Colors.warning} /> Improvement Plan
                            </Text>
                            {answer.evaluation?.improvements?.map((imp, iIndex) => (
                              <View key={iIndex} style={styles.feedbackListItem}>
                                <View style={[styles.dotPointIcon, { backgroundColor: `${Colors.warning}18` }]}>
                                  <Ionicons name="arrow-up" size={11} color={Colors.warning} />
                                </View>
                                <Text style={styles.feedbackListText}>{imp}</Text>
                              </View>
                            ))}
                            {(!answer.evaluation?.improvements || answer.evaluation.improvements.length === 0) && (
                              <Text style={styles.noFeedbackText}>No specific improvements suggested</Text>
                            )}
                          </View>

                        </View>
                      </View>
                    )}

                    {/* Speech Diagnostics Details */}
                    {answer.speechAnalysis && (
                      <View style={styles.qaSpeechSubSection}>
                        <Ionicons name="mic-outline" size={14} color={Colors.accentBlue} />
                        <Text style={styles.speechDiagnosticText}>
                          Delivery Pace: <Text style={styles.boldText}>{answer.speechAnalysis.speechRate} WPM</Text> • Detected <Text style={styles.boldText}>{answer.speechAnalysis.fillerWordCount}</Text> verbal fillers ({answer.speechAnalysis.fillerWords.slice(0, 4).join(', ') || 'none'}).
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </GlassCard>
            );
          })}

          {/* Footer CTAs */}
          <View style={styles.footerCTAs}>
            <GradientButton
              title="Practice Another Mock Session"
              onPress={() => navigation.navigate('InterviewSetup')}
              gradientColors={Colors.gradient.primary}
              style={styles.ctaButton}
            />
            <View style={styles.secondaryButtonsRow}>
              <Pressable
                style={({ pressed }) => [
                  styles.secondaryBtn,
                  { opacity: pressed ? 0.75 : 1.0 }
                ]}
                onPress={() => (navigation as any).navigate('Home', { screen: 'HomeMain' })}
              >
                <Ionicons name="grid-outline" size={16} color={Colors.text} />
                <Text style={styles.secondaryBtnText}>Dashboard</Text>
              </Pressable>
              
              <Pressable
                style={({ pressed }) => [
                  styles.secondaryBtn,
                  { opacity: pressed ? 0.75 : 1.0 }
                ]}
                onPress={handleShare}
              >
                <Ionicons name="share-social-outline" size={16} color={Colors.text} />
                <Text style={styles.secondaryBtnText}>Share Report</Text>
              </Pressable>
            </View>
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
    paddingBottom: 60,
  },
  responsiveContent: {
    width: '100%',
    maxWidth: 800,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
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
  topBadge: {
    backgroundColor: 'rgba(108, 99, 255, 0.12)',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.25)',
    marginBottom: 12,
  },
  topBadgeText: {
    color: Colors.primary,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  congratsText: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  roleSubtext: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginTop: 4,
  },
  heroOverviewCard: {
    padding: 20,
    marginBottom: 24,
    backgroundColor: 'rgba(30, 30, 64, 0.5)',
  },
  heroFlexRow: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 20,
  },
  heroFlexRowWeb: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ringWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTextSection: {
    flex: 1,
    alignItems: 'center',
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusBadgeText: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 10,
    textAlign: 'center',
  },
  statusDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
    textAlign: 'center',
  },
  sectionDividerRow: {
    marginBottom: 12,
    marginTop: 12,
    borderBottomWidth: 1,
    borderColor: 'rgba(240, 240, 255, 0.05)',
    paddingBottom: 6,
  },
  sectionHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.2,
  },
  breakdownCard: {
    padding: 16,
    marginBottom: 20,
    backgroundColor: Colors.cardGlass,
  },
  widgetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  widgetItem: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    backgroundColor: Colors.cardGlass,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  widgetIcon: {
    marginBottom: 8,
  },
  widgetVal: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 4,
  },
  widgetValSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  widgetLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
  },
  qaCard: {
    marginBottom: 14,
    padding: 16,
    borderColor: Colors.border,
    backgroundColor: Colors.cardGlass,
  },
  qaCardExpanded: {
    borderColor: 'rgba(108, 99, 255, 0.45)',
  },
  qaAccordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  qaQuestionContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  numberIndexContainer: {
    backgroundColor: 'rgba(108, 99, 255, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 10,
  },
  qaQuestionNum: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primary,
  },
  qaQuestionText: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
    fontWeight: '700',
    lineHeight: 18,
  },
  headerRightInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemScoreBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  itemScoreText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  qaChevron: {
    alignSelf: 'center',
  },
  qaExpandedContent: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    paddingTop: 16,
  },
  qaSubSection: {
    marginBottom: 16,
  },
  qaSubTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  citeBorderBlock: {
    borderLeftWidth: 3,
    borderColor: Colors.primary,
    paddingLeft: 12,
    backgroundColor: 'rgba(108, 99, 255, 0.03)',
    paddingVertical: 10,
    borderRadius: 4,
  },
  qaAnswerText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  evalContainer: {
    marginBottom: 16,
  },
  feedbackSplitGrid: {
    flexDirection: 'column',
    gap: 16,
  },
  feedbackSplitGridWeb: {
    flexDirection: 'row',
  },
  feedbackColumn: {
    flex: 1,
  },
  feedbackListTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  feedbackListItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  dotPointIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 2,
  },
  feedbackListText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  noFeedbackText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontStyle: 'italic',
    paddingVertical: 4,
  },
  qaSpeechSubSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 249, 215, 0.05)',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 8,
    marginTop: 4,
  },
  speechDiagnosticText: {
    flex: 1,
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  boldText: {
    fontWeight: '700',
    color: Colors.text,
  },
  footerCTAs: {
    marginTop: 20,
    width: '100%',
  },
  ctaButton: {
    width: '100%',
    marginBottom: 14,
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
    borderRadius: 12,
    paddingVertical: 14,
  },
  secondaryBtnText: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 8,
  },
});
