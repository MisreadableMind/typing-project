import { useState, useCallback, useRef, useEffect } from 'react';
import { Mistake } from '../types';

interface TypingState {
  typed: string;
  correctChars: number;
  mistakes: Mistake[];
  isComplete: boolean;
  startTime: number | null;
  wpm: number;
  rawWpm: number;
  accuracy: number;
}

interface UseTypingOptions {
  text: string;
  onProgress?: (progress: number, wpm: number, accuracy: number) => void;
  onComplete?: (result: {
    wpm: number;
    rawWpm: number;
    accuracy: number;
    mistakes: Mistake[];
    timeMs: number;
  }) => void;
}

export function useTyping({ text, onProgress, onComplete }: UseTypingOptions) {
  const [state, setState] = useState<TypingState>({
    typed: '',
    correctChars: 0,
    mistakes: [],
    isComplete: false,
    startTime: null,
    wpm: 0,
    rawWpm: 0,
    accuracy: 100,
  });

  const textRef = useRef(text);
  const mistakesSetRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    textRef.current = text;
    reset();
  }, [text]);

  const calculateWpm = useCallback((
    correctChars: number,
    totalChars: number,
    elapsedMs: number
  ): { wpm: number; rawWpm: number } => {
    if (elapsedMs === 0) return { wpm: 0, rawWpm: 0 };

    const minutes = elapsedMs / 60000;
    const rawWpm = Math.round((totalChars / 5) / minutes);
    const wpm = Math.round((correctChars / 5) / minutes);

    return { wpm: Math.max(0, wpm), rawWpm: Math.max(0, rawWpm) };
  }, []);

  const handleInput = useCallback((value: string) => {
    const targetText = textRef.current;

    setState((prev) => {
      // Start timer on first input
      const startTime = prev.startTime ?? Date.now();
      const elapsedMs = Date.now() - startTime;

      // Calculate correct characters
      let correctChars = 0;
      const newMistakes: Mistake[] = [...prev.mistakes];

      for (let i = 0; i < value.length; i++) {
        if (i < targetText.length) {
          if (value[i] === targetText[i]) {
            correctChars++;
          } else if (!mistakesSetRef.current.has(i)) {
            mistakesSetRef.current.add(i);
            newMistakes.push({
              position: i,
              expected: targetText[i],
              actual: value[i],
            });
          }
        }
      }

      const accuracy = value.length > 0
        ? Math.round((correctChars / value.length) * 100)
        : 100;

      const { wpm, rawWpm } = calculateWpm(correctChars, value.length, elapsedMs);

      // Check completion
      const isComplete = value.length >= targetText.length &&
        value.slice(0, targetText.length) === targetText;

      // Notify progress
      if (onProgress) {
        const progress = Math.min(correctChars, targetText.length);
        onProgress(progress, wpm, accuracy);
      }

      // Notify completion
      if (isComplete && !prev.isComplete && onComplete) {
        onComplete({
          wpm,
          rawWpm,
          accuracy,
          mistakes: newMistakes,
          timeMs: elapsedMs,
        });
      }

      return {
        typed: value,
        correctChars,
        mistakes: newMistakes,
        isComplete,
        startTime,
        wpm,
        rawWpm,
        accuracy,
      };
    });
  }, [calculateWpm, onProgress, onComplete]);

  const reset = useCallback(() => {
    mistakesSetRef.current.clear();
    setState({
      typed: '',
      correctChars: 0,
      mistakes: [],
      isComplete: false,
      startTime: null,
      wpm: 0,
      rawWpm: 0,
      accuracy: 100,
    });
  }, []);

  return {
    ...state,
    handleInput,
    reset,
  };
}
