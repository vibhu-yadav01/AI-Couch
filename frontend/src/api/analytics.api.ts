import apiClient from './client';

export const getDashboard = async () => {
  const response = await apiClient.get('/analytics/dashboard');
  return response.data;
};

export const getInterviewAnalytics = async (interviewId: string) => {
  const response = await apiClient.get(`/analytics/interview/${interviewId}`);
  return response.data;
};
