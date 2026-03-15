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

export type AIPrompts = {
  systemPrompt: string;
  conversationPrompt: string;
};

export type QuizContextType = {
  quizState: QuizState;
  startQuiz: () => void;
  startVoiceQuiz: () => void;
  goToNextQuestion: () => void;
  goToPreviousQuestion: () => void;
  goToQuestionIndex: (index: number) => void;
  selectOption: (questionId: number, optionId: string) => void;
  unselectOption: (questionId: number, optionId: string) => void;
  setQuestionAnswers: (questionId: number, optionIds: string[]) => void;
  isOptionSelected: (questionId: number, optionId: string) => boolean;
  skipQuestion: () => void;
  calculateScores: () => VarkScores;
  resetQuiz: () => void;
  resetForVoiceIntro: () => void;
  setUserIntent: (intent: UserIntent) => void;
};
