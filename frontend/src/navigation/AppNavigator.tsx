import React from 'react';
import { NavigationContainer, getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

import { useAuth } from '../context/AuthContext';
import { Colors, ThemeStyles } from '../utils/colors';

// Auth Screens
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Main Screens
import HomeScreen from '../screens/main/HomeScreen';
import ResumeScreen from '../screens/main/ResumeScreen';
import InterviewSetupScreen from '../screens/main/InterviewSetupScreen';
import TextInterviewScreen from '../screens/main/TextInterviewScreen';
import VoiceInterviewScreen from '../screens/main/VoiceInterviewScreen';
import ResultsScreen from '../screens/main/ResultsScreen';
import AnalyticsScreen from '../screens/main/AnalyticsScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import InterviewHistoryScreen from '../screens/main/InterviewHistoryScreen';

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
};

export type HomeStackParamList = {
  HomeMain: undefined;
  InterviewSetup: undefined;
  TextInterview: { interviewId: string };
  VoiceInterview: { interviewId: string };
  Results: { interviewId: string };
  InterviewHistory: undefined;
};

export type ResumeStackParamList = {
  ResumeMain: undefined;
};

export type PracticeStackParamList = {
  InterviewSetup: undefined;
  TextInterview: { interviewId: string };
  VoiceInterview: { interviewId: string };
  Results: { interviewId: string };
};

export type AnalyticsStackParamList = {
  AnalyticsMain: undefined;
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Resume: undefined;
  Practice: undefined;
  Analytics: undefined;
  Profile: undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const ResumeStack = createNativeStackNavigator<ResumeStackParamList>();
const PracticeStack = createNativeStackNavigator<PracticeStackParamList>();
const AnalyticsStack = createNativeStackNavigator<AnalyticsStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

const screenOptions = {
  headerShown: false,
  contentStyle: { backgroundColor: Colors.background },
};

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={screenOptions}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} />
      <HomeStack.Screen name="InterviewSetup" component={InterviewSetupScreen} />
      <HomeStack.Screen name="TextInterview" component={TextInterviewScreen} />
      <HomeStack.Screen name="VoiceInterview" component={VoiceInterviewScreen} />
      <HomeStack.Screen name="Results" component={ResultsScreen} />
      <HomeStack.Screen name="InterviewHistory" component={InterviewHistoryScreen} />
    </HomeStack.Navigator>
  );
}

function ResumeStackNavigator() {
  return (
    <ResumeStack.Navigator screenOptions={screenOptions}>
      <ResumeStack.Screen name="ResumeMain" component={ResumeScreen} />
    </ResumeStack.Navigator>
  );
}

function PracticeStackNavigator() {
  return (
    <PracticeStack.Navigator screenOptions={screenOptions}>
      <PracticeStack.Screen name="InterviewSetup" component={InterviewSetupScreen} />
      <PracticeStack.Screen name="TextInterview" component={TextInterviewScreen} />
      <PracticeStack.Screen name="VoiceInterview" component={VoiceInterviewScreen} />
      <PracticeStack.Screen name="Results" component={ResultsScreen} />
    </PracticeStack.Navigator>
  );
}

function AnalyticsStackNavigator() {
  return (
    <AnalyticsStack.Navigator screenOptions={screenOptions}>
      <AnalyticsStack.Screen name="AnalyticsMain" component={AnalyticsScreen} />
    </AnalyticsStack.Navigator>
  );
}

function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={screenOptions}>
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
    </ProfileStack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const routeName = getFocusedRouteNameFromRoute(route) ?? '';
        const hideTabBar = ['TextInterview', 'VoiceInterview', 'Results', 'InterviewSetup'].includes(routeName);
        return {
          headerShown: false,
          tabBarStyle: hideTabBar ? { display: 'none' } : ThemeStyles.floatingTabBar,
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.textMuted,
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap = 'home';
            if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
            else if (route.name === 'Resume') iconName = focused ? 'document-text' : 'document-text-outline';
            else if (route.name === 'Practice') iconName = focused ? 'mic' : 'mic-outline';
            else if (route.name === 'Analytics') iconName = focused ? 'bar-chart' : 'bar-chart-outline';
            else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
            return <Ionicons name={iconName} size={size} color={color} />;
          },
        };
      }}
    >
      <Tab.Screen name="Home" component={HomeStackNavigator} />
      <Tab.Screen name="Resume" component={ResumeStackNavigator} />
      <Tab.Screen name="Practice" component={PracticeStackNavigator} />
      <Tab.Screen name="Analytics" component={AnalyticsStackNavigator} />
      <Tab.Screen name="Profile" component={ProfileStackNavigator} />
    </Tab.Navigator>
  );
}

function AuthStackNavigator() {
  return (
    <AuthStack.Navigator screenOptions={screenOptions}>
      <AuthStack.Screen name="Welcome" component={WelcomeScreen} />
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

export default function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainTabs /> : <AuthStackNavigator />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
});
