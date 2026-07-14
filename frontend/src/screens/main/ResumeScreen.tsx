import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { Colors } from '../../utils/colors';
import GlassCard from '../../components/GlassCard';
import GradientButton from '../../components/GradientButton';
import { uploadResume, getUserResume } from '../../api/resume.api';
import { Resume } from '../../types';
import { extractErrorMessage } from '../../utils/error';

export default function ResumeScreen() {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [resume, setResume] = useState<Resume | null>(null);

  useEffect(() => {
    fetchResume();
  }, []);

  const fetchResume = async () => {
    try {
      const response = await getUserResume();
      if (response.success && response.data) {
        setResume(response.data);
      }
    } catch (error) {
      console.log('No resume found or failed to load:', error);
    } finally {
      setFetching(false);
    }
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/msword',
        ],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const fileAsset = result.assets[0];

      // Limit client-side file size (10MB)
      if (fileAsset.size && fileAsset.size > 10 * 1024 * 1024) {
        Alert.alert('File Too Large', 'Maximum file size allowed is 10MB.');
        return;
      }

      setLoading(true);

      const formData = new FormData();
      if (Platform.OS === 'web') {
        const fileAssetAny = fileAsset as any;
        if (fileAssetAny.file) {
          formData.append('resume', fileAssetAny.file, fileAsset.name);
        } else {
          const response = await fetch(fileAsset.uri);
          const blob = await response.blob();
          formData.append('resume', blob, fileAsset.name);
        }
      } else {
        formData.append('resume', {
          uri: fileAsset.uri,
          name: fileAsset.name,
          type: fileAsset.mimeType || 'application/pdf',
        } as any);
      }

      const response = await uploadResume(formData);

      if (response.success) {
        Alert.alert('Success', 'Resume uploaded and parsed successfully!');
        // Reload resume profile
        await fetchResume();
      } else {
        Alert.alert('Error', response.error || 'Failed to upload resume.');
      }
    } catch (error: any) {
      console.error('Document picker error:', error);
      Alert.alert('Error', extractErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading resume profile...</Text>
      </SafeAreaView>
    );
  }

  const parsedData = resume?.parsedData;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Resume Parser</Text>
          <Text style={styles.headerSubtitle}>
            Upload your resume to calibrate the AI mock interview questions to your background.
          </Text>
        </View>

        {/* Upload Card */}
        <GlassCard style={styles.uploadCard}>
          <View style={styles.uploadBox}>
            <View style={styles.uploadIconContainer}>
              <Ionicons
                name={resume ? 'document-attach' : 'cloud-upload-outline'}
                size={40}
                color={resume ? Colors.accent : Colors.primary}
              />
            </View>
            <Text style={styles.uploadTitle}>
              {resume ? 'Update Your Resume' : 'Upload Your Resume'}
            </Text>
            <Text style={styles.uploadInfo}>Supports PDF, DOCX formats up to 10MB</Text>

            {resume && (
              <View style={styles.currentFileBadge}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                <Text style={styles.currentFileName} numberOfLines={1}>
                  Resume uploaded
                </Text>
              </View>
            )}

            {loading ? (
              <View style={styles.parsingContainer}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.parsingText}>Analyzing resume content...</Text>
              </View>
            ) : (
              <GradientButton
                title={resume ? 'Replace File' : 'Select Document'}
                onPress={handlePickDocument}
                gradientColors={Colors.gradient.primary}
                style={styles.selectButton}
              />
            )}
          </View>
        </GlassCard>

        {/* Parsed Resume Display */}
        {resume && parsedData && (
          <View style={styles.parsedDataContainer}>
            <Text style={styles.parsedSectionTitle}>Extracted AI Profile</Text>

            {/* Skills */}
            {parsedData.skills && parsedData.skills.length > 0 && (
              <GlassCard style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="construct-outline" size={18} color={Colors.primary} />
                  <Text style={styles.sectionHeaderTitle}>Technical Skills</Text>
                </View>
                <View style={styles.skillsWrapper}>
                  {parsedData.skills.map((skill, index) => (
                    <View key={index} style={styles.skillChip}>
                      <Text style={styles.skillText}>{skill}</Text>
                    </View>
                  ))}
                </View>
              </GlassCard>
            )}

            {/* Experience */}
            {parsedData.experience && parsedData.experience.length > 0 && (
              <GlassCard style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="briefcase-outline" size={18} color={Colors.secondary} />
                  <Text style={styles.sectionHeaderTitle}>Work Experience</Text>
                </View>
                {parsedData.experience.map((exp, index) => (
                  <View
                    key={index}
                    style={[
                      styles.experienceItem,
                      index < parsedData.experience.length - 1 && styles.borderBottom,
                    ]}
                  >
                    <Text style={styles.experienceRole}>{exp.role}</Text>
                    <Text style={styles.experienceCompany}>
                      {exp.company} {exp.duration ? `• ${exp.duration}` : ''}
                    </Text>
                    {exp.description && (
                      <Text style={styles.experienceDescription}>{exp.description}</Text>
                    )}
                  </View>
                ))}
              </GlassCard>
            )}

            {/* Projects */}
            {parsedData.projects && parsedData.projects.length > 0 && (
              <GlassCard style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="code-slash" size={18} color={Colors.accentBlue} />
                  <Text style={styles.sectionHeaderTitle}>Projects</Text>
                </View>
                {parsedData.projects.map((project, index) => (
                  <View
                    key={index}
                    style={[
                      styles.projectItem,
                      index < parsedData.projects.length - 1 && styles.borderBottom,
                    ]}
                  >
                    <Text style={styles.projectName}>{project.name}</Text>
                    <Text style={styles.projectDesc}>{project.description}</Text>
                    {project.technologies && project.technologies.length > 0 && (
                      <View style={styles.projectTechs}>
                        {project.technologies.map((tech, i) => (
                          <Text key={i} style={styles.projectTechText}>
                            #{tech}
                          </Text>
                        ))}
                      </View>
                    )}
                  </View>
                ))}
              </GlassCard>
            )}

            {/* Education */}
            {parsedData.education && parsedData.education.length > 0 && (
              <GlassCard style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="school-outline" size={18} color={Colors.accent} />
                  <Text style={styles.sectionHeaderTitle}>Education</Text>
                </View>
                {parsedData.education.map((edu, index) => (
                  <View
                    key={index}
                    style={[
                      styles.educationItem,
                      index < parsedData.education.length - 1 && styles.borderBottom,
                    ]}
                  >
                    <Text style={styles.educationDegree}>{edu.degree}</Text>
                    <Text style={styles.educationInstitution}>
                      {edu.institution} {edu.year ? `(${edu.year})` : ''}
                    </Text>
                  </View>
                ))}
              </GlassCard>
            )}

            {/* Certifications */}
            {parsedData.certifications && parsedData.certifications.length > 0 && (
              <GlassCard style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <MaterialCommunityIcons name="certificate-outline" size={18} color={Colors.warning} />
                  <Text style={styles.sectionHeaderTitle}>Certifications</Text>
                </View>
                <View style={styles.certsList}>
                  {parsedData.certifications.map((cert, index) => (
                    <View key={index} style={styles.certItem}>
                      <Ionicons name="ribbon-outline" size={14} color={Colors.warning} />
                      <Text style={styles.certText}>{cert}</Text>
                    </View>
                  ))}
                </View>
              </GlassCard>
            )}
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
    marginBottom: 20,
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
  uploadCard: {
    padding: 20,
    marginBottom: 25,
  },
  uploadBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
  },
  uploadIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  uploadTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  uploadInfo: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 15,
  },
  currentFileBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(67, 233, 123, 0.1)',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 15,
  },
  currentFileName: {
    fontSize: 12,
    color: Colors.success,
    marginLeft: 6,
    fontWeight: '600',
  },
  parsingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  parsingText: {
    fontSize: 13,
    color: Colors.primary,
    marginLeft: 8,
    fontWeight: '500',
  },
  selectButton: {
    width: '100%',
  },
  parsedDataContainer: {
    marginTop: 10,
  },
  parsedSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 15,
  },
  sectionCard: {
    padding: 16,
    marginBottom: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    paddingBottom: 8,
  },
  sectionHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginLeft: 8,
  },
  skillsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  skillChip: {
    backgroundColor: 'rgba(108, 99, 255, 0.12)',
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
    margin: 4,
  },
  skillText: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: '500',
  },
  experienceItem: {
    paddingVertical: 10,
  },
  experienceRole: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  experienceCompany: {
    fontSize: 12,
    color: Colors.primary,
    marginTop: 2,
    fontWeight: '500',
  },
  experienceDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 6,
    lineHeight: 16,
  },
  projectItem: {
    paddingVertical: 10,
  },
  projectName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  projectDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 16,
  },
  projectTechs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  projectTechText: {
    fontSize: 11,
    color: Colors.accentBlue,
    marginRight: 8,
    fontWeight: '500',
  },
  educationItem: {
    paddingVertical: 10,
  },
  educationDegree: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  educationInstitution: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    paddingBottom: 12,
    marginBottom: 12,
  },
  certsList: {
    paddingVertical: 4,
  },
  certItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  certText: {
    fontSize: 12,
    color: Colors.text,
    marginLeft: 8,
  },
});
