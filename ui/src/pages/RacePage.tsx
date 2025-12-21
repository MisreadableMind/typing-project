import { useCallback, useEffect, useState, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import { useRaceStore } from '../store/raceStore';
import { useRaceSocket } from '../hooks/useRaceSocket';
import { useTyping } from '../hooks/useTyping';
import { Header } from '../components/Header';
import { TypingComposer } from '../components/TypingComposer';
import { RaceTrack } from '../components/RaceTrack';
import { Countdown } from '../components/Countdown';
import { Mistake } from '../types';

interface RaceResult {
  wpm: number;
  rawWpm: number;
  accuracy: number;
  mistakes: Mistake[];
  timeMs: number;
}

type RaceMode = 'menu' | 'quickplay' | 'private' | 'join';

export function RacePage() {
  const { user } = useAuthStore();
  const { race, countdown, isRacing, playerProgress, raceTimer, isTimedOut } = useRaceStore();
  const {
    findRace,
    setReady,
    sendProgress,
    sendFinish,
    leaveRace,
    createPrivateRace,
    joinByInvite,
    creatorStart,
  } = useRaceSocket();
  const [difficulty, setDifficulty] = useState<string>('medium');
  const [hasFinished, setHasFinished] = useState(false);
  const [raceResult, setRaceResult] = useState<RaceResult | null>(null);
  const [raceMode, setRaceMode] = useState<RaceMode>('menu');
  const [inviteCode, setInviteCode] = useState<string>('');
  const [joinCode, setJoinCode] = useState<string>('');
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [joinError, setJoinError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const errorsRef = useRef<string[]>([]); // Silent error queue

  const text = race?.text?.content ?? '';
  const isCreator = race?.creatorId === user?.id;

  // Get bot difficulty badge class
  const getBotBadgeClass = (botDifficulty?: string) => {
    switch (botDifficulty) {
      case 'rookie': return 'badge-rookie';
      case 'average': return 'badge-average';
      case 'pro': return 'badge-pro';
      case 'legend': return 'badge-legend';
      default: return '';
    }
  };

  const handleProgress = useCallback((progress: number, wpm: number, accuracy: number) => {
    if (isRacing && !hasFinished) {
      try {
        sendProgress(progress, wpm, accuracy);
      } catch (error) {
        // Queue errors silently during race
        errorsRef.current.push(`Progress sync error: ${error}`);
      }
    }
  }, [isRacing, hasFinished, sendProgress]);

  const handleComplete = useCallback((result: {
    wpm: number;
    rawWpm: number;
    accuracy: number;
    mistakes: Mistake[];
    timeMs: number;
  }) => {
    if (!hasFinished) {
      setHasFinished(true);
      setRaceResult(result);
      try {
        sendFinish(result.wpm, result.accuracy);
      } catch (error) {
        errorsRef.current.push(`Finish sync error: ${error}`);
      }
    }
  }, [hasFinished, sendFinish]);

  const { typed, handleInput, wpm, accuracy, reset } = useTyping({
    text,
    onProgress: handleProgress,
    onComplete: handleComplete,
  });

  // Reset when race changes
  useEffect(() => {
    reset();
    setHasFinished(false);
    setRaceResult(null);
    errorsRef.current = [];
  }, [race?.id, reset]);

  // Format timer display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get mistake analysis for display
  const getMistakeAnalysis = (mistakeList: Mistake[]) => {
    const charCounts: Record<string, number> = {};
    mistakeList.forEach((m) => {
      const key = m.expected;
      charCounts[key] = (charCounts[key] || 0) + 1;
    });

    return Object.entries(charCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  };

  const handleFindRace = () => {
    findRace(difficulty);
  };

  const handleReady = () => {
    setReady();
  };

  const handleLeave = () => {
    leaveRace();
    reset();
    setHasFinished(false);
    setRaceMode('menu');
    setInviteCode('');
    setJoinCode('');
  };

  const handleCreatePrivate = async () => {
    setIsLoading(true);
    const result = await createPrivateRace(difficulty);
    setIsLoading(false);
    if (result.inviteCode) {
      setInviteCode(result.inviteCode);
    }
  };

  const handleJoinByCode = async () => {
    if (!joinCode.trim()) {
      setJoinError('Please enter an invite code');
      return;
    }
    setIsLoading(true);
    setJoinError('');
    const success = await joinByInvite(joinCode.trim().toUpperCase());
    setIsLoading(false);
    if (!success) {
      setJoinError('Invalid or expired invite code');
    }
  };

  const handleCreatorStart = async () => {
    setIsLoading(true);
    await creatorStart();
    setIsLoading(false);
  };

  const handleCopyInvite = () => {
    const url = `${window.location.origin}/race?invite=${inviteCode}`;
    navigator.clipboard.writeText(url);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  const handleBackToMenu = () => {
    setRaceMode('menu');
    setJoinCode('');
    setJoinError('');
  };

  const isReady = race?.participants.find(p => p.userId === user?.id)?.isReady;
  const isWaiting = race?.status === 'waiting';
  const isComplete = race?.status === 'completed';

  const myResult = race?.participants.find(p => p.userId === user?.id);

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col scanlines">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        {/* Countdown overlay */}
        {countdown !== null && <Countdown count={countdown} />}

        {/* Main Menu - No race */}
        {!race && raceMode === 'menu' && (
          <div className="text-center py-12">
            <h1 className="retro-title text-4xl text-cyan-400 mb-2">
              TYPE RACER
            </h1>
            <p className="retro-text text-xl text-gray-400 mb-12">
              PRESS START TO BEGIN
            </p>

            {/* Difficulty selector */}
            <div className="retro-box p-6 mb-8 max-w-md mx-auto">
              <p className="retro-text text-lg text-gray-300 mb-4">SELECT DIFFICULTY</p>
              <div className="flex justify-center gap-3">
                {['easy', 'medium', 'hard'].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`retro-btn ${
                      difficulty === d ? 'retro-btn-primary glow-cyan' : ''
                    }`}
                  >
                    {d.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Menu buttons */}
            <div className="flex flex-col items-center gap-4">
              <button
                onClick={() => { setRaceMode('quickplay'); handleFindRace(); }}
                className="retro-btn retro-btn-success w-64"
              >
                QUICK PLAY
              </button>
              <button
                onClick={() => { setRaceMode('private'); handleCreatePrivate(); }}
                disabled={isLoading}
                className="retro-btn retro-btn-primary w-64"
              >
                {isLoading ? 'CREATING...' : 'CREATE PRIVATE'}
              </button>
              <button
                onClick={() => setRaceMode('join')}
                className="retro-btn retro-btn-warning w-64"
              >
                JOIN BY CODE
              </button>
            </div>

            {/* Retro decorative element */}
            <div className="mt-12 text-gray-600 retro-text">
              <span className="retro-blink">_</span> INSERT COIN TO CONTINUE
            </div>
          </div>
        )}

        {/* Join by Code Screen */}
        {!race && raceMode === 'join' && (
          <div className="text-center py-12">
            <h2 className="retro-title text-2xl text-cyan-400 mb-8">
              ENTER INVITE CODE
            </h2>

            <div className="retro-box p-8 max-w-md mx-auto mb-6">
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="XXXXX-XXXXX"
                maxLength={11}
                className="w-full bg-black border-2 border-cyan-500 p-4 text-center text-2xl font-mono text-cyan-400 tracking-widest focus:outline-none focus:border-cyan-300"
              />
              {joinError && (
                <p className="text-red-400 mt-4 retro-text">{joinError}</p>
              )}
            </div>

            <div className="flex justify-center gap-4">
              <button
                onClick={handleBackToMenu}
                className="retro-btn w-32"
              >
                BACK
              </button>
              <button
                onClick={handleJoinByCode}
                disabled={isLoading || !joinCode.trim()}
                className="retro-btn retro-btn-success w-32"
              >
                {isLoading ? '...' : 'JOIN'}
              </button>
            </div>
          </div>
        )}

        {/* Waiting for players */}
        {race && isWaiting && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="retro-title text-2xl text-cyan-400 mb-2">
                {race.isPrivate ? 'PRIVATE RACE' : 'FINDING OPPONENTS'}
              </h2>
              <p className="retro-text text-xl text-gray-400">
                {race.participants.length} / {race.maxParticipants} PLAYERS
              </p>
            </div>

            {/* Invite code for private races */}
            {race.isPrivate && inviteCode && (
              <div className="retro-box p-6 text-center">
                <p className="retro-text text-gray-400 mb-2">SHARE THIS CODE WITH FRIENDS</p>
                <div className="flex items-center justify-center gap-4">
                  <span className="text-3xl font-mono text-cyan-400 tracking-widest glow-cyan">
                    {inviteCode}
                  </span>
                  <button
                    onClick={handleCopyInvite}
                    className="retro-btn retro-btn-primary text-xs"
                  >
                    {copyFeedback ? 'COPIED!' : 'COPY LINK'}
                  </button>
                </div>
              </div>
            )}

            {/* Participants list */}
            <div className="retro-box p-4">
              <h3 className="retro-text text-lg text-cyan-400 mb-4">PLAYERS</h3>
              <div className="space-y-3">
                {race.participants.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-2 bg-black/30">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded flex items-center justify-center text-white font-bold border-2 border-gray-600"
                        style={{ backgroundColor: p.user.avatarColor }}
                      >
                        {p.user.username[0].toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="retro-text text-lg text-gray-200">
                          {p.user.username}
                          {p.userId === user?.id && (
                            <span className="text-cyan-400 ml-2">[YOU]</span>
                          )}
                        </span>
                        {p.user.isBot && (
                          <span className={`text-xs px-2 py-0.5 rounded ${getBotBadgeClass(p.user.botDifficulty)}`}>
                            BOT - {p.user.botDifficulty?.toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={`retro-text ${p.isReady ? 'text-green-400 glow-green' : 'text-gray-500'}`}>
                      {p.isReady ? 'READY' : 'WAITING'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Text preview */}
            <div className="retro-box p-4">
              <h3 className="retro-text text-lg text-cyan-400 mb-2">
                {race.text.title.toUpperCase()}
              </h3>
              <p className="retro-text text-sm text-gray-400 mb-2">
                {race.text.wordCount} WORDS | {race.text.difficulty.toUpperCase()}
              </p>
              <p className="text-gray-300 font-mono text-sm">
                {race.text.content.slice(0, 100)}...
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-center gap-4 flex-wrap">
              <button
                onClick={handleLeave}
                className="retro-btn"
              >
                LEAVE
              </button>

              {!isReady && (
                <button
                  onClick={handleReady}
                  className="retro-btn retro-btn-success"
                >
                  I'M READY!
                </button>
              )}

              {isReady && !isCreator && (
                <span className="retro-btn retro-btn-success opacity-50 cursor-not-allowed">
                  WAITING...
                </span>
              )}

              {/* Creator start button */}
              {isCreator && race.isPrivate && (
                <button
                  onClick={handleCreatorStart}
                  disabled={isLoading}
                  className="retro-btn retro-btn-warning"
                >
                  {isLoading ? 'STARTING...' : 'START RACE!'}
                </button>
              )}
            </div>

            {!race.isPrivate && race.participants.length < 2 && (
              <p className="text-center retro-text text-gray-500 retro-blink">
                SEARCHING FOR OPPONENTS...
              </p>
            )}
          </div>
        )}

        {/* Racing */}
        {race && (isRacing || race.status === 'countdown' || race.status === 'in_progress') && !isComplete && (
          <div className="space-y-6">
            {/* Header with stats */}
            <div className="retro-box p-4">
              <div className="flex items-center justify-between">
                <h2 className="retro-text text-lg text-gray-200">
                  {race.text.title.toUpperCase()}
                </h2>
                <div className="flex items-center gap-6">
                  {/* Timer display */}
                  {raceTimer && (
                    <div className={`retro-text text-2xl font-bold ${
                      raceTimer.remaining <= 10 ? 'text-red-400 retro-blink' :
                      raceTimer.remaining <= 30 ? 'text-yellow-400 glow-yellow' : 'text-gray-300'
                    }`}>
                      {formatTime(raceTimer.remaining)}
                    </div>
                  )}
                  <div className="text-center">
                    <div className="text-3xl font-bold text-cyan-400 glow-cyan">{wpm}</div>
                    <div className="retro-text text-xs text-gray-500">WPM</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${
                      accuracy >= 95 ? 'text-green-400 glow-green' :
                      accuracy >= 85 ? 'text-yellow-400' : 'text-red-400'
                    }`}>{accuracy}%</div>
                    <div className="retro-text text-xs text-gray-500">ACC</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Race track */}
            <div className="retro-box p-4">
              <RaceTrack
                participants={race.participants}
                textLength={text.length}
                playerProgress={playerProgress}
              />
            </div>

            {/* Typing area */}
            <div className="retro-box p-4 crt-curve">
              <TypingComposer
                text={text}
                typed={typed}
                onInput={handleInput}
                disabled={!isRacing || hasFinished}
                autoFocus={isRacing && !hasFinished}
              />
            </div>

            {hasFinished && (
              <div className="text-center py-4">
                <p className="retro-title text-xl text-green-400 glow-green">
                  FINISHED! WAITING FOR OTHERS...
                </p>
              </div>
            )}
          </div>
        )}

        {/* Race complete */}
        {race && isComplete && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="retro-title text-3xl mb-2">
                {isTimedOut ? (
                  <span className="text-red-400">TIME'S UP!</span>
                ) : (
                  <span className="text-cyan-400 glow-cyan">RACE COMPLETE!</span>
                )}
              </h2>
              {myResult?.rank === 1 && !myResult?.isDnf && (
                <p className="retro-title text-2xl text-yellow-400 glow-yellow">
                  WINNER!
                </p>
              )}
              {myResult?.isDnf && (
                <p className="retro-text text-lg text-orange-400">
                  DNF - {Math.round((myResult.progress / text.length) * 100)}% COMPLETED
                </p>
              )}
            </div>

            {/* My stats (if finished) */}
            {raceResult && !myResult?.isDnf && (
              <div className="retro-box p-6">
                <h3 className="retro-text text-lg text-cyan-400 mb-4">YOUR PERFORMANCE</h3>
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div className="p-3 bg-black/30">
                    <div className="text-3xl font-bold text-cyan-400 glow-cyan">{raceResult.wpm}</div>
                    <div className="retro-text text-xs text-gray-500">WPM</div>
                  </div>
                  <div className="p-3 bg-black/30">
                    <div className="text-3xl font-bold text-gray-200">{raceResult.rawWpm}</div>
                    <div className="retro-text text-xs text-gray-500">RAW WPM</div>
                  </div>
                  <div className="p-3 bg-black/30">
                    <div className={`text-3xl font-bold ${
                      raceResult.accuracy >= 95 ? 'text-green-400 glow-green' :
                      raceResult.accuracy >= 85 ? 'text-yellow-400' : 'text-red-400'
                    }`}>{raceResult.accuracy}%</div>
                    <div className="retro-text text-xs text-gray-500">ACCURACY</div>
                  </div>
                  <div className="p-3 bg-black/30">
                    <div className="text-3xl font-bold text-gray-200">
                      {Math.round(raceResult.timeMs / 1000)}s
                    </div>
                    <div className="retro-text text-xs text-gray-500">TIME</div>
                  </div>
                </div>

                {/* Mistake analysis */}
                {raceResult.mistakes.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <p className="retro-text text-sm text-gray-400 mb-2">
                      {raceResult.mistakes.length} MISTAKE{raceResult.mistakes.length !== 1 ? 'S' : ''} - MOST COMMON:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {getMistakeAnalysis(raceResult.mistakes).map(([char, count]) => (
                        <span
                          key={char}
                          className="px-3 py-1 bg-red-900/30 border-2 border-red-700 text-sm"
                        >
                          <span className="font-mono text-red-300">
                            "{char === ' ' ? 'SPACE' : char}"
                          </span>
                          <span className="text-gray-400 ml-1">x{count}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Final standings */}
            <div className="retro-box p-6">
              <h3 className="retro-text text-xl text-cyan-400 mb-4">FINAL STANDINGS</h3>
              <div className="space-y-3">
                {[...race.participants]
                  .sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99))
                  .map((p) => (
                    <div
                      key={p.id}
                      className={`flex items-center justify-between p-3 ${
                        p.userId === user?.id
                          ? 'bg-cyan-900/30 border-2 border-cyan-500'
                          : 'bg-black/30 border border-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <span className={`retro-text text-2xl font-bold w-16 ${
                          p.isDnf ? 'text-orange-400' :
                          p.rank === 1 ? 'text-yellow-400 glow-yellow' :
                          p.rank === 2 ? 'text-gray-300' :
                          p.rank === 3 ? 'text-amber-600' :
                          'text-gray-500'
                        }`}>
                          {p.isDnf ? 'DNF' : `#${p.rank}`}
                        </span>
                        <div
                          className="w-10 h-10 rounded flex items-center justify-center text-white font-bold border-2 border-gray-600"
                          style={{ backgroundColor: p.user.avatarColor }}
                        >
                          {p.user.username[0].toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="retro-text text-lg text-gray-200">
                            {p.user.username}
                            {p.userId === user?.id && (
                              <span className="text-cyan-400 ml-2">[YOU]</span>
                            )}
                          </span>
                          {p.user.isBot && (
                            <span className={`text-xs px-2 py-0.5 rounded w-fit ${getBotBadgeClass(p.user.botDifficulty)}`}>
                              BOT - {p.user.botDifficulty?.toUpperCase()}
                            </span>
                          )}
                          {p.isDnf && (
                            <span className="text-xs text-orange-400">
                              {Math.round((p.progress / text.length) * 100)}% COMPLETED
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <span className="text-cyan-400">
                          <span className="font-bold text-xl">{Math.round(p.wpm)}</span>
                          <span className="retro-text text-sm ml-1">WPM</span>
                        </span>
                        <span className="retro-text text-gray-400">
                          {Math.round(p.accuracy)}%
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Errors during race (if any) */}
            {errorsRef.current.length > 0 && (
              <div className="retro-box p-4 border-yellow-600">
                <h4 className="retro-text text-yellow-400 mb-2">CONNECTION ISSUES:</h4>
                <ul className="retro-text text-sm text-yellow-300/70 list-disc list-inside">
                  {errorsRef.current.slice(0, 3).map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                  {errorsRef.current.length > 3 && (
                    <li>...AND {errorsRef.current.length - 3} MORE</li>
                  )}
                </ul>
              </div>
            )}

            {/* Play again */}
            <div className="flex justify-center gap-4">
              <button
                onClick={handleLeave}
                className="retro-btn retro-btn-success"
              >
                RACE AGAIN
              </button>
            </div>

            {/* Retro game over text */}
            <div className="text-center retro-text text-gray-600">
              <span className="retro-blink">_</span> PRESS START TO CONTINUE
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
