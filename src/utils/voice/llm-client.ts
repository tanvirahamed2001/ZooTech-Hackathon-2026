const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const FALLBACK_MESSAGE = "I'm running in local fallback mode. How can I help?";

export interface GetAIResponseOptions {
  model?: string;
  maxTokens?: number;
}

/** OpenAI-compatible response shape (OpenRouter, custom base URL, etc.) */
interface ChatCompletionResponse {
  choices?: Array<{ message?: { content?: string } }>;
}

/**
 * Call an LLM chat API. Supports:
 * - **OpenRouter** (default): set VITE_OPENROUTER_API_KEY.
 * - **Custom OpenAI-compatible base:** set VITE_LLM_BASE_URL to `https://<host>/v1`. Auth depends on deployment; see team docs.
 * Falls back to a local message if the provider is unavailable or the request fails.
 */
export async function getAIResponse(
  prompt: string,
  options: GetAIResponseOptions = {}
): Promise<string> {
  const baseUrl = (import.meta.env.VITE_LLM_BASE_URL as string | undefined)?.trim();
  const useCustomBase = baseUrl && baseUrl.length > 0;

  if (useCustomBase) {
    return getAIResponseOpenAICompat(baseUrl, prompt, options);
  }
  return getAIResponseOpenRouter(prompt, options);
}

/**
 * OpenAI-compatible endpoint at VITE_LLM_BASE_URL.
 */
async function getAIResponseOpenAICompat(
  baseUrl: string,
  prompt: string,
  options: GetAIResponseOptions
): Promise<string> {
  const url = `${baseUrl.replace(/\/$/, '')}/chat/completions`;
  const model = options.model ?? 'llama3.1-8B';
  const maxTokens = options.maxTokens ?? 1024;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens,
        stream: false,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`${url} ${res.status}: ${errText}`);
    }

    const data = (await res.json()) as ChatCompletionResponse;
    const content = data?.choices?.[0]?.message?.content;
    return typeof content === 'string' ? content.trim() : FALLBACK_MESSAGE;
  } catch (err) {
    console.warn('LLM (OpenAI-compat) request failed:', err);
    return FALLBACK_MESSAGE;
  }
}

/**
 * OpenRouter chat API. Requires VITE_OPENROUTER_API_KEY.
 */
async function getAIResponseOpenRouter(
  prompt: string,
  options: GetAIResponseOptions
): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY as string | undefined;
  if (!apiKey || apiKey.startsWith('sk-or-v1-your-key-here')) {
    console.warn('OpenRouter API key not set or placeholder; using fallback.');
    return FALLBACK_MESSAGE;
  }

  const model = options.model ?? 'google/gemini-2.0-flash-exp:free';
  const maxTokens = options.maxTokens ?? 1024;

  try {
    const res = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : '',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OpenRouter ${res.status}: ${errText}`);
    }

    const data = (await res.json()) as ChatCompletionResponse;
    const content = data?.choices?.[0]?.message?.content;
    return typeof content === 'string' ? content.trim() : FALLBACK_MESSAGE;
  } catch (err) {
    console.warn('OpenRouter request failed:', err);
    return FALLBACK_MESSAGE;
  }
}
