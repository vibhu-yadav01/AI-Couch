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
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { Colors } from '../../utils/colors';
import GlassCard from '../../components/GlassCard';
import GradientButton from '../../components/GradientButton';
import { getInterviewHistory } from '../../api/interview.api';
import { HomeStackParamList } from '../../navigation/AppNavigator';

export default function InterviewHistoryScreen() {
  const navigation = useNavigation<NavigationProp<HomeStackParamList>>();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<any[]>([]);

  const fetchHistory = useCallback(async () => {
    try {
      const response = await getInterviewHistory();
      if (response.success && response.data) {
        setHistory(response.data);
      }
    } catch (error) {
      console.error('Error fetching interview history:', error);
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    await fetchHistory();
    setLoading(false);
  }, [fetchHistory]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchHistory();
    setRefreshing(false);
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading interview history...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate('HomeMain')}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerBarTitle}>Interview History</Text>
        <View style={{ width: 40 }} />
      </View>

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
        <Text style={styles.descriptionText}>
          Browse through all your past mock interviews, review feedback, and track your scores over time.
        </Text>

        {history.length === 0 ? (
          <GlassCard style={styles.emptyCard}>
            <Ionicons name="chatbubbles-outline" size={64} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No interview sessions found</Text>
            <Text style={styles.emptySubText}>
              Your completed and in-progress mock interviews will be saved here. Start your first session to begin!
            </Text>
            <GradientButton
              title="Start Practice Session"
              onPress={() => navigation.navigate('InterviewSetup')}
              gradientColors={Colors.gradient.primary}
              style={styles.emptyButton}
            />
          </GlassCard>
        ) : (
          history.map((item: any) => {
            const isCompleted = item.status === 'completed';
            return (
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
                    
                    {isCompleted ? (
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
                    ) : (
                      <View style={styles.inProgressBadge}>
                        <Text style={styles.inProgressText}>In Progress</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.sessionFooter}>
                    <View style={styles.dateContainer}>
                      <Ionicons name="calendar-outline" size={14} color={Colors.textMuted} style={styles.footerIcon} />
                      <Text style={styles.sessionDate}>
                        {new Date(item.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                    
                    <View style={styles.actionLinkRow}>
                      <Text style={styles.actionLinkText}>
                        {isCompleted ? 'View Report' : 'Resume'}
                      </Text>
                      <Ionicons name="chevron-forward" size={14} color={Colors.primary} />
                    </View>
                  </View>
                </GlassCard>
              </TouchableOpacity>
            );
          })
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
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerBarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  descriptionText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 20,
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
  emptyCard: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 15,
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
  },
  emptyButton: {
    width: '100%',
  },
  sessionCard: {
    padding: 15,
    marginBottom: 16,
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
    fontSize: 16,
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
  inProgressBadge: {
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  inProgressText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  sessionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerIcon: {
    marginRight: 5,
  },
  sessionDate: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  actionLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionLinkText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
    marginRight: 4,
  },
});
