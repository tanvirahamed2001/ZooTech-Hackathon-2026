import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Question as QuestionType } from '../../types';
import { useQuiz } from '../../contexts/QuizContext';
import { Check, ChevronLeft, ChevronRight, SkipForward, HelpCircle } from 'lucide-react';
import { questions } from '../../data/questions';

type QuestionProps = {
  question: QuestionType;
};

const Question: React.FC<QuestionProps> = ({ question }) => {
  const { 
    quizState, 
    goToNextQuestion, 
    goToPreviousQuestion, 
    selectOption,
    unselectOption,
    isOptionSelected,
    skipQuestion 
  } = useQuiz();

  const hasSelectedOptions = quizState.answers[question.id] && quizState.answers[question.id].length > 0;

  useEffect(() => {
    // Scroll to top when question changes
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Keyboard shortcuts
    const handleKeyPress = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      // Prevent shortcuts when typing in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      // Number keys 1-4 for options
      if (['1', '2', '3', '4'].includes(key)) {
        const index = parseInt(key) - 1;
        const option = question.options[index];
        if (option) {
          if (isOptionSelected(question.id, option.id)) {
            unselectOption(question.id, option.id);
          } else {
            selectOption(question.id, option.id);
          }
        }
      }
      
      // Enter to proceed
      if (key === 'enter') {
        goToNextQuestion();
      }
      
      // Space to skip
      if (key === ' ') {
        e.preventDefault();
        skipQuestion();
      }
      
      // Left/right arrows for navigation
      if (key === 'arrowleft') {
        goToPreviousQuestion();
      }
      if (key === 'arrowright') {
        goToNextQuestion();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [question.id, goToNextQuestion, goToPreviousQuestion, selectOption, unselectOption, isOptionSelected, skipQuestion]);

  const getSimplifiedExplanation = (scenario: string) => {
    const explanations: Record<number, string> = {
      1: "We want to know how you prefer to learn when building something new. Do you like watching videos, talking it through, reading instructions, or just trying it yourself?",
      2: "This question helps us understand how you learn new skills in the kitchen. Do you prefer visual guides, verbal instructions, written recipes, or hands-on experience?",
      3: "When helping others find their way, your method of explaining directions reveals your natural communication style.",
      4: "Your preparation style for presentations shows how you best organize and remember information.",
      5: "Learning a musical instrument requires different approaches. Your preference here shows how you naturally tackle new skills.",
      6: "This question reveals how you best absorb information in learning environments like classrooms or meetings.",
      7: "Memorizing numbers is a specific type of learning task. Your approach shows your natural memory strategy.",
      8: "Planning activities shows how you prefer to gather and process new information.",
      9: "Your approach to learning new technology reveals your preferred way of understanding complex systems.",
      10: "Remember names? This shows your natural strategy for connecting new information to memory.",
      11: "How you choose restaurants shows your preferred way of making decisions based on information.",
      12: "Handling problems shows how you prefer to communicate and solve issues.",
      13: "Your relaxation preferences often match how your brain naturally processes information."
    };
    
    return explanations[question.id] || "Choose the options that best match your natural behavior in this situation.";
  };

  const handleOptionClick = (optionId: string) => {
    if (isOptionSelected(question.id, optionId)) {
      unselectOption(question.id, optionId);
    } else {
      selectOption(question.id, optionId);
    }
  };

  return (
    <motion.div 
      className="w-full max-w-3xl mx-auto px-4"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="card">
        <motion.h3 
          className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          {question.scenario}
        </motion.h3>

        <div className="bg-violet-50 dark:bg-violet-900/20 p-4 rounded-xl mb-6 border border-violet-100 dark:border-violet-800/50">
          <div className="flex items-start">
            <HelpCircle className="w-5 h-5 text-violet-500 dark:text-violet-400 mt-1 mr-2 flex-shrink-0" strokeWidth={2.5} />
            <p className="text-violet-900/90 dark:text-violet-200">{getSimplifiedExplanation(question.scenario)}</p>
          </div>
        </div>
        
        <motion.div 
          className="space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          {question.options.map((option, index) => (
            <motion.div
              key={option.id}
              className={`quiz-option ${isOptionSelected(question.id, option.id) ? 'selected' : ''}`}
              onClick={() => handleOptionClick(option.id)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 + (index * 0.1) }}
            >
              <div className="flex items-start">
                <div className={`w-6 h-6 mt-0.5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mr-3 ${isOptionSelected(question.id, option.id) ? 'bg-violet-500 border-violet-500' : 'border-gray-300'}`}>
                  {isOptionSelected(question.id, option.id) && <Check className="w-4 h-4 text-white" strokeWidth={2.75} />}
                </div>
                <div className="flex-1">
                  <span className="text-gray-800 dark:text-gray-200">{option.text}</span>
                  <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">Press {index + 1}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <div className="flex justify-between mt-8">
          <motion.button
            onClick={goToPreviousQuestion}
            className="btn-secondary text-sm px-4 py-2"
            disabled={quizState.currentQuestionIndex === 0}
            initial={{ opacity: 0 }}
            animate={{ opacity: quizState.currentQuestionIndex === 0 ? 0.5 : 1 }}
            transition={{ duration: 0.3, delay: 0.4 }}
            whileHover={quizState.currentQuestionIndex !== 0 ? { scale: 1.02 } : {}}
            whileTap={quizState.currentQuestionIndex !== 0 ? { scale: 0.98 } : {}}
          >
            <ChevronLeft className="w-4 h-4 mr-1 text-[#f5f5f7]" strokeWidth={2.5} />
            Previous
          </motion.button>
          
          <div className="flex space-x-3">
            <motion.button
              onClick={skipQuestion}
              className="btn-secondary text-sm px-4 py-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.5 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <SkipForward className="w-4 h-4 mr-1 text-[#f5f5f7]" strokeWidth={2.5} />
              Skip (Space)
            </motion.button>
            
            <motion.button
              onClick={goToNextQuestion}
              className={`${hasSelectedOptions ? 'btn-primary' : 'btn-secondary'} text-sm px-4 py-2`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.6 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {quizState.currentQuestionIndex === questions.length - 1 ? 'Finish' : 'Next'} (Enter)
              <ChevronRight className="w-4 h-4 ml-1 text-[#f5f5f7]" strokeWidth={2.5} />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Question;