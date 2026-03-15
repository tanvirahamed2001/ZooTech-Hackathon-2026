import type { Question } from '../../types';
import { getAIResponse } from './llm-client';

const OPTION_IDS_KEY = 'optionIds';

/**
 * Build a prompt for the LLM to map a user's natural-language answer to VARK option IDs.
 */
function buildPrompt(question: Question, transcript: string): string {
  const optionsText = question.options
    .map((o) => `- ${o.id}: ${o.text}`)
    .join('\n');

  return `You are mapping a user's spoken answer to a multiple-choice VARK learning-style question. The user may describe one or more of the options (additive scoring). Pick all that apply; if unclear, pick the single closest match.

Question: ${question.scenario}

Options:
${optionsText}

User said: "${transcript}"

Reply with ONLY a JSON object of this form, no other text: {"${OPTION_IDS_KEY}": ["id1", "id2"]}
Use the option IDs exactly as listed (e.g. "1V", "2K"). If nothing applies, use an empty array: {"${OPTION_IDS_KEY}": []}`;
}

/**
 * Parse LLM response for option IDs. Tolerates markdown code blocks and extra text.
 */
function parseOptionIds(raw: string, question: Question): string[] {
  const validIds = new Set(question.options.map((o) => o.id));
  let jsonStr = raw.trim();
  const codeBlock = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlock) {
    jsonStr = codeBlock[1].trim();
  }
  const objMatch = jsonStr.match(/\{[^}]*\}/);
  if (objMatch) {
    jsonStr = objMatch[0];
  }
  try {
    const parsed = JSON.parse(jsonStr) as Record<string, unknown>;
    const ids = parsed[OPTION_IDS_KEY];
    if (!Array.isArray(ids)) return [];
    return ids.filter((id): id is string => typeof id === 'string' && validIds.has(id));
  } catch {
    return [];
  }
}

/**
 * Infer VARK option IDs for a question from the user's transcript using the LLM.
 */
export async function inferVarkFromTranscript(
  question: Question,
  transcript: string
): Promise<string[]> {
  const trimmed = transcript.trim();
  if (!trimmed) return [];

  const prompt = buildPrompt(question, trimmed);
  const response = await getAIResponse(prompt, { maxTokens: 256 });
  return parseOptionIds(response, question);
}
