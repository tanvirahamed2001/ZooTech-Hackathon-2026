import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { QuizContextType, QuizState, VarkScores, UserIntent } from '../types';
import { questions } from '../data/questions';

const defaultQuizState: QuizState = {
  currentQuestionIndex: -1,
  answers: {},
  isCompleted: false,
};

const QuizContext = createContext<QuizContextType | null>(null);

export const useQuiz = () => {
  const context = useContext(QuizContext);
  if (!context) {
    throw new Error('useQuiz must be used within a QuizProvider');
  }
  return context;
};

export const QuizProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [quizState, setQuizState] = useState<QuizState>(() => {
    try {
      const saved = sessionStorage.getItem('quizState');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.warn('Could not restore quiz state:', error);
    }
    return defaultQuizState;
  });

  const navigate = useNavigate();
  const prevCompletedRef = useRef(quizState.isCompleted);

  useEffect(() => {
    try {
      sessionStorage.setItem('quizState', JSON.stringify(quizState));
    } catch (error) {
      console.warn('Could not save quiz state:', error);
    }
  }, [quizState]);

  useEffect(() => {
    if (quizState.isCompleted && !prevCompletedRef.current) {
      navigate('/results');
    }
    prevCompletedRef.current = quizState.isCompleted;
  }, [quizState.isCompleted, navigate]);

  const startQuiz = useCallback(() => {
    setQuizState(defaultQuizState);
    navigate('/quiz');
  }, [navigate]);

  const resetQuiz = useCallback(() => {
    setQuizState(defaultQuizState);
    sessionStorage.removeItem('quizState');
    navigate('/');
  }, [navigate]);

  const setUserIntent = useCallback((intent: UserIntent) => {
    setQuizState(prevState => ({
      ...prevState,
      userIntent: intent,
    }));
  }, []);

  const goToNextQuestion = useCallback(() => {
    setQuizState(prevState => {
      if (prevState.currentQuestionIndex === -1) {
        return { ...prevState, currentQuestionIndex: 0 };
      }
      if (prevState.currentQuestionIndex < questions.length - 1) {
        return { ...prevState, currentQuestionIndex: prevState.currentQuestionIndex + 1 };
      }
      return { ...prevState, isCompleted: true };
    });
  }, []);

  const goToPreviousQuestion = useCallback(() => {
    setQuizState(prevState => {
      if (prevState.currentQuestionIndex > -1) {
        return { ...prevState, currentQuestionIndex: prevState.currentQuestionIndex - 1 };
      }
      return prevState;
    });
  }, []);

  const selectOption = useCallback((questionId: number, optionId: string) => {
    setQuizState((prevState) => {
      const currentAnswers = prevState.answers[questionId] || [];
      if (!currentAnswers.includes(optionId)) {
        return {
          ...prevState,
          answers: {
            ...prevState.answers,
            [questionId]: [...currentAnswers, optionId],
          },
        };
      }
      return prevState;
    });
  }, []);

  const unselectOption = useCallback((questionId: number, optionId: string) => {
    setQuizState((prevState) => {
      const currentAnswers = prevState.answers[questionId] || [];
      return {
        ...prevState,
        answers: {
          ...prevState.answers,
          [questionId]: currentAnswers.filter(id => id !== optionId),
        },
      };
    });
  }, []);

  const isOptionSelected = useCallback((questionId: number, optionId: string): boolean => {
    const answers = quizState.answers[questionId] || [];
    return answers.includes(optionId);
  }, [quizState.answers]);

  const skipQuestion = useCallback(() => {
    setQuizState(prevState => {
      if (prevState.currentQuestionIndex === -1) {
        return { ...prevState, currentQuestionIndex: 0 };
      }
      if (prevState.currentQuestionIndex < questions.length - 1) {
        return { ...prevState, currentQuestionIndex: prevState.currentQuestionIndex + 1 };
      }
      return { ...prevState, isCompleted: true };
    });
  }, []);

  const calculateScores = useCallback((): VarkScores => {
    const scores: VarkScores = { V: 0, A: 0, R: 0, K: 0 };

    Object.entries(quizState.answers).forEach(([questionId, selectedOptionIds]) => {
      const question = questions.find(q => q.id === parseInt(questionId));
      if (question) {
        selectedOptionIds.forEach(optionId => {
          const option = question.options.find(o => o.id === optionId);
          if (option) {
            scores[option.type] += 1;
          }
        });
      }
    });

    return scores;
  }, [quizState.answers]);

  const value: QuizContextType = {
    quizState,
    startQuiz,
    goToNextQuestion,
    goToPreviousQuestion,
    selectOption,
    unselectOption,
    isOptionSelected,
    skipQuestion,
    calculateScores,
    resetQuiz,
    setUserIntent,
  };

  return <QuizContext.Provider value={value}>{children}</QuizContext.Provider>;
};
