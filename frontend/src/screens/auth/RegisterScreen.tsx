import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../utils/colors';
import { extractErrorMessage } from '../../utils/error';
import GradientButton from '../../components/GradientButton';
import { AuthStackParamList } from '../../navigation/AppNavigator';

type RegisterScreenProps = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Register'>;
};

const EXPERIENCE_LEVELS = [
  { label: 'Beginner', value: 'beginner', icon: 'leaf-outline' },
  { label: 'Intermediate', value: 'intermediate', icon: 'trending-up-outline' },
  { label: 'Advanced', value: 'advanced', icon: 'rocket-outline' },
];

export default function RegisterScreen({ navigation }: RegisterScreenProps) {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('beginner');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: Platform.OS !== 'web' }),
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 10, useNativeDriver: Platform.OS !== 'web' }),
    ]).start();
  }, []);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError('Please fill in all required fields');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await register(name.trim(), email.trim(), password);
    } catch (err: any) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0A0A1A', '#12122A', '#0A0A1A']} style={StyleSheet.absoluteFill} />
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={Colors.text} />
            </TouchableOpacity>
            <LinearGradient colors={[Colors.primary, Colors.secondary]} style={styles.logoCircle}>
              <Ionicons name="hardware-chip" size={28} color={Colors.white} />
            </LinearGradient>
            <Text style={styles.formTitle}>Create Account</Text>
            <Text style={styles.formSubtitle}>Start your interview preparation journey</Text>
          </Animated.View>

          <Animated.View style={[styles.form, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            {/* Name */}
            <View style={[styles.inputWrapper, focusedField === 'name' && styles.inputWrapperFocused]}>
              <Ionicons
                name="person-outline"
                size={18}
                color={focusedField === 'name' ? Colors.primary : Colors.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Full Name *"
                placeholderTextColor={Colors.textMuted}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                onFocus={() => setFocusedField('name')}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            {/* Email */}
            <View style={[styles.inputWrapper, focusedField === 'email' && styles.inputWrapperFocused]}>
              <Ionicons
                name="mail-outline"
                size={18}
                color={focusedField === 'email' ? Colors.primary : Colors.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Email Address *"
                placeholderTextColor={Colors.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            {/* Target Role */}
            <View style={[styles.inputWrapper, focusedField === 'targetRole' && styles.inputWrapperFocused]}>
              <Ionicons
                name="briefcase-outline"
                size={18}
                color={focusedField === 'targetRole' ? Colors.primary : Colors.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Target Role (e.g. Software Engineer)"
                placeholderTextColor={Colors.textMuted}
                value={targetRole}
                onChangeText={setTargetRole}
                onFocus={() => setFocusedField('targetRole')}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            {/* Password */}
            <View style={[styles.inputWrapper, focusedField === 'password' && styles.inputWrapperFocused]}>
              <Ionicons
                name="lock-closed-outline"
                size={18}
                color={focusedField === 'password' ? Colors.primary : Colors.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Password *"
                placeholderTextColor={Colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={Colors.textMuted}
                />
              </TouchableOpacity>
            </View>

            {/* Confirm Password */}
            <View style={[styles.inputWrapper, focusedField === 'confirmPassword' && styles.inputWrapperFocused]}>
              <Ionicons
                name="shield-checkmark-outline"
                size={18}
                color={focusedField === 'confirmPassword' ? Colors.primary : Colors.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Confirm Password *"
                placeholderTextColor={Colors.textMuted}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                onFocus={() => setFocusedField('confirmPassword')}
                onBlur={() => setFocusedField(null)}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeButton}>
                <Ionicons
                  name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={Colors.textMuted}
                />
              </TouchableOpacity>
            </View>

            {/* Experience Level */}
            <Text style={styles.sectionLabel}>Experience Level</Text>
            <View style={styles.experienceRow}>
              {EXPERIENCE_LEVELS.map((level) => {
                const isSelected = experienceLevel === level.value;
                return (
                  <TouchableOpacity
                    key={level.value}
                    onPress={() => setExperienceLevel(level.value)}
                    style={[styles.levelCard, isSelected && styles.levelCardSelected]}
                    activeOpacity={0.8}
                  >
                    {isSelected ? (
                      <LinearGradient colors={Colors.gradient.primary} style={styles.levelGradient}>
                        <Ionicons name={level.icon as any} size={18} color={Colors.white} />
                        <Text style={[styles.levelLabel, { color: Colors.white }]}>{level.label}</Text>
                      </LinearGradient>
                    ) : (
                      <View style={styles.levelGradient}>
                        <Ionicons name={level.icon as any} size={18} color={Colors.textMuted} />
                        <Text style={styles.levelLabel}>{level.label}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Error */}
            {error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={16} color={Colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <GradientButton
              title="Create Account"
              onPress={handleRegister}
              loading={loading}
              style={styles.registerButton}
              gradient={Colors.gradient.primary}
            />

            <View style={styles.loginRow}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 50, paddingBottom: 40 },
  bgCircle1: {
    position: 'absolute', width: 280, height: 280, borderRadius: 140,
    backgroundColor: 'rgba(108, 99, 255, 0.07)', top: -60, left: -80,
  },
  bgCircle2: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(67, 233, 123, 0.05)', bottom: 80, right: -40,
  },
  header: { alignItems: 'center', marginBottom: 32 },
  backButton: {
    position: 'absolute', left: 0, top: 0,
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.surfaceLight, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  logoCircle: {
    width: 64, height: 64, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
    ...Platform.select({
      web: {
        boxShadow: `0px 8px 16px ${Colors.primary}66`,
      },
      default: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 12,
      },
    }),
  },
  formTitle: { fontSize: 26, fontWeight: '800', color: Colors.text, marginBottom: 6, letterSpacing: -0.5 },
  formSubtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', maxWidth: 240 },
  form: { flex: 1 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surfaceLight, borderRadius: 14,
    borderWidth: 1.5, borderColor: 'rgba(108, 99, 255, 0.15)',
    marginBottom: 14, paddingHorizontal: 16, height: 54,
  },
  inputWrapperFocused: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(30, 30, 64, 0.95)',
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, color: Colors.text, fontSize: 15, fontWeight: '500' },
  passwordInput: { paddingRight: 8 },
  eyeButton: { padding: 4 },
  sectionLabel: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: 12, letterSpacing: 0.5 },
  experienceRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  levelCard: {
    flex: 1, borderRadius: 12, overflow: 'hidden',
    borderWidth: 1, borderColor: Colors.border,
  },
  levelCardSelected: { borderColor: Colors.primary },
  levelGradient: { padding: 12, alignItems: 'center', gap: 6 },
  levelLabel: { color: Colors.textMuted, fontSize: 12, fontWeight: '600' },
  errorContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255, 101, 132, 0.1)',
    borderRadius: 10, padding: 12, marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(255, 101, 132, 0.3)',
  },
  errorText: { color: Colors.error, fontSize: 13, marginLeft: 8, flex: 1 },
  registerButton: { marginBottom: 24 },
  loginRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  loginText: { color: Colors.textSecondary, fontSize: 14 },
  loginLink: { color: Colors.primary, fontSize: 14, fontWeight: '700' },
});
