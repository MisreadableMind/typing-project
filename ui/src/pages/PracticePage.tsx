import { useState, useCallback, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useTyping } from '../hooks/useTyping';
import { api } from '../api/client';
import { Header } from '../components/Header';
import { TypingComposer } from '../components/TypingComposer';
import { ProgressBar } from '../components/ProgressBar';
import { Text, Mistake } from '../types';

interface SessionResult {
  wpm: number;
  rawWpm: number;
  accuracy: number;
  mistakes: Mistake[];
  timeMs: number;
}

interface UserStats {
  totalSessions: number;
  averageWpm: number;
  bestWpm: number;
  averageAccuracy: number;
  totalTimeMinutes: number;
}

interface MistakeAnalysis {
  totalMistakes: number;
  characterBreakdown: { char: string; count: number; percentage: number }[];
  confusionPairs: { expected: string; typed: string; count: number }[];
  weakestCharacters: string[];
  recentTrend: 'improving' | 'declining' | 'stable';
}

export function PracticePage() {
  useAuthStore(); // Ensure user is authenticated
  const [texts, setTexts] = useState<Text[]>([]);
  const [currentText, setCurrentText] = useState<Text | null>(null);
  const [difficulty, setDifficulty] = useState<string>('medium');
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [sessionResult, setSessionResult] = useState<SessionResult | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [mistakeAnalysis, setMistakeAnalysis] = useState<MistakeAnalysis | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [isGeneratingTargeted, setIsGeneratingTargeted] = useState(false);

  // Fetch texts and stats on mount
  useEffect(() => {
    fetchTexts();
    fetchStats();
    fetchMistakeAnalysis();
  }, []);

  const fetchTexts = async () => {
    try {
      const response = await api.get<Text[]>('/api/texts');
      setTexts(response.data);
    } catch (error) {
      console.error('Failed to fetch texts:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get<UserStats>('/api/sessions/stats');
      setUserStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchMistakeAnalysis = async () => {
    try {
      const response = await api.get<MistakeAnalysis>('/api/sessions/mistakes');
      setMistakeAnalysis(response.data);
    } catch (error) {
      console.error('Failed to fetch mistake analysis:', error);
    }
  };

  const generateTargetedPractice = async () => {
    if (!mistakeAnalysis?.weakestCharacters.length) return;

    setIsGeneratingTargeted(true);
    try {
      const response = await api.post<{ text: Text }>('/api/texts/generate-targeted', {
        characters: mistakeAnalysis.weakestCharacters,
      });
      if (response.data?.text) {
        await startPractice(response.data.text);
        fetchTexts();
      }
    } catch (error) {
      console.error('Failed to generate targeted practice:', error);
    } finally {
      setIsGeneratingTargeted(false);
    }
  };

  const handleComplete = useCallback(async (result: SessionResult) => {
    setSessionResult(result);

    // Save session to backend
    if (sessionId) {
      try {
        await api.put(`/api/sessions/${sessionId}/complete`, {
          wpm: result.wpm,
          rawWpm: result.rawWpm,
          accuracy: result.accuracy,
          mistakesCount: result.mistakes.length,
          mistakesData: result.mistakes,
          timeMs: result.timeMs,
        });
        fetchStats(); // Refresh stats
        fetchMistakeAnalysis(); // Refresh mistake analysis
      } catch (error) {
        console.error('Failed to save session:', error);
      }
    }
  }, [sessionId]);

  const { typed, handleInput, wpm, accuracy, correctChars, reset } = useTyping({
    text: currentText?.content ?? '',
    onComplete: handleComplete,
  });

  const startPractice = async (text: Text) => {
    setCurrentText(text);
    setSessionResult(null);
    reset();

    // Create session on backend
    try {
      const response = await api.post<{ id: string }>('/api/sessions', {
        textId: text.id,
      });
      setSessionId(response.data.id);
    } catch (error) {
      console.error('Failed to start session:', error);
    }
  };

  const selectRandomText = async () => {
    setIsLoading(true);
    try {
      const response = await api.get<Text>(`/api/texts/random?difficulty=${difficulty}`);
      await startPractice(response.data);
    } catch (error) {
      console.error('Failed to get random text:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateAIText = async () => {
    setIsGenerating(true);
    try {
      const response = await api.post<Text>('/api/texts/generate', {
        difficulty,
        category: 'general',
      });
      if (response.data) {
        await startPractice(response.data);
        fetchTexts(); // Refresh text list
      }
    } catch (error) {
      console.error('Failed to generate text:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const restartPractice = () => {
    if (currentText) {
      setSessionResult(null);
      reset();
      startPractice(currentText);
    }
  };

  const exitPractice = () => {
    setCurrentText(null);
    setSessionResult(null);
    setSessionId(null);
    reset();
  };

  // Get most common mistakes for display
  const getMistakeAnalysis = (mistakes: Mistake[]) => {
    const charCounts: Record<string, number> = {};
    mistakes.forEach((m) => {
      const key = m.expected;
      charCounts[key] = (charCounts[key] || 0) + 1;
    });

    return Object.entries(charCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        {/* Stats bar */}
        {userStats && (
          <div className="bg-gray-800 rounded-lg p-4 mb-8 border border-gray-700">
            <div className="grid grid-cols-5 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary-400">{userStats.bestWpm}</div>
                <div className="text-xs text-gray-500">Best WPM</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-200">{userStats.averageWpm}</div>
                <div className="text-xs text-gray-500">Avg WPM</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-400">{userStats.averageAccuracy}%</div>
                <div className="text-xs text-gray-500">Avg Accuracy</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-200">{userStats.totalSessions}</div>
                <div className="text-xs text-gray-500">Sessions</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-200">{userStats.totalTimeMinutes}m</div>
                <div className="text-xs text-gray-500">Time Practiced</div>
              </div>
            </div>
          </div>
        )}

        {/* No active practice - show text selection */}
        {!currentText && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-100 mb-2">Practice Mode</h2>
              <p className="text-gray-400">Improve your typing speed and accuracy</p>
            </div>

            {/* Difficulty selector */}
            <div className="flex justify-center gap-3">
              {['easy', 'medium', 'hard'].map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                    difficulty === d
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </button>
              ))}
            </div>

            {/* Weakness Analysis Section */}
            {mistakeAnalysis && mistakeAnalysis.totalMistakes > 0 && (
              <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                <button
                  onClick={() => setShowAnalysis(!showAnalysis)}
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-medium text-gray-200">Your Weaknesses</span>
                    <span className={`text-sm px-2 py-0.5 rounded ${
                      mistakeAnalysis.recentTrend === 'improving' ? 'bg-green-900 text-green-300' :
                      mistakeAnalysis.recentTrend === 'declining' ? 'bg-red-900 text-red-300' :
                      'bg-gray-700 text-gray-300'
                    }`}>
                      {mistakeAnalysis.recentTrend === 'improving' ? 'Improving' :
                       mistakeAnalysis.recentTrend === 'declining' ? 'Needs Work' : 'Stable'}
                    </span>
                  </div>
                  <span className="text-gray-400">{showAnalysis ? '−' : '+'}</span>
                </button>

                {showAnalysis && (
                  <div className="p-4 border-t border-gray-700 space-y-4">
                    {/* Weakest characters */}
                    <div>
                      <p className="text-sm text-gray-400 mb-2">Most problematic characters:</p>
                      <div className="flex flex-wrap gap-2">
                        {mistakeAnalysis.characterBreakdown.slice(0, 8).map((item) => (
                          <div
                            key={item.char}
                            className="px-3 py-2 bg-red-900/30 border border-red-800 rounded-lg"
                          >
                            <span className="font-mono text-red-300 text-lg">
                              "{item.char}"
                            </span>
                            <span className="text-gray-400 text-sm ml-2">
                              {item.count}x ({item.percentage}%)
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Confusion pairs */}
                    {mistakeAnalysis.confusionPairs.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-400 mb-2">Common confusion pairs:</p>
                        <div className="flex flex-wrap gap-2">
                          {mistakeAnalysis.confusionPairs.slice(0, 5).map((pair, i) => (
                            <div
                              key={i}
                              className="px-3 py-2 bg-orange-900/30 border border-orange-800 rounded-lg text-sm"
                            >
                              <span className="font-mono text-orange-300">
                                "{pair.expected}"
                              </span>
                              <span className="text-gray-400 mx-1">typed as</span>
                              <span className="font-mono text-orange-300">
                                "{pair.typed}"
                              </span>
                              <span className="text-gray-500 ml-1">x{pair.count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Targeted practice button */}
                    <button
                      onClick={generateTargetedPractice}
                      disabled={isGeneratingTargeted}
                      className="w-full px-4 py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-800 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      {isGeneratingTargeted ? (
                        'Generating...'
                      ) : (
                        <>
                          <span>🎯</span> Practice Your Weaknesses
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Quick start buttons */}
            <div className="flex justify-center gap-4">
              <button
                onClick={selectRandomText}
                disabled={isLoading}
                className="px-8 py-4 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-800 text-white text-lg font-bold rounded-lg transition-colors"
              >
                {isLoading ? 'Loading...' : 'Random Text'}
              </button>
              <button
                onClick={generateAIText}
                disabled={isGenerating}
                className="px-8 py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white text-lg font-bold rounded-lg transition-colors flex items-center gap-2"
              >
                {isGenerating ? (
                  'Generating...'
                ) : (
                  <>
                    <span>✨</span> AI Generated
                  </>
                )}
              </button>
            </div>

            {/* Text library */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
              <div className="p-4 border-b border-gray-700">
                <h3 className="text-lg font-medium text-gray-200">Text Library</h3>
              </div>
              <div className="divide-y divide-gray-700 max-h-96 overflow-y-auto">
                {texts
                  .filter((t) => difficulty === 'all' || t.difficulty === difficulty)
                  .map((text) => (
                    <div
                      key={text.id}
                      className="p-4 hover:bg-gray-700 cursor-pointer transition-colors"
                      onClick={() => startPractice(text)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-200">{text.title}</span>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              text.difficulty === 'easy'
                                ? 'bg-green-900 text-green-300'
                                : text.difficulty === 'medium'
                                ? 'bg-yellow-900 text-yellow-300'
                                : 'bg-red-900 text-red-300'
                            }`}
                          >
                            {text.difficulty}
                          </span>
                          {text.source === 'ai_generated' && (
                            <span className="text-xs px-2 py-1 rounded bg-purple-900 text-purple-300">
                              AI
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-400 truncate">{text.content}</p>
                      <p className="text-xs text-gray-500 mt-1">{text.wordCount} words</p>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Active practice */}
        {currentText && !sessionResult && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-100">{currentText.title}</h2>
                <p className="text-sm text-gray-500">
                  {currentText.wordCount} words • {currentText.difficulty}
                </p>
              </div>
              <button
                onClick={exitPractice}
                className="text-gray-400 hover:text-gray-200 transition-colors"
              >
                Exit
              </button>
            </div>

            {/* Progress bar */}
            <ProgressBar
              progress={correctChars}
              total={currentText.content.length}
              wpm={wpm}
              accuracy={accuracy}
            />

            {/* Typing area */}
            <TypingComposer
              text={currentText.content}
              typed={typed}
              onInput={handleInput}
              autoFocus={true}
            />

            {/* Tips */}
            <div className="text-center text-sm text-gray-500">
              Focus on accuracy first, speed will follow
            </div>
          </div>
        )}

        {/* Results */}
        {currentText && sessionResult && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-100 mb-2">Session Complete!</h2>
              <p className="text-gray-400">{currentText.title}</p>
            </div>

            {/* Stats */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="grid grid-cols-4 gap-6 text-center">
                <div>
                  <div className="text-4xl font-bold text-primary-400">{sessionResult.wpm}</div>
                  <div className="text-sm text-gray-500">WPM</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-gray-200">{sessionResult.rawWpm}</div>
                  <div className="text-sm text-gray-500">Raw WPM</div>
                </div>
                <div>
                  <div
                    className={`text-4xl font-bold ${
                      sessionResult.accuracy >= 95
                        ? 'text-green-400'
                        : sessionResult.accuracy >= 85
                        ? 'text-yellow-400'
                        : 'text-red-400'
                    }`}
                  >
                    {sessionResult.accuracy}%
                  </div>
                  <div className="text-sm text-gray-500">Accuracy</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-gray-200">
                    {Math.round(sessionResult.timeMs / 1000)}s
                  </div>
                  <div className="text-sm text-gray-500">Time</div>
                </div>
              </div>
            </div>

            {/* Mistake analysis */}
            {sessionResult.mistakes.length > 0 && (
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="text-lg font-medium text-gray-200 mb-4">
                  Mistake Analysis ({sessionResult.mistakes.length} errors)
                </h3>
                <div className="space-y-2">
                  <p className="text-sm text-gray-400 mb-3">Most common mistakes:</p>
                  <div className="flex flex-wrap gap-2">
                    {getMistakeAnalysis(sessionResult.mistakes).map(([char, count]) => (
                      <div
                        key={char}
                        className="px-3 py-2 bg-red-900/30 border border-red-800 rounded-lg"
                      >
                        <span className="font-mono text-red-300">
                          "{char === ' ' ? '␣' : char}"
                        </span>
                        <span className="text-gray-400 text-sm ml-2">×{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-center gap-4">
              <button
                onClick={restartPractice}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-gray-200 font-medium rounded-lg transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={selectRandomText}
                className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
              >
                Next Text
              </button>
              <button
                onClick={exitPractice}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-gray-200 font-medium rounded-lg transition-colors"
              >
                Back to Library
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
