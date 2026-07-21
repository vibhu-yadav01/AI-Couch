import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ScrollView,
  TouchableOpacity,
  Platform,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../utils/colors';
import GlassCard from '../../components/GlassCard';
import GradientButton from '../../components/GradientButton';
import { AuthStackParamList } from '../../navigation/AppNavigator';

type WelcomeScreenProps = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Welcome'>;
};

const { width: screenWidth } = Dimensions.get('window');
const isLargeScreen = screenWidth > 768;

export default function WelcomeScreen({ navigation }: WelcomeScreenProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();
  }, []);

  const features = [
    {
      title: 'AI Mock Interviews',
      description: 'Practice realistic technical, HR, and behavioral interviews customized to your target role.',
      icon: 'chatbubbles-outline',
      color: Colors.primary,
    },
    {
      title: 'Resume Scanner Calibration',
      description: 'Upload your CV to auto-generate questions tailored precisely to your background and projects.',
      icon: 'document-text-outline',
      color: Colors.secondary,
    },
    {
      title: 'Live Speech Diagnostics',
      description: 'Analyze word pace, filler counts (ums/likes), and pause rhythms in real time.',
      icon: 'mic-outline',
      color: Colors.accent,
    },
    {
      title: 'Performance Dashboards',
      description: 'Track granular scores, communication curves, and focus history over time.',
      icon: 'bar-chart-outline',
      color: Colors.accentBlue,
    },
  ];

  const testimonials = [
    {
      quote: 'Practiced technical coding rounds here and cleared my software engineering interview at Microsoft!',
      author: 'Aarav K.',
      role: 'Software Engineer',
    },
    {
      quote: 'The speech analytics pace dashboard helped me eliminate filler words and speak with high confidence.',
      author: 'Sofia L.',
      role: 'Product Manager',
    },
    {
      quote: 'Auto-generating questions from my resume was incredibly accurate. Exactly what recruiters asked me.',
      author: 'Marcus J.',
      role: 'Data Analyst',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#0A0A1A', '#12122A', '#0A0A1A']} style={StyleSheet.absoluteFill} />

      {/* Background glow graphics */}
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.responsiveContent}>
          {/* Hero Section */}
          <Animated.View style={[styles.heroSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>🚀 NEXT-GEN MOCK INTERVIEWS</Text>
            </View>

            <View style={styles.logoRow}>
              <LinearGradient colors={[Colors.primary, Colors.secondary]} style={styles.logoCircle}>
                <Ionicons name="hardware-chip" size={28} color={Colors.white} />
              </LinearGradient>
              <Text style={styles.appTitle}>AI Coach</Text>
            </View>

            <Text style={styles.heroTagline}>
              Accelerate your preparation. Master your delivery. Land the offer.
            </Text>
            <Text style={styles.appSubtitle}>
              Simulate realistic interviews powered by advanced Gemini models. Get verbal analysis, CV calibration, and immediate pacing diagnostics.
            </Text>

            {/* Quick Metrics */}
            <View style={styles.metricsRow}>
              <View style={styles.metricCard}>
                <Text style={[styles.metricVal, { color: Colors.primary }]}>95%</Text>
                <Text style={styles.metricLbl}>Success Rate</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={[styles.metricVal, { color: Colors.secondary }]}>Gemini</Text>
                <Text style={styles.metricLbl}>3.5 Powered</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={[styles.metricVal, { color: Colors.accent }]}>Realtime</Text>
                <Text style={styles.metricLbl}>Speech Diagnostics</Text>
              </View>
            </View>
          </Animated.View>

          {/* Features Grid Section */}
          <Animated.View style={[styles.featuresSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Text style={styles.sectionHeaderTitle}>Elevate Your Placement Strategy</Text>
            <View style={styles.featuresGrid}>
              {features.map((item, index) => (
                <GlassCard key={index} style={[styles.featureCard, isLargeScreen && styles.featureCardWeb]}>
                  <View style={[styles.iconContainer, { backgroundColor: `${item.color}15` }]}>
                    <Ionicons name={item.icon as any} size={22} color={item.color} />
                  </View>
                  <View style={styles.featureTextContainer}>
                    <Text style={styles.featureTitle}>{item.title}</Text>
                    <Text style={styles.featureDescription}>{item.description}</Text>
                  </View>
                </GlassCard>
              ))}
            </View>
          </Animated.View>


          {/* Call to Action Block */}
          <Animated.View style={[styles.ctaSection, { opacity: fadeAnim }]}>
            <GlassCard style={styles.ctaCard}>
              <Text style={styles.ctaTitle}>Ready to Ace Your Next Session?</Text>
              <Text style={styles.ctaSubtitle}>
                Join thousands of candidates practicing technical & HR rounds. No credit card required.
              </Text>
              <GradientButton
                title="Get Started Now"
                onPress={() => navigation.navigate('Login')}
                gradientColors={Colors.gradient.primary}
                style={styles.getStartedButton}
              />
              <View style={styles.signInRow}>
                <Text style={styles.signInText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.signInLink}>Sign In</Text>
                </TouchableOpacity>
              </View>
            </GlassCard>
          </Animated.View>
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
    flexGrow: 1,
    paddingBottom: 60,
  },
  responsiveContent: {
    width: '100%',
    maxWidth: 800,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 40 : 24,
  },
  bgCircle1: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(108, 99, 255, 0.05)',
    top: -50,
    right: -80,
  },
  bgCircle2: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(255, 101, 132, 0.03)',
    top: 400,
    left: -100,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  heroBadge: {
    backgroundColor: 'rgba(108, 99, 255, 0.12)',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.25)',
    marginBottom: 20,
  },
  heroBadgeText: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoCircle: {
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    ...Platform.select({
      web: {
        boxShadow: `0px 4px 10px ${Colors.primary}4D`,
      },
      default: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 6,
      },
    }),
  },
  appTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: Colors.text,
    letterSpacing: -0.8,
  },
  heroTagline: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 14,
    lineHeight: 28,
  },
  appSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    maxWidth: 600,
    lineHeight: 22,
    marginBottom: 24,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
    marginTop: 8,
  },
  metricCard: {
    flex: 1,
    backgroundColor: 'rgba(30, 30, 64, 0.3)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(240, 240, 255, 0.05)',
    paddingVertical: 14,
    alignItems: 'center',
  },
  metricVal: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  metricLbl: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
  },
  sectionHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  featuresSection: {
    marginBottom: 40,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 14,
  },
  featureCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 18,
    backgroundColor: Colors.cardGlass,
    borderColor: Colors.border,
  },
  featureCardWeb: {
    width: '48%',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    marginTop: 2,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 6,
  },
  featureDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  testimonialsSection: {
    marginBottom: 40,
  },
  testimonialsScrollContainer: {
    marginHorizontal: -24,
  },
  testimonialsScroll: {
    paddingHorizontal: 24,
    gap: 16,
    paddingBottom: 8,
  },
  testimonialCard: {
    width: 280,
    padding: 20,
    backgroundColor: Colors.cardGlass,
    borderColor: Colors.border,
  },
  quoteIcon: {
    opacity: 0.15,
    marginBottom: 10,
  },
  testimonialQuote: {
    fontSize: 13,
    color: Colors.text,
    fontStyle: 'italic',
    lineHeight: 20,
    marginBottom: 16,
    minHeight: 60,
  },
  testimonialAuthorRow: {
    borderTopWidth: 1,
    borderColor: 'rgba(240, 240, 255, 0.05)',
    paddingTop: 10,
  },
  testimonialAuthor: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
  },
  testimonialRole: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  ctaSection: {
    marginTop: 10,
  },
  ctaCard: {
    padding: 28,
    alignItems: 'center',
    backgroundColor: 'rgba(30, 30, 64, 0.55)',
    borderColor: Colors.border,
    borderWidth: 1.5,
  },
  ctaTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 10,
  },
  ctaSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
    maxWidth: 500,
  },
  getStartedButton: {
    width: '100%',
    maxWidth: 320,
    marginBottom: 20,
  },
  signInRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signInText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  signInLink: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
});
