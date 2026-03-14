import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QuizContextType, QuizState, VarkScores, UserIntent, EmailCapture } from '../types';
import { questions } from '../data/questions';

const defaultQuizState: QuizState = {
  currentQuestionIndex: -1, // Start at intro
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
    // Try to restore from sessionStorage on initial load
    try {
      const saved = sessionStorage.getItem('quizState');
      if (saved) {
        const parsed = JSON.parse(saved);
        console.log('Restored quiz state from sessionStorage:', parsed);
        return parsed;
      }
    } catch (error) {
      console.warn('Could not restore quiz state:', error);
    }
    return defaultQuizState;
  });
  
  const navigate = useNavigate();

  // Save to sessionStorage whenever quizState changes
  useEffect(() => {
    try {
      sessionStorage.setItem('quizState', JSON.stringify(quizState));
      console.log('Saved quiz state to sessionStorage:', quizState);
    } catch (error) {
      console.warn('Could not save quiz state:', error);
    }
  }, [quizState]);

  const startQuiz = () => {
    setQuizState(prevState => ({
      ...defaultQuizState,
      emailCapture: prevState.emailCapture // Preserve email capture when starting quiz
    }));
    navigate('/quiz');
  };

  const resetQuiz = () => {
    setQuizState(defaultQuizState);
    sessionStorage.removeItem('quizState');
    navigate('/');
  };

  const setUserIntent = (intent: UserIntent) => {
    setQuizState(prevState => ({
      ...prevState,
      userIntent: intent
    }));
  };

  const setEmailCapture = (capture: EmailCapture) => {
    console.log('Setting email capture in context:', capture);
    setQuizState(prevState => ({
      ...prevState,
      emailCapture: capture
    }));
  };

  const goToNextQuestion = () => {
    if (quizState.currentQuestionIndex === -1) {
      // Move from intro to first question
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
      // Quiz completed
      console.log('Quiz completed, final state:', {
        ...quizState,
        isCompleted: true
      });
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

  const isOptionSelected = (questionId: number, optionId: string): boolean => {
    const answers = quizState.answers[questionId] || [];
    return answers.includes(optionId);
  };

  const skipQuestion = () => {
    goToNextQuestion();
  };

  const calculateScores = (): VarkScores => {
    const scores: VarkScores = { V: 0, A: 0, R: 0, K: 0 };
    
    // Count selected answers by type
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
    goToNextQuestion,
    goToPreviousQuestion,
    selectOption,
    unselectOption,
    isOptionSelected,
    skipQuestion,
    calculateScores,
    resetQuiz,
    setUserIntent,
    setEmailCapture,
  };

  return <QuizContext.Provider value={value}>{children}</QuizContext.Provider>;
};