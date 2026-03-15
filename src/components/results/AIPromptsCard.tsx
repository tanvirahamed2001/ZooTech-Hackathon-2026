import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, Sparkles, MessageSquare, Settings } from 'lucide-react';
import { generateAIPrompts } from '../../utils/aiPrompts';
import { useToast } from '../../contexts/ToastContext';
import type { VarkScores } from '../../types';

type AIPromptsCardProps = {
  scores: VarkScores;
};

type PromptBlockProps = {
  label: string;
  description: string;
  icon: React.ReactNode;
  prompt: string;
};

const PromptBlock: React.FC<PromptBlockProps> = ({ label, description, icon, prompt }) => {
  const [copied, setCopied] = useState(false);
  const { addToast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      addToast('Prompt copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = prompt;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setCopied(true);
        addToast('Prompt copied to clipboard');
        setTimeout(() => setCopied(false), 2000);
      } catch {
        addToast('Could not copy prompt.', 'error');
      }
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center gap-2">
          {icon}
          <h4 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{label}</h4>
        </div>
        <motion.button
          onClick={handleCopy}
          className={`flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 ${
            copied
              ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700'
              : 'text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/30 border border-violet-200 dark:border-violet-700 hover:border-violet-400 dark:hover:border-violet-500'
          }`}
          whileTap={{ scale: 0.95 }}
          aria-label={copied ? 'Copied' : `Copy ${label}`}
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" strokeWidth={2.5} />
              Copy
            </>
          )}
        </motion.button>
      </div>
      <div className="px-4 pt-2 pb-1">
        <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
      </div>
      <div className="px-4 pb-4 pt-2">
        <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-sans">
          {prompt}
        </pre>
      </div>
    </div>
  );
};

const AIPromptsCard: React.FC<AIPromptsCardProps> = ({ scores }) => {
  const { systemPrompt, conversationPrompt } = generateAIPrompts(scores);

  return (
    <motion.div
      className="card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-5 h-5 text-violet-500 dark:text-violet-400" />
        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Your AI Learning Prompts</h3>
      </div>
      <p className="text-gray-600 dark:text-gray-300 text-sm mb-6">
        Copy these prompts into any AI tool — ChatGPT, Claude, Gemini, or any other — to make it adapt to your learning style instantly.
      </p>

      <div className="space-y-5">
        <PromptBlock
          label="System Prompt"
          description="Paste this into a custom instructions or system prompt field to pre-configure any AI tool for your learning style."
          icon={<Settings className="w-4 h-4 text-violet-500 dark:text-violet-400" />}
          prompt={systemPrompt}
        />
        <PromptBlock
          label="Conversation Prompt"
          description="Drop this into any live AI chat to immediately reorient the conversation to your VARK style."
          icon={<MessageSquare className="w-4 h-4 text-violet-500 dark:text-violet-400" />}
          prompt={conversationPrompt}
        />
      </div>
    </motion.div>
  );
};

export default AIPromptsCard;
