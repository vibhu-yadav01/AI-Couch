import { Platform } from 'react-native';
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
  questionIndex: number,
  duration?: number
) => {
  console.log('[interview.api] Preparing voice answer submission:', {
    interviewId,
    audioUri,
    questionIndex,
    duration,
    platform: Platform.OS
  });

  const formData = new FormData();

  if (Platform.OS === 'web') {
    const response = await fetch(audioUri);
    const blob = await response.blob();
    const mimeType = blob.type || 'audio/webm';
    const ext = mimeType.split('/')[1]?.split(';')[0] || 'webm';
    const filename = `answer_${questionIndex}.${ext}`;
    
    console.log('[interview.api] Web blob fetched:', {
      blobSize: blob.size,
      blobType: blob.type,
      assignedMimeType: mimeType,
      filename
    });

    formData.append('audio', blob, filename);
  } else {
    const ext = audioUri.split('.').pop()?.toLowerCase() || 'm4a';
    let mimeType = 'audio/m4a';
    if (ext === 'wav') mimeType = 'audio/wav';
    else if (ext === 'caf') mimeType = 'audio/x-caf';
    else if (ext === 'webm') mimeType = 'audio/webm';
    else if (ext === 'mp3') mimeType = 'audio/mpeg';

    const filename = `answer_${questionIndex}.${ext}`;

    console.log('[interview.api] Native audio file details:', {
      uri: audioUri,
      mimeType,
      filename
    });

    formData.append('audio', {
      uri: audioUri,
      type: mimeType,
      name: filename,
    } as any);
  }

  formData.append('questionIndex', String(questionIndex));
  if (duration !== undefined) {
    formData.append('duration', String(duration));
  }

  console.log('[interview.api] Sending POST /interview/' + interviewId + '/answer/voice with multipart/form-data');

  const response = await apiClient.post(`/interview/${interviewId}/answer/voice`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
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

export const completeInterview = async (interviewId: string) => {
  const response = await apiClient.post('/interview/complete', { interviewId });
  return response.data;
};
