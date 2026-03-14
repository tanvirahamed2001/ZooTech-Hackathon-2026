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

export type EmailCapture = {
  firstName?: string;
  email: string;
  reason: string;
  customReason?: string;
  recordId?: string; // Add this to track the database record
  ipAddress?: string; // Track IP address
  userAgent?: string; // Track browser info
  hpField?: string; // Add honeypot field
};

export type QuizState = {
  currentQuestionIndex: number;
  answers: Record<number, string[]>;
  userIntent?: UserIntent;
  emailCapture?: EmailCapture;
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
  setEmailCapture: (capture: EmailCapture) => void;
};