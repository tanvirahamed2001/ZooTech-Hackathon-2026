import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useQuiz } from '../../contexts/QuizContext';
import { questions } from '../../data/questions';
import {
  transcribeWeb,
  speakWeb,
  playPregeneratedQuestion,
  playPregeneratedConfirmation,
  playConfirmationBeep,
  speakWithBrowserFallback,
  stopSpeechPlayback,
  resumeAudioForPlayback,
  prewarmVoiceTts,
  stripMarkdownForTts,
  startWebSpeechCapture,
  stopWebSpeechCaptureAndGetTranscript,
} from '../../utils/voice/web-ai-engine';
import { inferVarkFromTranscript } from '../../utils/voice/vark-mapper';
import ProgressBar from './ProgressBar';
import ThemeToggle from '../shared/ThemeToggle';

console.warn('[voice] VoiceQuizQuestions chunk loaded (pregenerated path active)');

const STYLE_NAMES: Record<string, string> = {
  V: 'Visual',
  A: 'Auditory',
  R: 'Read/Write',
  K: 'Kinesthetic',
};

type VoiceStatus = 'idle' | 'preparing' | 'speaking' | 'listening' | 'thinking' | 'answered';

type VoiceQuizQuestionsProps = {
  registerClearTimeouts?: (fn: () => void) => void;
};

