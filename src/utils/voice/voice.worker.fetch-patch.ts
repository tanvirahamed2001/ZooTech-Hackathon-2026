/**
 * Must run before @huggingface/transformers is loaded so the library uses our patched fetch/XHR.
 * Import this first in voice.worker.ts.
 */

let modelBaseUrl = 'https://huggingface.co/';

export function setModelBaseUrl(url: string | undefined): void {
  const raw = url && typeof url === 'string' ? url : '';
  const isAbsolute =
    raw.startsWith('https://') || raw.startsWith('http://localhost') || raw.startsWith('http://127.0.0.1');
  modelBaseUrl = isAbsolute ? raw.replace(/\/?$/, '/') : 'https://huggingface.co/';
}

export function getModelBaseUrl(): string {
  return modelBaseUrl;
}

type FetchDebug = (url: string, rewritten: string | null) => void;
let fetchDebugCallback: FetchDebug | null = null;
export function setFetchDebugCallback(cb: FetchDebug | null): void {
  fetchDebugCallback = cb;
}

function rewriteModelUrl(url: string): { url: string; rewritten: string | null } {
  const base = modelBaseUrl.replace(/\/$/, '');
  // Already pointing at our proxy path — don't rewrite (avoids voice-models/voice-models/...).
  const baseWithSlash = base.endsWith('/') ? base : base + '/';
  if (base !== 'https://huggingface.co' && (url.startsWith(baseWithSlash) || url.startsWith(base + '/'))) {
    return { url, rewritten: null };
  }
  const looksLikeModelPath =
    /(onnx-community|Xenova|resolve\/|huggingface\.co)/i.test(url) || url.endsWith('.json') || url.endsWith('.onnx');
  const isRelative = url.startsWith('/') && !url.startsWith('//');
  const isSameOrigin = typeof self.location !== 'undefined' && url.startsWith(self.location.origin);
  // When using local proxy, rewrite Hugging Face URLs too (library may use its own env.remoteHost).
  const isHfUrl = /^https?:\/\/([^/]*\.)?huggingface\.co\//i.test(url);
  let path: string | null = null;
  if (looksLikeModelPath && isRelative) {
    path = url;
  } else if (looksLikeModelPath && isSameOrigin) {
    path = url.slice(self.location.origin.length) || '/';
  } else if (looksLikeModelPath && isHfUrl && base !== 'https://huggingface.co') {
    try {
      const u = new URL(url);
      path = u.pathname.startsWith('/') ? u.pathname : '/' + u.pathname;
    } catch {
      path = url.replace(/^https?:\/\/[^/]+/i, '');
    }
  }
  if (path !== null && base !== 'https://huggingface.co') {
    const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
    const final = (base.endsWith('/') ? base : base + '/') + normalizedPath;
    return { url: final, rewritten: final };
  }
  if (isRelative && base !== 'https://huggingface.co') {
    return { url: base + url, rewritten: base + url };
  }
  return { url, rewritten: null };
}

const originalFetch = self.fetch;
self.fetch = function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  let url: string;
  if (typeof input === 'string') {
    url = input;
  } else if (input instanceof Request) {
    url = input.url;
  } else {
    url = input.href;
  }
  const { url: finalUrl, rewritten } = rewriteModelUrl(url);
  if (rewritten) {
    input = finalUrl;
    fetchDebugCallback?.(url, rewritten);
  }
  return originalFetch.call(self, input, init);
};

// Some environments use XMLHttpRequest for JSON; intercept it too.
const origOpen = self.XMLHttpRequest.prototype.open;
self.XMLHttpRequest.prototype.open = function (
  this: XMLHttpRequest,
  method: string,
  url: string,
  async?: boolean,
  user?: string,
  password?: string,
) {
  const { url: finalUrl, rewritten } = rewriteModelUrl(url);
  if (rewritten) {
    fetchDebugCallback?.(url, rewritten);
    return origOpen.call(this, method, finalUrl, async ?? true, user, password);
  }
  return origOpen.call(this, method, url, async ?? true, user, password);
};

// Notify main thread that patch ran (so we see it in Console).
self.postMessage({ type: 'VOICE_FETCH_DEBUG', url: '(patch applied)', rewritten: null });
