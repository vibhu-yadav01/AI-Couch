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
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../utils/colors';
import GlassCard from '../../components/GlassCard';
import ErrorBoundary from '../../components/ErrorBoundary';
import CustomSVGChart from '../../components/CustomSVGChart';
import { getDashboard } from '../../api/analytics.api';

// Dynamically import react-native-chart-kit to prevent Web load crashes
let LineChart: any = null;
let BarChart: any = null;
if (Platform.OS !== 'web') {
  try {
    const chartKit = require('react-native-chart-kit');
    LineChart = chartKit.LineChart;
    BarChart = chartKit.BarChart;
  } catch (err) {
    console.warn('Failed to load react-native-chart-kit dynamically:', err);
  }
}

const screenWidth = Dimensions.get('window').width;

// Helper to filter out null, undefined, NaN values, keep identical length, and pad single items
function sanitizeChartData(labels: any[], values: any[]) {
  const sanitizedLabels: string[] = [];
  const sanitizedValues: number[] = [];

  const len = Math.min(labels?.length || 0, values?.length || 0);
  for (let i = 0; i < len; i++) {
    const val = values[i];
    const lbl = labels[i];
    
    // Check if value is a valid number
    if (val !== null && val !== undefined && !isNaN(Number(val))) {
      sanitizedLabels.push(String(lbl || ''));
      sanitizedValues.push(Number(val));
    }
  }

  if (sanitizedValues.length === 0) {
    return null;
  }

  // Safety padding for single data points to avoid division-by-zero crashes
  if (sanitizedValues.length === 1) {
    return {
      labels: ['', sanitizedLabels[0] || ''],
      values: [sanitizedValues[0], sanitizedValues[0]],
    };
  }

  return {
    labels: sanitizedLabels,
    values: sanitizedValues,
  };
}

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

  // Compile and Sanitize Chart Datasets (no dummy fallbacks)
  const scoreHistoryLabels = data?.scoreHistory?.map((h: any) => h.date) || [];
  const scoreHistoryValues = data?.scoreHistory?.map((h: any) => h.score) || [];
  const sanitizedScore = sanitizeChartData(scoreHistoryLabels, scoreHistoryValues);

  const skillLabels = ['Comm', 'Tech', 'Behav', 'Lead'];
  const skillValues = [
    data?.skillScores?.communication || 0,
    data?.skillScores?.technical || 0,
    data?.skillScores?.behavioral || 0,
    data?.skillScores?.leadership || 0,
  ];
  const sanitizedSkills = sanitizeChartData(skillLabels, skillValues);

  const fillerWordTrendLabels = data?.fillerWordTrend?.map((h: any) => h.date) || [];
  const fillerWordTrendValues = data?.fillerWordTrend?.map((h: any) => h.count) || [];
  const sanitizedFiller = sanitizeChartData(fillerWordTrendLabels, fillerWordTrendValues);

  const confidenceTrendLabels = data?.confidenceTrend?.map((h: any) => h.date) || [];
  const confidenceTrendValues = data?.confidenceTrend?.map((h: any) => h.score) || [];
  const sanitizedConfidence = sanitizeChartData(confidenceTrendLabels, confidenceTrendValues);

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
            <ErrorBoundary fallbackText="Overall Score Trend chart unavailable">
              <GlassCard style={styles.chartCard}>
                {sanitizedScore ? (
                  Platform.OS === 'web' || !LineChart ? (
                    <CustomSVGChart
                      type="line"
                      data={{
                        labels: sanitizedScore.labels,
                        datasets: [{ data: sanitizedScore.values }],
                      }}
                      width={screenWidth - 56}
                      height={200}
                      yAxisSuffix="%"
                      chartConfig={chartConfig}
                      bezier={sanitizedScore.values.length > 1}
                      style={styles.chartStyle}
                    />
                  ) : (
                    <LineChart
                      data={{
                        labels: sanitizedScore.labels,
                        datasets: [{ data: sanitizedScore.values }],
                      }}
                      width={screenWidth - 56}
                      height={200}
                      yAxisSuffix="%"
                      chartConfig={chartConfig}
                      bezier={sanitizedScore.values.length > 1}
                      style={styles.chartStyle}
                    />
                  )
                ) : (
                  <Text style={styles.noDataText}>No score history available</Text>
                )}
              </GlassCard>
            </ErrorBoundary>

            {/* Skills Breakdown */}
            <Text style={styles.chartTitle}>Skills Breakdown</Text>
            <ErrorBoundary fallbackText="Skills Breakdown chart unavailable">
              <GlassCard style={styles.chartCard}>
                {sanitizedSkills ? (
                  Platform.OS === 'web' || !BarChart ? (
                    <CustomSVGChart
                      type="bar"
                      data={{
                        labels: sanitizedSkills.labels,
                        datasets: [{ data: sanitizedSkills.values }],
                      }}
                      width={screenWidth - 56}
                      height={200}
                      yAxisSuffix="%"
                      chartConfig={chartConfig}
                      style={styles.chartStyle}
                    />
                  ) : (
                    <BarChart
                      data={{
                        labels: sanitizedSkills.labels,
                        datasets: [{ data: sanitizedSkills.values }],
                      }}
                      width={screenWidth - 56}
                      height={200}
                      yAxisLabel=""
                      yAxisSuffix="%"
                      chartConfig={chartConfig}
                      style={styles.chartStyle}
                    />
                  )
                ) : (
                  <Text style={styles.noDataText}>No skills breakdown available</Text>
                )}
              </GlassCard>
            </ErrorBoundary>

            {/* Confidence Trend */}
            <Text style={styles.chartTitle}>Confidence Trend</Text>
            <ErrorBoundary fallbackText="Confidence Trend chart unavailable">
              <GlassCard style={styles.chartCard}>
                {sanitizedConfidence ? (
                  Platform.OS === 'web' || !LineChart ? (
                    <CustomSVGChart
                      type="line"
                      data={{
                        labels: sanitizedConfidence.labels,
                        datasets: [{ data: sanitizedConfidence.values }],
                      }}
                      width={screenWidth - 56}
                      height={200}
                      yAxisSuffix="%"
                      chartConfig={secondaryChartConfig}
                      bezier={sanitizedConfidence.values.length > 1}
                      style={styles.chartStyle}
                    />
                  ) : (
                    <LineChart
                      data={{
                        labels: sanitizedConfidence.labels,
                        datasets: [{ data: sanitizedConfidence.values }],
                      }}
                      width={screenWidth - 56}
                      height={200}
                      yAxisSuffix="%"
                      chartConfig={secondaryChartConfig}
                      bezier={sanitizedConfidence.values.length > 1}
                      style={styles.chartStyle}
                    />
                  )
                ) : (
                  <Text style={styles.noDataText}>No confidence trend available</Text>
                )}
              </GlassCard>
            </ErrorBoundary>

            {/* Filler Word Trend */}
            <Text style={styles.chartTitle}>Filler Words Trend</Text>
            <ErrorBoundary fallbackText="Filler Words Trend chart unavailable">
              <GlassCard style={styles.chartCard}>
                {sanitizedFiller ? (
                  Platform.OS === 'web' || !LineChart ? (
                    <CustomSVGChart
                      type="line"
                      data={{
                        labels: sanitizedFiller.labels,
                        datasets: [{ data: sanitizedFiller.values }],
                      }}
                      width={screenWidth - 56}
                      height={200}
                      chartConfig={chartConfig}
                      style={styles.chartStyle}
                    />
                  ) : (
                    <LineChart
                      data={{
                        labels: sanitizedFiller.labels,
                        datasets: [{ data: sanitizedFiller.values }],
                      }}
                      width={screenWidth - 56}
                      height={200}
                      chartConfig={chartConfig}
                      style={styles.chartStyle}
                    />
                  )
                ) : (
                  <Text style={styles.noDataText}>No filler words trend available</Text>
                )}
              </GlassCard>
            </ErrorBoundary>
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
    paddingBottom: 100,
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
  noDataText: {
    color: Colors.textMuted,
    fontSize: 14,
    paddingVertical: 35,
    textAlign: 'center',
    fontWeight: '500',
  },
});
