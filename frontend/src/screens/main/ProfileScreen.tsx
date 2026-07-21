import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../utils/colors';
import GlassCard from '../../components/GlassCard';
import GradientButton from '../../components/GradientButton';
import { useAuth } from '../../context/AuthContext';
import { updateProfile } from '../../api/auth.api';
import { getDashboard } from '../../api/analytics.api';

type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

export default function ProfileScreen() {
  const { user, logout, loadUser } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('beginner');
  const [submitting, setSubmitting] = useState(false);

  const [loadingStats, setLoadingStats] = useState(true);
  const [stats, setStats] = useState({
    totalInterviews: 0,
    averageScore: 0,
    bestScore: 0,
  });

  useEffect(() => {
    if (user) {
      setName(user.name);
      setTargetRole(user.targetRole || '');
      setExperienceLevel((user.experienceLevel as ExperienceLevel) || 'beginner');
    }
    fetchStats();
  }, [user]);

  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const response = await getDashboard();
      if (response.success && response.data) {
        const dashboard = response.data;
        
        // Find best score from recent interviews list
        let best = 0;
        if (dashboard.recentInterviews && dashboard.recentInterviews.length > 0) {
          best = Math.max(...dashboard.recentInterviews.map((i: any) => i.score || 0));
        }

        setStats({
          totalInterviews: dashboard.totalInterviews || 0,
          averageScore: dashboard.averageScore || 0,
          bestScore: best,
        });
      }
    } catch (error) {
      console.log('Failed to fetch profile stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleUpdate = async () => {
    if (!name.trim()) {
      Alert.alert('Name Required', 'Please enter your name.');
      return;
    }

    try {
      setSubmitting(true);
      const response = await updateProfile({
        name: name.trim(),
        targetRole: targetRole.trim(),
        experienceLevel,
      });

      if (response.success) {
        await loadUser(); // Reload updated profile
        setIsEditing(false);
        Alert.alert('Success', 'Profile updated successfully!');
      } else {
        Alert.alert('Error', response.error || 'Failed to update profile.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getInitials = (fullName: string) => {
    return fullName
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header & Avatar */}
          <View style={styles.avatarHeader}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitials}>
                {user ? getInitials(user.name) : 'CO'}
              </Text>
            </View>
            <Text style={styles.profileName}>{user?.name}</Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
          </View>

          {/* Stats Breakdown */}
          <View style={styles.statsGrid}>
            <GlassCard style={styles.statMiniCard}>
              <Text style={styles.statMiniVal}>
                {loadingStats ? '-' : stats.totalInterviews}
              </Text>
              <Text style={styles.statMiniLabel}>Completed</Text>
            </GlassCard>
            <GlassCard style={styles.statMiniCard}>
              <Text style={[styles.statMiniVal, { color: Colors.primary }]}>
                {loadingStats ? '-' : `${stats.averageScore}%`}
              </Text>
              <Text style={styles.statMiniLabel}>Average Score</Text>
            </GlassCard>
            <GlassCard style={styles.statMiniCard}>
              <Text style={[styles.statMiniVal, { color: Colors.accent }]}>
                {loadingStats ? '-' : `${stats.bestScore}%`}
              </Text>
              <Text style={styles.statMiniLabel}>Best Score</Text>
            </GlassCard>
          </View>

          {/* Edit Form */}
          <GlassCard style={styles.profileFormCard}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>Profile Details</Text>
              <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
                <Text style={styles.editLink}>{isEditing ? 'Cancel' : 'Edit'}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.formItem}>
              <Text style={styles.formLabel}>Full Name</Text>
              <TextInput
                style={[styles.formInput, !isEditing && styles.formInputDisabled]}
                value={name}
                onChangeText={setName}
                editable={isEditing && !submitting}
              />
            </View>

            <View style={styles.formItem}>
              <Text style={styles.formLabel}>Target Job Role</Text>
              <TextInput
                style={[styles.formInput, !isEditing && styles.formInputDisabled]}
                placeholder={isEditing ? 'e.g. Software Engineer' : 'Not specified'}
                placeholderTextColor={Colors.textMuted}
                value={targetRole}
                onChangeText={setTargetRole}
                editable={isEditing && !submitting}
              />
            </View>

            <View style={styles.formItem}>
              <Text style={styles.formLabel}>Experience Level</Text>
              {isEditing ? (
                <View style={styles.pickerRow}>
                  {(['beginner', 'intermediate', 'advanced'] as ExperienceLevel[]).map((level) => (
                    <TouchableOpacity
                      key={level}
                      style={[
                        styles.pickerBtn,
                        experienceLevel === level && styles.pickerBtnActive,
                      ]}
                      onPress={() => setExperienceLevel(level)}
                      disabled={submitting}
                    >
                      <Text
                        style={[
                          styles.pickerBtnText,
                          experienceLevel === level && styles.pickerBtnTextActive,
                        ]}
                      >
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <TextInput
                  style={[styles.formInput, styles.formInputDisabled]}
                  value={
                    experienceLevel.charAt(0).toUpperCase() + experienceLevel.slice(1)
                  }
                  editable={false}
                />
              )}
            </View>

            {isEditing && (
              <GradientButton
                title="Save Changes"
                onPress={handleUpdate}
                loading={submitting}
                disabled={submitting}
                gradientColors={Colors.gradient.primary}
                style={styles.saveBtn}
              />
            )}
          </GlassCard>

          {/* Action Logouts */}
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Ionicons name="log-out-outline" size={20} color={Colors.error} />
            <Text style={styles.logoutBtnText}>Sign Out</Text>
          </TouchableOpacity>

          <Text style={styles.versionInfo}>AI Interview Coach • v1.0.0</Text>
        </ScrollView>
      </KeyboardAvoidingView>
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
  avatarHeader: {
    alignItems: 'center',
    marginVertical: 20,
  },
  avatarCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        boxShadow: `0px 4px 10px ${Colors.primary}26`,
      },
      default: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 4,
      },
    }),
  },
  avatarInitials: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.primary,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 12,
  },
  profileEmail: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: -4,
    marginBottom: 20,
  },
  statMiniCard: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  statMiniVal: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  statMiniLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 4,
    fontWeight: '500',
  },
  profileFormCard: {
    padding: 20,
    marginBottom: 20,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    paddingBottom: 10,
  },
  formTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  editLink: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  formItem: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  formInput: {
    backgroundColor: Colors.surfaceLight,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Colors.text,
    fontSize: 14,
  },
  formInputDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
    borderColor: 'rgba(255, 255, 255, 0.03)',
    color: Colors.textSecondary,
  },
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: -4,
  },
  pickerBtn: {
    flex: 1,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  pickerBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(108, 99, 255, 0.12)',
  },
  pickerBtnText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  pickerBtnTextActive: {
    color: Colors.primary,
  },
  saveBtn: {
    marginTop: 10,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 101, 132, 0.08)',
    borderColor: 'rgba(255, 101, 132, 0.2)',
    borderWidth: 1,
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 20,
  },
  logoutBtnText: {
    color: Colors.error,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  versionInfo: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
