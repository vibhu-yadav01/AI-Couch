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
      description: 'Practice realistic technical, HR, and behavioral interviews.',
      icon: 'chatbubbles-outline',
      color: Colors.primary,
    },
    {
      title: 'Resume Analysis',
      description: 'Upload your resume and receive personalized interview preparation.',
      icon: 'document-text-outline',
      color: Colors.secondary,
    },
    {
      title: 'Performance Analytics',
      description: 'Track scores, strengths, weaknesses, and improvement over time.',
      icon: 'bar-chart-outline',
      color: Colors.accentBlue,
    },
    {
      title: 'Voice & Text Interviews',
      description: 'Practice naturally using either typing or your microphone.',
      icon: 'mic-outline',
      color: Colors.accent,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#0A0A1A', '#12122A', '#0A0A1A']} style={StyleSheet.absoluteFill} />

      {/* Decorative ambient background circles */}
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <Animated.View style={[styles.headerSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <LinearGradient colors={[Colors.primary, Colors.secondary]} style={styles.logoCircle}>
            <Ionicons name="hardware-chip" size={32} color={Colors.white} />
          </LinearGradient>
          <Text style={styles.appTitle}>AI Interview Coach</Text>
          <Text style={styles.appSubtitle}>
            Practice interviews with AI, improve your communication, technical skills, and confidence before real interviews.
          </Text>
        </Animated.View>

        {/* Features Section */}
        <Animated.View style={[styles.featuresSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          {features.map((item, index) => (
            <GlassCard key={index} style={styles.featureCard}>
              <View style={[styles.iconContainer, { backgroundColor: `${item.color}15` }]}>
                <Ionicons name={item.icon as any} size={22} color={item.color} />
              </View>
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>{item.title}</Text>
                <Text style={styles.featureDescription}>{item.description}</Text>
              </View>
            </GlassCard>
          ))}
        </Animated.View>

        {/* Footer Actions */}
        <Animated.View style={[styles.footerSection, { opacity: fadeAnim }]}>
          <GradientButton
            title="Get Started"
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
        </Animated.View>
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
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 40 : 20,
    paddingBottom: 40,
  },
  bgCircle1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(108, 99, 255, 0.06)',
    top: -60,
    right: -80,
  },
  bgCircle2: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(255, 101, 132, 0.04)',
    bottom: 40,
    left: -80,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 36,
  },
  logoCircle: {
    width: 68,
    height: 68,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    ...Platform.select({
      web: {
        boxShadow: `0px 6px 12px ${Colors.primary}4D`,
      },
      default: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
      },
    }),
  },
  appTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  appSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 20,
  },
  featuresSection: {
    marginBottom: 24,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    padding: 14,
    backgroundColor: Colors.cardGlass,
    borderColor: Colors.border,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  footerSection: {
    marginTop: 'auto',
    alignItems: 'center',
  },
  getStartedButton: {
    width: '100%',
    marginBottom: 18,
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
