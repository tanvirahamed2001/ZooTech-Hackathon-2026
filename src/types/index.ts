export type QuestionOption = {
  id: string;
  text: string;
  type: 'V' | 'A' | 'R' | 'K';
};

export type Question = {
  id: number;
  scenario: string;
  options: QuestionOption[];
};

export type UserIntent = {
  reason: string;
  customReason?: string;
};

export type QuizState = {
  currentQuestionIndex: number;
  answers: Record<number, string[]>;
  userIntent?: UserIntent;
  isCompleted: boolean;
};

export type VarkScores = {
  V: number;
  A: number;
  R: number;
  K: number;
};

export type QuizContextType = {
  quizState: QuizState;
  startQuiz: () => void;
  goToNextQuestion: () => void;
  goToPreviousQuestion: () => void;
  selectOption: (questionId: number, optionId: string) => void;
  unselectOption: (questionId: number, optionId: string) => void;
  isOptionSelected: (questionId: number, optionId: string) => boolean;
  skipQuestion: () => void;
  calculateScores: () => VarkScores;
  resetQuiz: () => void;
  setUserIntent: (intent: UserIntent) => void;
};
