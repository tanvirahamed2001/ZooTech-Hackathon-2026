import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QuizContextType, QuizState, VarkScores, UserIntent } from '../types';
import { questions } from '../data/questions';
import { stopSpeechPlayback } from '../utils/voice/web-ai-engine';

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

  useEffect(() => {
    try {
      sessionStorage.setItem('quizState', JSON.stringify(quizState));
    } catch (error) {
      console.warn('Could not save quiz state:', error);
    }
  }, [quizState]);

  const startQuiz = () => {
    setQuizState(defaultQuizState);
    navigate('/quiz');
  };

  const startVoiceQuiz = () => {
    setQuizState(defaultQuizState);
    navigate('/quiz/voice');
  };

  const resetQuiz = () => {
    setQuizState(defaultQuizState);
    sessionStorage.removeItem('quizState');
    navigate('/');
  };

  const resetForVoiceIntro = () => {
    setQuizState(defaultQuizState);
  };

  const setUserIntent = (intent: UserIntent) => {
    setQuizState(prevState => ({
      ...prevState,
      userIntent: intent,
    }));
  };

  const goToNextQuestion = () => {
    if (quizState.currentQuestionIndex === -1) {
      setQuizState(prevState => ({
        ...prevState,
        currentQuestionIndex: 0,
      }));
    } else if (quizState.currentQuestionIndex < questions.length - 1) {
      setQuizState(prevState => ({
        ...prevState,
        currentQuestionIndex: prevState.currentQuestionIndex + 1,
      }));
    } else {
      stopSpeechPlayback();
      setQuizState(prevState => ({
        ...prevState,
        isCompleted: true,
      }));
      navigate('/results');
    }
  };

  const goToPreviousQuestion = () => {
    if (quizState.currentQuestionIndex > -1) {
      setQuizState(prevState => ({
        ...prevState,
        currentQuestionIndex: prevState.currentQuestionIndex - 1,
      }));
    }
  };

  const goToQuestionIndex = (index: number) => {
    const clamped = Math.max(0, Math.min(index, questions.length - 1));
    setQuizState(prevState => ({
      ...prevState,
      currentQuestionIndex: clamped,
      isCompleted: false,
    }));
  };

  const selectOption = (questionId: number, optionId: string) => {
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
  };

  const unselectOption = (questionId: number, optionId: string) => {
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
  };

  const setQuestionAnswers = (questionId: number, optionIds: string[]) => {
    setQuizState((prev) => ({
      ...prev,
      answers: {
        ...prev.answers,
        [questionId]: optionIds,
      },
    }));
  };

  const isOptionSelected = (questionId: number, optionId: string): boolean => {
    const answers = quizState.answers[questionId] || [];
    return answers.includes(optionId);
  };

  const skipQuestion = () => {
    goToNextQuestion();
  };

  const calculateScores = (): VarkScores => {
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
  };

  const value: QuizContextType = {
    quizState,
    startQuiz,
    startVoiceQuiz,
    goToNextQuestion,
    goToPreviousQuestion,
    goToQuestionIndex,
    selectOption,
    unselectOption,
    setQuestionAnswers,
    isOptionSelected,
    skipQuestion,
    calculateScores,
    resetQuiz,
    resetForVoiceIntro,
    setUserIntent,
  };

  return <QuizContext.Provider value={value}>{children}</QuizContext.Provider>;
};
