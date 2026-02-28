/**
 * Hook para transcrição de voz (Speech-to-Text) no Portal do Agente.
 * Usa Web Speech API (SpeechRecognition / webkitSpeechRecognition).
 * Retorna isSupported, isListening, toggle e callback onResult para inserir texto no campo.
 */

import { useState, useCallback, useRef, useEffect } from "react";

const SpeechRecognition =
  typeof window !== "undefined" &&
  (window.SpeechRecognition || window.webkitSpeechRecognition);

const SILENCE_TIMEOUT_MS = 4000;
const DEFAULT_LANG = "pt-BR";

export function useSpeechRecognition(options = {}) {
  const { lang = DEFAULT_LANG, onResult, onError } = options;
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);

  const isSupported = Boolean(SpeechRecognition);

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    clearSilenceTimer();
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
    } catch (_) {}
    recognitionRef.current = null;
    setIsListening(false);
  }, [clearSilenceTimer]);

  const start = useCallback(() => {
    if (!SpeechRecognition || !onResult) return;
    setError(null);
    clearSilenceTimer();

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = lang;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event) => {
        let chunk = "";
        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal && result[0]) {
            chunk += result[0].transcript;
          }
        }
        if (chunk.trim()) {
          onResult(chunk.trim() + (chunk.endsWith(" ") ? "" : " "));
          silenceTimerRef.current = setTimeout(stop, SILENCE_TIMEOUT_MS);
        }
      };

      recognition.onend = () => {
        recognitionRef.current = null;
        setIsListening(false);
        clearSilenceTimer();
      };

      recognition.onerror = (event) => {
        const msg = event.error === "not-allowed" ? "Microfone não autorizado." : event.error === "no-speech" ? "Nenhuma fala detectada." : event.error;
        setError(msg);
        onError?.(msg);
        recognitionRef.current = null;
        setIsListening(false);
        clearSilenceTimer();
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
    } catch (err) {
      setError(err?.message ?? "Erro ao iniciar reconhecimento de voz.");
      onError?.(err);
      setIsListening(false);
    }
  }, [lang, onResult, onError, stop, clearSilenceTimer]);

  const toggle = useCallback(() => {
    if (isListening) stop();
    else start();
  }, [isListening, start, stop]);

  useEffect(() => {
    return () => {
      clearSilenceTimer();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
        recognitionRef.current = null;
      }
    };
  }, [clearSilenceTimer]);

  return { isSupported, isListening, start, stop, toggle, error };
}