const VoiceQuizQuestions: React.FC<VoiceQuizQuestionsProps> = ({ registerClearTimeouts }) => {
  const { quizState, goToNextQuestion, goToPreviousQuestion, setQuestionAnswers } = useQuiz();
  const [status, setStatus] = useState<VoiceStatus>('idle');
  const [thinkingPhase, setThinkingPhase] = useState<string>('');
  const [lastTranscript, setLastTranscript] = useState('');
  const [lastMappedNames, setLastMappedNames] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const hasSpokenRef = useRef(false);
  const keyHeldRef = useRef(false);
  const isPlayingRef = useRef(false);
  const nextQuestionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recordingProcessedRef = useRef(false);
  const scheduledAdvanceForQuestionIdRef = useRef<number | null>(null);
  const recordingStartingRef = useRef(false);
  const recordingStartTimeRef = useRef<number>(0);
  const MIN_RECORDING_MS = 700;
  const [scheduleAutoplay, setScheduleAutoplay] = useState(false);
  const [micStarting, setMicStarting] = useState(false);
  const autoplayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speakQuestionRef = useRef<() => Promise<void>>(() => Promise.resolve());

  const currentIndex = quizState.currentQuestionIndex;
  const currentQuestion = currentIndex >= 0 && currentIndex < questions.length
    ? questions[currentIndex]
    : null;
  const currentQuestionIdRef = useRef<number | null>(null);
  currentQuestionIdRef.current = currentQuestion?.id ?? null;

  // Start loading the TTS model as soon as the questions screen is shown.
  useEffect(() => {
    prewarmVoiceTts().catch(() => {});
  }, []);

  // Clear previous question's transcript when switching to a new question so we don't show stale "You said" / "We heard".
  useEffect(() => {
    setLastTranscript('');
    setLastMappedNames([]);
  }, [currentIndex]);

  // When we just advanced (scheduleAutoplay true), wait 1.5s then play the new question. State ensures this runs once per advance.
  useEffect(() => {
    if (!currentQuestion || !scheduleAutoplay) return;
    hasSpokenRef.current = false;
    setScheduleAutoplay(false);
    if (autoplayTimeoutRef.current) {
      clearTimeout(autoplayTimeoutRef.current);
      autoplayTimeoutRef.current = null;
    }
    autoplayTimeoutRef.current = setTimeout(() => {
      autoplayTimeoutRef.current = null;
      speakQuestionRef.current?.();
    }, 1500);
  }, [currentIndex, currentQuestion, scheduleAutoplay]);


  const [preferredVoice, setPreferredVoice] = useState<SpeechSynthesisVoice | null>(null);
  useEffect(() => {
    const load = () => {
      const voices = window.speechSynthesis.getVoices();
      const en = voices.find((v) => v.lang.startsWith('en') && v.localService) ?? voices.find((v) => v.lang.startsWith('en'));
      setPreferredVoice(en ?? voices[0] ?? null);
    };
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const speakWithFallback = useCallback((text: string, onEnd?: () => void) => {
    speakWithBrowserFallback(text, preferredVoice, onEnd);
  }, [preferredVoice]);

  const stopPlayback = useCallback(() => {
    isPlayingRef.current = false;
    stopSpeechPlayback();
    setStatus('idle');
  }, []);

  const stopPlaybackRef = useRef(stopPlayback);
  stopPlaybackRef.current = stopPlayback;

  const advanceToNextQuestion = useCallback(() => {
    if (nextQuestionTimeoutRef.current) {
      clearTimeout(nextQuestionTimeoutRef.current);
      nextQuestionTimeoutRef.current = null;
    }
    setThinkingPhase('');
    setStatus('idle');
    const scheduledFor = scheduledAdvanceForQuestionIdRef.current;
    scheduledAdvanceForQuestionIdRef.current = null;
    if (scheduledFor !== null && currentQuestionIdRef.current === scheduledFor) {
      setScheduleAutoplay(true);
      goToNextQuestion();
    }
  }, [goToNextQuestion]);

  const clearTimeoutsRef = useRef<() => void>(() => {});
  clearTimeoutsRef.current = () => {
    if (nextQuestionTimeoutRef.current) {
      clearTimeout(nextQuestionTimeoutRef.current);
      nextQuestionTimeoutRef.current = null;
    }
    if (autoplayTimeoutRef.current) {
      clearTimeout(autoplayTimeoutRef.current);
      autoplayTimeoutRef.current = null;
    }
    scheduledAdvanceForQuestionIdRef.current = null;
  };
  useEffect(() => {
    registerClearTimeouts?.(() => clearTimeoutsRef.current());
    return () => {
      registerClearTimeouts?.(() => {});
      // Do not call stopPlayback here: React StrictMode remounts this tree once on
      // first paint, which would cancel the pregenerated audio started on "Start voice quiz".
      if (nextQuestionTimeoutRef.current) clearTimeout(nextQuestionTimeoutRef.current);
      if (autoplayTimeoutRef.current) {
        clearTimeout(autoplayTimeoutRef.current);
        autoplayTimeoutRef.current = null;
      }
    };
  }, [registerClearTimeouts]);

  const speakQuestion = useCallback(async () => {
    if (!currentQuestion) return;
    if (isPlayingRef.current) return;
    isPlayingRef.current = true;
    setError(null);
    setStatus('preparing');
    const fullText = `${stripMarkdownForTts(currentQuestion.scenario)} Answer in your own words.`;
    let fallbackPlaying = false;
    try {
      await resumeAudioForPlayback();
      const onStart = () => setStatus('speaking');
      const usedPregenerated = await playPregeneratedQuestion(currentIndex, onStart);
      if (!usedPregenerated) {
        await speakWeb(fullText, { onPlaybackStart: onStart });
      }
      hasSpokenRef.current = true;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('TTS error:', err);
      try {
        setStatus('speaking');
        speakWithFallback(fullText, () => {
          isPlayingRef.current = false;
          setStatus('idle');
        });
        setError(`Playing with browser voice (AI voice failed: ${message}). Press Esc or Stop to stop.`);
        hasSpokenRef.current = true;
        fallbackPlaying = true;
        return;
      } catch {
        setError('Could not play the question. You can still use the text below.');
      }
    } finally {
      if (!fallbackPlaying) {
        isPlayingRef.current = false;
        setStatus('idle');
      }
    }
  }, [currentQuestion, currentIndex, speakWithFallback]);

  useEffect(() => {
    speakQuestionRef.current = speakQuestion;
  }, [speakQuestion]);

  const startRecording = useCallback(async () => {
    if (recordingStartingRef.current) return;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') return;
    recordingStartingRef.current = true;
    setMicStarting(true);
    setError(null);
    recordingProcessedRef.current = false;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      chunksRef.current = [];

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = async () => {
        recordingStartingRef.current = false;
        setMicStarting(false);
        if (recordingProcessedRef.current) return;
        recordingProcessedRef.current = true;
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        mediaRecorderRef.current = null;
        const durationMs = Date.now() - recordingStartTimeRef.current;
        if (chunksRef.current.length === 0 || durationMs < MIN_RECORDING_MS) {
          setStatus('idle');
          if (durationMs > 0 && durationMs < MIN_RECORDING_MS) {
            setError('Hold the button a bit longer to record (about 1 second).');
          }
          return;
        }
        if (nextQuestionTimeoutRef.current) {
          clearTimeout(nextQuestionTimeoutRef.current);
          nextQuestionTimeoutRef.current = null;
        }
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setStatus('thinking');
        setLastTranscript('');
        setLastMappedNames([]);
        setThinkingPhase('Transcribing your answer…');
        let answered = false;
        try {
          const webSpeechText = await stopWebSpeechCaptureAndGetTranscript();
          const text = (webSpeechText && webSpeechText.trim()) ? webSpeechText.trim() : await transcribeWeb(blob);
          setLastTranscript(text || '(no speech detected)');
          if (!text?.trim()) {
            setQuestionAnswers(currentQuestion!.id, []);
            goToNextQuestion();
            setStatus('idle');
            setThinkingPhase('');
            return;
          }
          setThinkingPhase('Matching your answer to options…');
          const optionIds = await inferVarkFromTranscript(currentQuestion!, text);
          setQuestionAnswers(currentQuestion!.id, optionIds);
          const names = optionIds
            .map((id) => currentQuestion!.options.find((o) => o.id === id)?.type)
            .filter(Boolean) as string[];
          setLastMappedNames(names.map((t) => STYLE_NAMES[t] ?? t));
          setThinkingPhase('Got it!');
          await resumeAudioForPlayback();
          let played = await playPregeneratedConfirmation();
          if (!played) {
            try {
              await speakWeb('Got it.');
              played = true;
            } catch {
              try {
                await new Promise<void>((resolve) => {
                  speakWithFallback('Got it.', resolve);
                });
                played = true;
              } catch {
                // ignore
              }
            }
          }
          if (!played) {
            await playConfirmationBeep();
          }
          setStatus('answered');
          setThinkingPhase('');
          scheduledAdvanceForQuestionIdRef.current = currentQuestion!.id;
          nextQuestionTimeoutRef.current = setTimeout(advanceToNextQuestion, 2500);
          answered = true;
        } catch (err) {
          console.error('Voice processing error:', err);
          const message = err instanceof Error ? err.message : String(err);
          setError(message.includes('decode') ? 'Recording could not be processed. Try speaking a bit longer, then release, or skip.' : 'Something went wrong. You can try again or skip.');
        } finally {
          if (!answered) setStatus('idle');
          setThinkingPhase('');
        }
      };

      startWebSpeechCapture();
      mr.start();
      recordingStartTimeRef.current = Date.now();
      setMicStarting(false);
      setStatus('listening');
    } catch (err) {
      recordingStartingRef.current = false;
      setMicStarting(false);
      console.error('Mic error:', err);
      setError('Microphone access is needed. Please allow and try again.');
      setStatus('idle');
    }
  }, [currentQuestion, setQuestionAnswers, goToNextQuestion, advanceToNextQuestion, speakWeb, speakWithFallback]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  // Keyboard: Esc always stops playback (no ref check); Space = hold to speak. Window + capture so we run first.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        e.preventDefault();
        e.stopPropagation();
        stopPlaybackRef.current();
        return;
      }
      if (e.key === ' ' || e.key === 'Spacebar') {
        if (e.repeat) return;
        if (status === 'answered') {
          e.preventDefault();
          e.stopPropagation();
          advanceToNextQuestion();
          return;
        }
        if (!keyHeldRef.current) {
          if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || (e.target as HTMLElement).isContentEditable) return;
          if (status === 'idle') {
            keyHeldRef.current = true;
            e.preventDefault();
            startRecording();
          }
        }
        return;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        e.preventDefault();
        e.stopPropagation();
        stopPlaybackRef.current();
        return;
      }
      if (e.key !== ' ') return;
      if (keyHeldRef.current) {
        keyHeldRef.current = false;
        e.preventDefault();
        stopRecording();
      }
    };
    const capture = true;
    window.addEventListener('keydown', handleKeyDown, capture);
    window.addEventListener('keyup', handleKeyUp, capture);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, capture);
      window.removeEventListener('keyup', handleKeyUp, capture);
    };
  }, [status, startRecording, stopRecording, advanceToNextQuestion]);

  const clearTimeouts = useCallback(() => {
    if (autoplayTimeoutRef.current) {
      clearTimeout(autoplayTimeoutRef.current);
      autoplayTimeoutRef.current = null;
    }
    if (nextQuestionTimeoutRef.current) {
      clearTimeout(nextQuestionTimeoutRef.current);
      nextQuestionTimeoutRef.current = null;
    }
  }, []);

  const handleSkip = useCallback(() => {
    if (!currentQuestion) return;
    stopSpeechPlayback();
    clearTimeoutsRef.current();
    clearTimeouts();
    setQuestionAnswers(currentQuestion.id, []);
    setLastTranscript('');
    setLastMappedNames([]);
    setError(null);
    hasSpokenRef.current = false;
    goToNextQuestion();
    setScheduleAutoplay(true);
  }, [currentQuestion, setQuestionAnswers, goToNextQuestion, clearTimeouts]);

  useEffect(() => {
    registerClearTimeouts?.(clearTimeouts);
    return () => { registerClearTimeouts?.(() => {}); };
  }, [registerClearTimeouts, clearTimeouts]);

  const handleNav = useCallback((action: () => void) => {
    clearTimeouts();
    clearTimeoutsRef.current();
    stopPlayback();
    action();
  }, [clearTimeouts, stopPlayback]);

  if (!currentQuestion) {
    return null;
  }

  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen">
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Nav first so it's always visible; sticky under any header */}
        <nav
          className="sticky top-14 z-30 mb-4 py-3 px-3 rounded-lg bg-violet-100 dark:bg-violet-900/60 border-2 border-violet-300 dark:border-violet-600 shadow"
          aria-label="Previous and next question"
        >
          <p className="text-center text-xs font-semibold text-violet-800 dark:text-violet-200 mb-2">Step</p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            <button
              type="button"
              onClick={() => handleNav(goToPreviousQuestion)}
              disabled={currentIndex <= 0}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-white dark:bg-gray-800 border-2 border-violet-400 text-violet-800 dark:text-violet-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-violet-200 dark:hover:bg-violet-800 min-w-[100px]"
            >
              ← Prev
            </button>
            <button
              type="button"
              onClick={() => handleNav(goToNextQuestion)}
              disabled={currentIndex >= questions.length - 1}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-white dark:bg-gray-800 border-2 border-violet-400 text-violet-800 dark:text-violet-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-violet-200 dark:hover:bg-violet-800 min-w-[100px]"
            >
              Next →
            </button>
          </div>
        </nav>
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Question {currentIndex + 1} of {questions.length}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">{Math.round(progress)}% complete</p>
          </div>
          <ProgressBar current={currentIndex} total={questions.length} />
        </div>

        <motion.div
          className="card p-6 mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <p className="text-gray-800 dark:text-gray-100 text-lg leading-relaxed mb-6">
            {currentQuestion.scenario}
          </p>

          <div className="flex flex-col items-center gap-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {status === 'thinking' && thinkingPhase
                ? <span className="animate-pulse">{thinkingPhase}</span>
                : <><span>Status: </span><strong>{status}</strong></>
              }
            </p>
            <div className="flex gap-3 flex-wrap justify-center items-center">
              {status === 'answered' ? (
                <motion.button
                  type="button"
                  onClick={() => {
                    scheduledAdvanceForQuestionIdRef.current = currentQuestion.id;
                    advanceToNextQuestion();
                  }}
                  className="px-5 py-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-sm"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Next question →
                </motion.button>
              ) : status === 'speaking' || status === 'preparing' ? (
                <motion.button
                  type="button"
                  onClick={stopPlayback}
                  className="px-4 py-2 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 text-sm font-medium"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {status === 'preparing' ? 'Cancel loading/playback' : 'Stop playback'}
                </motion.button>
              ) : (
                <motion.button
                  type="button"
                  onClick={() => speakQuestion()}
                  className="px-4 py-2 rounded-lg bg-violet-100 dark:bg-violet-900/30 text-violet-800 dark:text-violet-200 text-sm font-medium cursor-pointer"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={status !== 'idle'}
                >
                  {hasSpokenRef.current ? 'Play question again' : 'Play question'}
                </motion.button>
              )}
              {status === 'listening' ? (
                <motion.button
                  type="button"
                  onClick={stopRecording}
                  className="px-6 py-3 rounded-full font-medium text-white bg-red-500 hover:bg-red-600"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Stop recording
                </motion.button>
              ) : micStarting ? (
                <motion.button
                  type="button"
                  disabled
                  className="px-6 py-3 rounded-full font-medium text-white bg-amber-500 cursor-wait"
                  aria-busy="true"
                >
                  Getting mic…
                </motion.button>
              ) : (
                <motion.button
                  type="button"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (status !== 'idle') return;
                    startRecording();
                  }}
                  onPointerUp={(e) => { e.preventDefault(); stopRecording(); }}
                  onPointerLeave={(e) => { e.preventDefault(); stopRecording(); }}
                  onPointerCancel={(e) => { e.preventDefault(); stopRecording(); }}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    if (status !== 'idle') return;
                    startRecording();
                  }}
                  onTouchEnd={(e) => { e.preventDefault(); stopRecording(); }}
                  onTouchCancel={(e) => { e.preventDefault(); stopRecording(); }}
                  onContextMenu={(e) => e.preventDefault()}
                  className="px-6 py-3 rounded-full font-medium text-white bg-violet-600 hover:bg-violet-700 dark:bg-violet-500 dark:hover:bg-violet-600 select-none touch-none"
                  style={{ touchAction: 'none' }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={status === 'speaking' || status === 'thinking' || status === 'preparing' || status === 'answered'}
                >
                  Hold to speak
                </motion.button>
              )}
              <motion.button
                type="button"
                onClick={handleSkip}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 text-sm"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={status !== 'idle'}
              >
                Skip
              </motion.button>
            </div>
            {error && (
              <div className="flex flex-col gap-2">
                <p className="text-sm text-amber-600 dark:text-amber-400">{error}</p>
                {error.includes('AI voice failed') && currentQuestion && (
                  <motion.button
                    type="button"
                    onClick={() => {
                      const text = `${stripMarkdownForTts(currentQuestion.scenario)} Answer in your own words.`;
                      stopSpeechPlayback();
                      setStatus('speaking');
                      speakWithFallback(text, () => setStatus('idle'));
                    }}
                    className="px-4 py-2 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 text-sm font-medium w-fit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Play with browser voice
                  </motion.button>
                )}
              </div>
            )}
            {lastTranscript && (
              <div className="w-full text-left text-sm">
                <p className="text-gray-500 dark:text-gray-400">You said:</p>
                <p className="text-gray-800 dark:text-gray-100 mt-1">{lastTranscript}</p>
              </div>
            )}
            {lastMappedNames.length > 0 && (
              <p className="text-sm text-gray-600 dark:text-gray-300">
                We heard: {lastMappedNames.join(', ')}
              </p>
            )}
          </div>
        </motion.div>

        <p className="text-center text-gray-500 dark:text-gray-400 text-xs">
          {status === 'answered'
            ? 'Advancing in 3s, or press Space / click "Next question →" now.'
            : 'Click "Play question" to hear it; Esc or "Stop playback" to stop. Hold Space or the mic button to speak. You can skip anytime.'}
        </p>
      </div>
    </div>
  );
};

export default VoiceQuizQuestions;
