import { describe, it, expect } from 'vitest';
import { generateAIPrompts } from '../aiPrompts';
import type { VarkScores } from '../../types';

describe('generateAIPrompts', () => {
  describe('return shape', () => {
    it('returns an object with systemPrompt and conversationPrompt strings', () => {
      const result = generateAIPrompts({ V: 5, A: 3, R: 2, K: 1 });
      expect(result).toHaveProperty('systemPrompt');
      expect(result).toHaveProperty('conversationPrompt');
      expect(typeof result.systemPrompt).toBe('string');
      expect(typeof result.conversationPrompt).toBe('string');
    });

    it('is a pure function — same input always produces same output', () => {
      const scores: VarkScores = { V: 7, A: 3, R: 4, K: 2 };
      const first = generateAIPrompts(scores);
      const second = generateAIPrompts(scores);
      expect(first).toEqual(second);
    });
  });

  describe('single dominant style', () => {
    it('generates Visual-focused prompts when V is dominant', () => {
      const result = generateAIPrompts({ V: 9, A: 2, R: 1, K: 1 });
      expect(result.systemPrompt).toContain('visual learner');
      expect(result.systemPrompt).toContain('V=9, A=2, R=1, K=1');
      expect(result.systemPrompt).toContain('headers');
      expect(result.systemPrompt).toContain('bullet points');
      expect(result.systemPrompt).toContain('diagram');
      expect(result.conversationPrompt).toContain('Visual learner');
    });

    it('generates Auditory-focused prompts when A is dominant', () => {
      const result = generateAIPrompts({ V: 1, A: 10, R: 3, K: 2 });
      expect(result.systemPrompt).toContain('auditory learner');
      expect(result.systemPrompt).toContain('conversational');
      expect(result.conversationPrompt).toContain('Auditory learner');
    });

    it('generates Read/Write-focused prompts when R is dominant', () => {
      const result = generateAIPrompts({ V: 2, A: 1, R: 8, K: 3 });
      expect(result.systemPrompt).toContain('read/write learner');
      expect(result.systemPrompt).toContain('definitions');
      expect(result.conversationPrompt).toContain('Read/Write learner');
    });

    it('generates Kinesthetic-focused prompts when K is dominant', () => {
      const result = generateAIPrompts({ V: 1, A: 2, R: 3, K: 11 });
      expect(result.systemPrompt).toContain('kinesthetic learner');
      expect(result.systemPrompt).toContain('real-world example');
      expect(result.conversationPrompt).toContain('Kinesthetic learner');
    });
  });

  describe('two dominant styles (tie)', () => {
    it('generates dual VA prompts when Visual and Auditory tie', () => {
      const result = generateAIPrompts({ V: 6, A: 6, R: 1, K: 0 });
      expect(result.systemPrompt).toContain('visual-auditory learner');
      expect(result.systemPrompt).toContain('V=6, A=6, R=1, K=0');
      expect(result.conversationPrompt).toContain('Visual-Auditory');
    });

    it('generates dual RK prompts when Read/Write and Kinesthetic tie', () => {
      const result = generateAIPrompts({ V: 2, A: 1, R: 7, K: 7 });
      expect(result.systemPrompt).toContain('read/write-kinesthetic learner');
      expect(result.conversationPrompt).toContain('Read/Write-Kinesthetic');
    });

    it('includes check-in instructions from both styles', () => {
      const result = generateAIPrompts({ V: 5, A: 5, R: 1, K: 2 });
      expect(result.systemPrompt).toContain('Alternatively');
    });
  });

  describe('three or more dominant styles', () => {
    it('generates multimodal prompts for a three-way tie', () => {
      const result = generateAIPrompts({ V: 4, A: 4, R: 4, K: 1 });
      expect(result.systemPrompt).toContain('highly multimodal');
      expect(result.systemPrompt).toContain('V=4, A=4, R=4, K=1');
      expect(result.conversationPrompt).toContain('multimodal');
    });

    it('generates multimodal prompts for a four-way tie', () => {
      const result = generateAIPrompts({ V: 3, A: 3, R: 3, K: 3 });
      expect(result.systemPrompt).toContain('highly multimodal');
      expect(result.conversationPrompt).toContain('multimodal');
    });
  });

  describe('prompt quality constraints', () => {
    const allScenarios: { label: string; scores: VarkScores }[] = [
      { label: 'V dominant', scores: { V: 9, A: 2, R: 1, K: 1 } },
      { label: 'A dominant', scores: { V: 1, A: 10, R: 3, K: 2 } },
      { label: 'R dominant', scores: { V: 2, A: 1, R: 8, K: 3 } },
      { label: 'K dominant', scores: { V: 1, A: 2, R: 3, K: 11 } },
      { label: 'VA tie', scores: { V: 6, A: 6, R: 1, K: 0 } },
      { label: 'RK tie', scores: { V: 2, A: 1, R: 7, K: 7 } },
      { label: '3-way tie', scores: { V: 4, A: 4, R: 4, K: 1 } },
      { label: '4-way tie', scores: { V: 3, A: 3, R: 3, K: 3 } },
    ];

    for (const { label, scores } of allScenarios) {
      it(`${label}: system prompt contains no placeholders or ellipsis`, () => {
        const { systemPrompt } = generateAIPrompts(scores);
        expect(systemPrompt).not.toContain('[');
        expect(systemPrompt).not.toContain(']');
        expect(systemPrompt).not.toContain('...');
      });

      it(`${label}: conversation prompt contains no placeholders or ellipsis`, () => {
        const { conversationPrompt } = generateAIPrompts(scores);
        expect(conversationPrompt).not.toContain('[');
        expect(conversationPrompt).not.toContain(']');
        expect(conversationPrompt).not.toContain('...');
      });

      it(`${label}: both prompts are non-empty`, () => {
        const result = generateAIPrompts(scores);
        expect(result.systemPrompt.length).toBeGreaterThan(50);
        expect(result.conversationPrompt.length).toBeGreaterThan(20);
      });
    }
  });

  describe('edge cases', () => {
    it('handles all-zero scores without crashing', () => {
      const result = generateAIPrompts({ V: 0, A: 0, R: 0, K: 0 });
      expect(result.systemPrompt).toBeTruthy();
      expect(result.conversationPrompt).toBeTruthy();
    });

    it('handles maximum possible scores', () => {
      const result = generateAIPrompts({ V: 13, A: 0, R: 0, K: 0 });
      expect(result.systemPrompt).toContain('V=13');
      expect(result.systemPrompt).toContain('visual learner');
    });
  });
});
