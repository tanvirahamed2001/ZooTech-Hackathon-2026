import type { VarkScores, AIPrompts } from '../types';

type VarkStyle = 'V' | 'A' | 'R' | 'K';

const STYLE_LABELS: Record<VarkStyle, string> = {
  V: 'Visual',
  A: 'Auditory',
  R: 'Read/Write',
  K: 'Kinesthetic',
};

const STYLE_DESCRIPTIONS: Record<VarkStyle, string> = {
  V: 'visual',
  A: 'auditory',
  R: 'read/write',
  K: 'kinesthetic',
};

const SYSTEM_INSTRUCTIONS: Record<VarkStyle, { communication: string; structure: string; checkIn: string }> = {
  V: {
    communication:
      'Structure every response with clear headers, sub-headers, and bullet points instead of dense paragraphs. Use tables, diagrams (ASCII or described), flowcharts, and spatial metaphors whenever they can clarify a concept.',
    structure:
      'Favour visual hierarchy — indent, bold key terms, and separate ideas with whitespace so the page layout itself communicates structure.',
    checkIn:
      'When I seem stuck, offer a diagram, visual analogy, or restructured layout to reframe the idea.',
  },
  A: {
    communication:
      'Use conversational, spoken-style language. Explain concepts as if you are walking me through them out loud — use rhetorical questions, verbal analogies, and storytelling to make ideas stick.',
    structure:
      'Avoid dry bullet lists when a flowing narrative would be clearer. Write the way a great teacher speaks.',
    checkIn:
      'When I seem stuck, re-explain using a different verbal framing or a fresh analogy.',
  },
  R: {
    communication:
      'Use precise written definitions, labelled terminology, and numbered lists. Provide structured summaries with clear headings and sub-points so information reads like well-organised reference material.',
    structure:
      'Prioritise accuracy of wording — define terms before using them and provide written outlines for complex topics.',
    checkIn:
      'When I seem stuck, offer a definitions-first restatement or a written outline of the key points.',
  },
  K: {
    communication:
      'Lead with a concrete, real-world example or hands-on scenario before introducing any theory. Frame every explanation around doing — "here\'s how you\'d apply this" — rather than abstract description.',
    structure:
      'Provide step-by-step practical exercises, worked examples, or "try this now" activities wherever possible.',
    checkIn:
      'When I seem stuck, offer a different practical example or a step-by-step exercise I can work through.',
  },
};

const CONVERSATION_PREFERENCE: Record<VarkStyle, string> = {
  V: 'I understand best through diagrams, charts, visual hierarchy, and structured layouts',
  A: 'I learn best through conversational explanations, verbal walkthroughs, and spoken-style analogies',
  R: 'I learn best through precise definitions, numbered lists, structured text, and written summaries',
  K: 'I learn best through real-world examples, hands-on exercises, and step-by-step practical walkthroughs',
};

function getDominantStyles(scores: VarkScores): VarkStyle[] {
  const max = Math.max(scores.V, scores.A, scores.R, scores.K);
  return (['V', 'A', 'R', 'K'] as const).filter(k => scores[k] === max);
}

function formatScores(scores: VarkScores): string {
  return `V=${scores.V}, A=${scores.A}, R=${scores.R}, K=${scores.K}`;
}

function buildSystemPrompt(scores: VarkScores): string {
  const dominant = getDominantStyles(scores);
  const scoreString = formatScores(scores);

  if (dominant.length >= 3) {
    return buildMultimodalThreePlusSystem(scores, dominant, scoreString);
  }
  if (dominant.length === 2) {
    return buildDualStyleSystem(scores, dominant, scoreString);
  }
  return buildSingleStyleSystem(scores, dominant[0], scoreString);
}

function buildSingleStyleSystem(scores: VarkScores, style: VarkStyle, scoreString: string): string {
  const instructions = SYSTEM_INSTRUCTIONS[style];
  return [
    `I am a ${STYLE_DESCRIPTIONS[style]} learner (VARK: ${scoreString}).`,
    '',
    instructions.communication,
    '',
    instructions.structure,
    '',
    instructions.checkIn,
  ].join('\n');
}

function buildDualStyleSystem(scores: VarkScores, dominant: VarkStyle[], scoreString: string): string {
  const [a, b] = dominant;
  const labelA = STYLE_DESCRIPTIONS[a];
  const labelB = STYLE_DESCRIPTIONS[b];
  const insA = SYSTEM_INSTRUCTIONS[a];
  const insB = SYSTEM_INSTRUCTIONS[b];

  return [
    `I am a ${labelA}-${labelB} learner (VARK: ${scoreString}).`,
    '',
    `${insA.communication} ${insB.communication}`,
    '',
    `${insA.structure} ${insB.structure}`,
    '',
    `When I seem stuck, try both: ${insA.checkIn.replace('When I seem stuck, ', '')} Alternatively, ${insB.checkIn.replace('When I seem stuck, ', '').charAt(0).toLowerCase()}${insB.checkIn.replace('When I seem stuck, ', '').slice(1)}`,
  ].join('\n');
}

function buildMultimodalThreePlusSystem(scores: VarkScores, dominant: VarkStyle[], scoreString: string): string {
  const styleList = dominant.map(s => STYLE_DESCRIPTIONS[s]).join(', ');

  return [
    `I am a highly multimodal learner with strengths in ${styleList} (VARK: ${scoreString}).`,
    '',
    'Vary your response format freely — mix visual structure (headers, bullet points, tables) with conversational explanations, precise written definitions, and concrete real-world examples. Match the format to whatever makes each concept clearest.',
    '',
    'Don\'t lock into one communication style. Switch between diagrams, narratives, structured lists, and hands-on exercises depending on the topic.',
    '',
    'When I seem stuck, try reframing with a completely different format — a diagram if you used prose, a practical example if you used a list, or a verbal walkthrough if you used a table.',
  ].join('\n');
}

function buildConversationPrompt(scores: VarkScores): string {
  const dominant = getDominantStyles(scores);

  if (dominant.length >= 3) {
    return `I'm a multimodal learner (VARK: ${formatScores(scores)}) — I learn through a mix of visual, verbal, written, and hands-on approaches. Please vary your format to match whatever makes each concept clearest.`;
  }

  if (dominant.length === 2) {
    const [a, b] = dominant;
    const prefA = CONVERSATION_PREFERENCE[a];
    const prefB = CONVERSATION_PREFERENCE[b];
    return `I'm a ${STYLE_LABELS[a]}-${STYLE_LABELS[b]} learner — ${prefA}, and ${prefB.charAt(0).toLowerCase()}${prefB.slice(1)}. Please adapt your responses to blend both styles.`;
  }

  const style = dominant[0];
  return `I'm a ${STYLE_LABELS[style]} learner — ${CONVERSATION_PREFERENCE[style]}. Please adapt your responses to match this style.`;
}

export function generateAIPrompts(scores: VarkScores): AIPrompts {
  return {
    systemPrompt: buildSystemPrompt(scores),
    conversationPrompt: buildConversationPrompt(scores),
  };
}
