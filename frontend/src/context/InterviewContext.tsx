import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Interview, InterviewSetup } from '../types';
import {
  startInterview as startInterviewApi,
  submitTextAnswer,
  submitVoiceAnswer as submitVoiceAnswerApi,
  completeInterview as completeInterviewApi,
  getInterview,
} from '../api/interview.api';

interface InterviewState {
  currentInterview: Interview | null;
  currentQuestionIndex: number;
  isLoading: boolean;
  isComplete: boolean;
}

interface InterviewContextType extends InterviewState {
  startInterview: (setup: InterviewSetup) => Promise<Interview>;
  submitAnswer: (text: string) => Promise<void>;
  submitVoiceAnswer: (uri: string) => Promise<void>;
  resetInterview: () => void;
  nextQuestion: () => void;
}

type InterviewAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_INTERVIEW'; payload: Interview }
  | { type: 'UPDATE_INTERVIEW'; payload: Interview }
  | { type: 'NEXT_QUESTION' }
  | { type: 'COMPLETE_INTERVIEW' }
  | { type: 'RESET' };

const initialState: InterviewState = {
  currentInterview: null,
  currentQuestionIndex: 0,
  isLoading: false,
  isComplete: false,
};

const extractInterview = (data: any): Interview => {
  if (data?.data?.interview) return data.data.interview;
  if (data?.interview) return data.interview;
  if (data?.data && data.data._id) return data.data;
  if (data?._id) return data;
  throw new Error('Invalid API response: Could not find interview object');
};

const interviewReducer = (state: InterviewState, action: InterviewAction): InterviewState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_INTERVIEW':
      return { 
        ...state, 
        currentInterview: action.payload, 
        currentQuestionIndex: action.payload?.answers?.length || 0, 
        isComplete: action.payload?.status === 'completed' 
      };
    case 'UPDATE_INTERVIEW':
      return { 
        ...state, 
        currentInterview: action.payload, 
        currentQuestionIndex: action.payload?.answers?.length || 0, 
      };
    case 'NEXT_QUESTION':
      return state;
    case 'COMPLETE_INTERVIEW':
      return { ...state, isComplete: true };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
};

const InterviewContext = createContext<InterviewContextType | undefined>(undefined);

export const InterviewProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(interviewReducer, initialState);

  const startInterview = async (setup: InterviewSetup): Promise<Interview> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const responseData = await startInterviewApi(setup);
      const interviewId = responseData?.data?.interviewId;
      if (!interviewId) {
        throw new Error('Failed to start interview: No interviewId returned from server');
      }
      
      const fullInterviewResponse = await getInterview(interviewId);
      const interview = extractInterview(fullInterviewResponse);
      
      if (!interview || !interview._id) {
        throw new Error('Failed to fetch full interview details');
      }
      if (!Array.isArray(interview.questions) || interview.questions.length === 0) {
        throw new Error('Interview has no generated questions');
      }
      
      dispatch({ type: 'SET_INTERVIEW', payload: interview });
      return interview;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const completeInterviewFlow = async (interviewId: string) => {
    const completeData = await completeInterviewApi(interviewId);
    const completedInterview = extractInterview(completeData);
    dispatch({ type: 'UPDATE_INTERVIEW', payload: completedInterview });
    dispatch({ type: 'COMPLETE_INTERVIEW' });
  };

  const submitAnswer = async (text: string) => {
    if (!state.currentInterview) return;
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const data = await submitTextAnswer(state.currentInterview._id, text);
      const updatedInterview = extractInterview(data);
      if (updatedInterview) {
        dispatch({ type: 'UPDATE_INTERVIEW', payload: updatedInterview });
        if (updatedInterview.answers.length === updatedInterview.questions.length) {
          await completeInterviewFlow(updatedInterview._id);
        }
      }
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const submitVoiceAnswer = async (uri: string) => {
    if (!state.currentInterview) return;
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const questionIndex = state.currentInterview.answers.length;
      const data = await submitVoiceAnswerApi(
        state.currentInterview._id,
        uri,
        questionIndex
      );
      const updatedInterview = extractInterview(data);
      if (updatedInterview) {
        dispatch({ type: 'UPDATE_INTERVIEW', payload: updatedInterview });
        if (updatedInterview.answers.length === updatedInterview.questions.length) {
          await completeInterviewFlow(updatedInterview._id);
        }
      }
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const resetInterview = () => {
    dispatch({ type: 'RESET' });
  };

  const nextQuestion = () => {
    dispatch({ type: 'NEXT_QUESTION' });
  };

  const currentQuestionIndex = state.currentInterview ? state.currentInterview.answers.length : 0;
  const isComplete = state.isComplete;

  return (
    <InterviewContext.Provider
      value={{ 
        ...state, 
        currentQuestionIndex, 
        isComplete, 
        startInterview, 
        submitAnswer, 
        submitVoiceAnswer, 
        resetInterview, 
        nextQuestion 
      }}
    >
      {children}
    </InterviewContext.Provider>
  );
};

export const useInterview = () => {
  const context = useContext(InterviewContext);
  if (!context) throw new Error('useInterview must be used within InterviewProvider');
  return context;
};
