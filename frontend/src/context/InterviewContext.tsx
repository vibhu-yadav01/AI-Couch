import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Interview, InterviewSetup } from '../types';
import {
  startInterview as startInterviewApi,
  submitTextAnswer,
  submitVoiceAnswer as submitVoiceAnswerApi,
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

const interviewReducer = (state: InterviewState, action: InterviewAction): InterviewState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_INTERVIEW':
      return { ...state, currentInterview: action.payload, currentQuestionIndex: 0, isComplete: false };
    case 'UPDATE_INTERVIEW':
      return { ...state, currentInterview: action.payload };
    case 'NEXT_QUESTION':
      const nextIndex = state.currentQuestionIndex + 1;
      const totalQuestions = state.currentInterview?.questions.length || 0;
      if (nextIndex >= totalQuestions) {
        return { ...state, currentQuestionIndex: nextIndex, isComplete: true };
      }
      return { ...state, currentQuestionIndex: nextIndex };
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
      const data = await startInterviewApi(setup);
      const interview: Interview = data.interview || data;
      dispatch({ type: 'SET_INTERVIEW', payload: interview });
      return interview;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const submitAnswer = async (text: string) => {
    if (!state.currentInterview) return;
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const data = await submitTextAnswer(state.currentInterview._id, text);
      if (data.interview) dispatch({ type: 'UPDATE_INTERVIEW', payload: data.interview });
      dispatch({ type: 'NEXT_QUESTION' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const submitVoiceAnswer = async (uri: string) => {
    if (!state.currentInterview) return;
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const data = await submitVoiceAnswerApi(
        state.currentInterview._id,
        uri,
        state.currentQuestionIndex
      );
      if (data.interview) dispatch({ type: 'UPDATE_INTERVIEW', payload: data.interview });
      dispatch({ type: 'NEXT_QUESTION' });
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

  return (
    <InterviewContext.Provider
      value={{ ...state, startInterview, submitAnswer, submitVoiceAnswer, resetInterview, nextQuestion }}
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
