import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { Colors } from '../../utils/colors';
import GlassCard from '../../components/GlassCard';
import { getDashboard } from '../../api/analytics.api';

const screenWidth = Dimensions.get('window').width;

export default function AnalyticsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  const loadAnalytics = useCallback(async () => {
    try {
      const response = await getDashboard();
      if (response.success) {
        setData(response.data);
      }
    } catch (err) {
      console.error('Fetch dashboard analytics error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading analytics reports...</Text>
      </SafeAreaView>
    );
  }

  const hasData = data && data.totalInterviews > 0;

  // Chart styling config
  const chartConfig = {
    backgroundColor: Colors.surface,
    backgroundGradientFrom: Colors.surface,
    backgroundGradientTo: Colors.surfaceLight,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(108, 99, 255, ${opacity})`,
    labelColor: (opacity = 0.7) => `rgba(240, 240, 255, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: Colors.primary,
    },
  };

  const secondaryChartConfig = {
    ...chartConfig,
    color: (opacity = 1) => `rgba(255, 101, 132, ${opacity})`,
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: Colors.secondary,
    },
  };

  // Compile Chart Datasets
  // If no sessions, use dummy structures for preview but grayed out/labeled
  const scoreHistoryLabels = data?.scoreHistory?.length > 0
    ? data.scoreHistory.map((h: any) => h.date)
    : ['T1', 'T2', 'T3', 'T4', 'T5'];
  const scoreHistoryValues = data?.scoreHistory?.length > 0
    ? data.scoreHistory.map((h: any) => h.score)
    : [65, 70, 72, 78, 85];

  const skillLabels = ['Comm', 'Tech', 'Behav', 'Lead'];
  const skillValues = [
    data?.skillScores?.communication || 0,
    data?.skillScores?.technical || 0,
    data?.skillScores?.behavioral || 0,
    data?.skillScores?.leadership || 0,
  ];

  const fillerWordTrendLabels = data?.fillerWordTrend?.length > 0
    ? data.fillerWordTrend.map((h: any) => h.date)
    : ['T1', 'T2', 'T3', 'T4', 'T5'];
  const fillerWordTrendValues = data?.fillerWordTrend?.length > 0
    ? data.fillerWordTrend.map((h: any) => h.count)
    : [12, 8, 9, 5, 2];

  const confidenceTrendLabels = data?.confidenceTrend?.length > 0
    ? data.confidenceTrend.map((h: any) => h.date)
    : ['T1', 'T2', 'T3', 'T4', 'T5'];
  const confidenceTrendValues = data?.confidenceTrend?.length > 0
    ? data.confidenceTrend.map((h: any) => h.score)
    : [60, 68, 70, 75, 88];

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
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Performance Analytics</Text>
          <Text style={styles.headerSubtitle}>
            Monitor your interview growth metrics, language skills, and technical progress.
          </Text>
        </View>

        {!hasData ? (
          <GlassCard style={styles.emptyCard}>
            <Ionicons name="bar-chart-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No Analytics Yet</Text>
            <Text style={styles.emptyText}>
              Complete at least one mock interview to unlock your performance charts and trend reports.
            </Text>
          </GlassCard>
        ) : (
          <View style={styles.dashboardContainer}>
            {/* Quick Stats Grid */}
            <View style={styles.statsSummaryGrid}>
              <View style={styles.gridItem}>
                <GlassCard style={styles.statMiniCard}>
                  <Text style={styles.miniLabel}>Total Interviews</Text>
                  <Text style={styles.miniVal}>{data.totalInterviews}</Text>
                </GlassCard>
              </View>
              <View style={styles.gridItem}>
                <GlassCard style={styles.statMiniCard}>
                  <Text style={styles.miniLabel}>Overall Avg</Text>
                  <Text style={[styles.miniVal, { color: Colors.primary }]}>{data.averageScore}%</Text>
                </GlassCard>
              </View>
              <View style={styles.gridItem}>
                <GlassCard style={styles.statMiniCard}>
                  <Text style={styles.miniLabel}>Best Technical</Text>
                  <Text style={[styles.miniVal, { color: Colors.accent }]}>
                    {data.skillScores.technical}%
                  </Text>
                </GlassCard>
              </View>
              <View style={styles.gridItem}>
                <GlassCard style={styles.statMiniCard}>
                  <Text style={styles.miniLabel}>Best Comm</Text>
                  <Text style={[styles.miniVal, { color: Colors.accentBlue }]}>
                    {data.skillScores.communication}%
                  </Text>
                </GlassCard>
              </View>
            </View>

            {/* Score History Line Chart */}
            <Text style={styles.chartTitle}>Overall Score Trend</Text>
            <GlassCard style={styles.chartCard}>
              <LineChart
                data={{
                  labels: scoreHistoryLabels,
                  datasets: [{ data: scoreHistoryValues }],
                }}
                width={screenWidth - 56}
                height={200}
                yAxisSuffix="%"
                chartConfig={chartConfig}
                bezier
                style={styles.chartStyle}
              />
            </GlassCard>

            {/* Skills Bar Chart */}
            <Text style={styles.chartTitle}>Skills Breakdown</Text>
            <GlassCard style={styles.chartCard}>
              <BarChart
                data={{
                  labels: skillLabels,
                  datasets: [{ data: skillValues }],
                }}
                width={screenWidth - 56}
                height={200}
                yAxisLabel=""
                yAxisSuffix="%"
                chartConfig={chartConfig}
                style={styles.chartStyle}
              />
            </GlassCard>

            {/* Confidence Trend */}
            <Text style={styles.chartTitle}>Confidence Trend</Text>
            <GlassCard style={styles.chartCard}>
              <LineChart
                data={{
                  labels: confidenceTrendLabels,
                  datasets: [{ data: confidenceTrendValues }],
                }}
                width={screenWidth - 56}
                height={200}
                yAxisSuffix="%"
                chartConfig={secondaryChartConfig}
                bezier
                style={styles.chartStyle}
              />
            </GlassCard>

            {/* Filler Word Trend */}
            <Text style={styles.chartTitle}>Filler Words Trend</Text>
            <GlassCard style={styles.chartCard}>
              <LineChart
                data={{
                  labels: fillerWordTrendLabels,
                  datasets: [{ data: fillerWordTrendValues }],
                }}
                width={screenWidth - 56}
                height={200}
                chartConfig={chartConfig}
                style={styles.chartStyle}
              />
            </GlassCard>
          </View>
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
    marginBottom: 25,
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
  emptyCard: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 15,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  dashboardContainer: {
    marginTop: 5,
  },
  statsSummaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    marginBottom: 15,
  },
  gridItem: {
    width: '50%',
    padding: 6,
  },
  statMiniCard: {
    padding: 15,
    alignItems: 'center',
  },
  miniLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginBottom: 4,
  },
  miniVal: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 20,
    marginBottom: 12,
  },
  chartCard: {
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  chartStyle: {
    borderRadius: 12,
    marginVertical: 4,
  },
});
