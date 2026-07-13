import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../utils/colors';
import GlassCard from '../../components/GlassCard';
import GradientButton from '../../components/GradientButton';
import { getDashboard } from '../../api/analytics.api';
import { getUserResume } from '../../api/resume.api';
import { HomeStackParamList } from '../../navigation/AppNavigator';

export default function HomeScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<NavigationProp<HomeStackParamList>>();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [hasResume, setHasResume] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      const dashResult = await getDashboard();
      if (dashResult.success) {
        setDashboardData(dashResult.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  }, []);

  const checkResumeStatus = useCallback(async () => {
    try {
      const resumeResult = await getUserResume();
      if (resumeResult.success && resumeResult.data) {
        setHasResume(true);
      } else {
        setHasResume(false);
      }
    } catch (error) {
      setHasResume(false);
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchDashboardData(), checkResumeStatus()]);
    setLoading(false);
  }, [fetchDashboardData, checkResumeStatus]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchDashboardData(), checkResumeStatus()]);
    setRefreshing(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </SafeAreaView>
    );
  }

  const totalInterviews = dashboardData?.totalInterviews || 0;
  const averageScore = dashboardData?.averageScore || 0;
  const recentInterviews = dashboardData?.recentInterviews || [];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {/* Header Greeting */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greetingText}>{getGreeting()},</Text>
            <Text style={styles.userNameText}>{user?.name || 'Coach User'} 👋</Text>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate('ProfileMain' as any)}
          >
            <Ionicons name="person-circle-outline" size={40} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCol}>
            <GlassCard style={styles.statCard}>
              <Ionicons name="checkbox-outline" size={24} color={Colors.accent} style={styles.statIcon} />
              <Text style={styles.statValue}>{totalInterviews}</Text>
              <Text style={styles.statLabel}>Interviews</Text>
            </GlassCard>
          </View>
          <View style={styles.statCol}>
            <GlassCard style={styles.statCard}>
              <Ionicons name="stats-chart" size={24} color={Colors.primary} style={styles.statIcon} />
              <Text style={styles.statValue}>{averageScore}%</Text>
              <Text style={styles.statLabel}>Avg Score</Text>
            </GlassCard>
          </View>
          <View style={styles.statCol}>
            <GlassCard style={styles.statCard}>
              <MaterialCommunityIcons name="fire" size={24} color={Colors.secondary} style={styles.statIcon} />
              <Text style={styles.statValue}>{totalInterviews > 0 ? 1 : 0}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </GlassCard>
          </View>
        </View>

        {/* Call to Action */}
        <GlassCard style={styles.ctaCard}>
          <Text style={styles.ctaTitle}>Ready to Ace Your Interview?</Text>
          <Text style={styles.ctaSubtitle}>
            Practice standard HR, Technical, or Behavioral questions and get instant AI analysis.
          </Text>
          <GradientButton
            title="Start Mock Interview"
            onPress={() => navigation.navigate('InterviewSetup')}
            gradientColors={Colors.gradient.primary}
            style={styles.ctaButton}
          />
        </GlassCard>

        {/* Resume Alert */}
        {!hasResume && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Resume' as any)}
          >
            <GlassCard style={styles.resumeAlertCard}>
              <View style={styles.resumeAlertHeader}>
                <Ionicons name="warning-outline" size={22} color={Colors.warning} />
                <Text style={styles.resumeAlertTitle}>Optimize Your Practice</Text>
              </View>
              <Text style={styles.resumeAlertText}>
                Upload your resume to get mock interviews specifically tailored to your real skills and experience!
              </Text>
              <Text style={styles.resumeAlertLink}>Upload Resume Now &rarr;</Text>
            </GlassCard>
          </TouchableOpacity>
        )}

        {/* Recent Interviews */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Recent Sessions</Text>
          {recentInterviews.length > 0 && (
            <TouchableOpacity onPress={() => navigation.navigate('InterviewHistory' as any)}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          )}
        </View>

        {recentInterviews.length === 0 ? (
          <GlassCard style={styles.emptyCard}>
            <Ionicons name="chatbubbles-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No mock interviews completed yet.</Text>
            <Text style={styles.emptySubText}>Your mock interview evaluations will appear here.</Text>
          </GlassCard>
        ) : (
          recentInterviews.map((item: any) => (
            <TouchableOpacity
              key={item._id}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Results', { interviewId: item._id })}
            >
              <GlassCard style={styles.sessionCard}>
                <View style={styles.sessionMain}>
                  <View style={styles.sessionDetails}>
                    <Text style={styles.sessionRole} numberOfLines={1}>
                      {item.role}
                    </Text>
                    <Text style={styles.sessionType}>
                      {item.type.charAt(0).toUpperCase() + item.type.slice(1)} • {item.difficulty}
                    </Text>
                  </View>
                  <View style={[
                    styles.scoreBadge,
                    {
                      borderColor: item.score >= 80 ? Colors.success : item.score >= 60 ? Colors.warning : Colors.error,
                      backgroundColor: item.score >= 80 ? 'rgba(67,233,123,0.1)' : item.score >= 60 ? 'rgba(247,151,30,0.1)' : 'rgba(255,101,132,0.1)'
                    }
                  ]}>
                    <Text style={[
                      styles.scoreValue,
                      { color: item.score >= 80 ? Colors.success : item.score >= 60 ? Colors.warning : Colors.error }
                    ]}>
                      {item.score}%
                    </Text>
                  </View>
                </View>
                <View style={styles.sessionFooter}>
                  <Text style={styles.sessionDate}>
                    {new Date(item.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
                </View>
              </GlassCard>
            </TouchableOpacity>
          ))
        )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  greetingText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  userNameText: {
    fontSize: 24,
    color: Colors.text,
    fontWeight: '700',
    marginTop: 2,
  },
  profileButton: {
    padding: 4,
  },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: -6,
    marginBottom: 20,
  },
  statCol: {
    flex: 1,
    paddingHorizontal: 6,
  },
  statCard: {
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 8,
  },
  statIcon: {
    marginBottom: 6,
  },
  statValue: {
    fontSize: 18,
    color: Colors.text,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  ctaCard: {
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  ctaTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  ctaSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  ctaButton: {
    width: '100%',
  },
  resumeAlertCard: {
    borderColor: 'rgba(247, 151, 30, 0.4)',
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  resumeAlertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  resumeAlertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.warning,
    marginLeft: 8,
  },
  resumeAlertText: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
    marginBottom: 10,
  },
  resumeAlertLink: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  seeAllText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
  },
  emptyCard: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 12,
  },
  emptySubText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  sessionCard: {
    padding: 15,
    marginBottom: 12,
  },
  sessionMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionDetails: {
    flex: 1,
    paddingRight: 10,
  },
  sessionRole: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  sessionType: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  scoreBadge: {
    borderWidth: 1.5,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 46,
  },
  scoreValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  sessionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  sessionDate: {
    fontSize: 11,
    color: Colors.textMuted,
  },
});
