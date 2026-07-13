import apiClient from './client';
import { InterviewSetup } from '../types';

export const startInterview = async (setup: InterviewSetup) => {
  const response = await apiClient.post('/interview/start', setup);
  return response.data;
};

export const submitTextAnswer = async (interviewId: string, answerText: string) => {
  const response = await apiClient.post(`/interview/${interviewId}/answer/text`, { answerText });
  return response.data;
};

export const submitVoiceAnswer = async (
  interviewId: string,
  audioUri: string,
  questionIndex: number
) => {
  const formData = new FormData();
  formData.append('audio', {
    uri: audioUri,
    type: 'audio/m4a',
    name: `answer_${questionIndex}.m4a`,
  } as any);
  formData.append('questionIndex', String(questionIndex));

  const response = await apiClient.post(`/interview/${interviewId}/answer/voice`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const getInterviewHistory = async () => {
  const response = await apiClient.get('/interview/history');
  return response.data;
};

export const getInterview = async (id: string) => {
  const response = await apiClient.get(`/interview/${id}`);
  return response.data;
};
