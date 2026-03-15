/**
 * Application constants — single source of truth for branding and routes.
 */

export const APP = {
  name: 'Varkly',
  tagline: 'VARK Learning Style Quiz',
  description: 'Discover your VARK learning style in 90 seconds. Get personalized AI prompts that make ChatGPT, Claude, or any AI adapt to how your brain works.',
  quizQuestionCount: 13,
  quizEstimatedSeconds: 90,
} as const;

export const ROUTES = {
  home: '/',
  quiz: '/quiz',
  results: '/results',
  resultByHash: (hash: string) => `/r/${hash}`,
} as const;

export const STORAGE_KEYS = {
  theme: 'varkly-theme',
  quizState: 'quizState',
} as const;
