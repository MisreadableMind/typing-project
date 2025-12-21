import { useAuthStore } from '../store/authStore';
import { RaceParticipant } from '../types';

interface RaceTrackProps {
  participants: RaceParticipant[];
  textLength: number;
  playerProgress: Map<string, {
    userId: string;
    username: string;
    progress: number;
    wpm: number;
    accuracy: number;
  }>;
}

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

export function RaceTrack({ participants, textLength, playerProgress }: RaceTrackProps) {
  const { user } = useAuthStore();

  const getProgress = (participant: RaceParticipant) => {
    // Check real-time progress first
    const liveProgress = playerProgress.get(participant.userId);
    if (liveProgress) {
      return (liveProgress.progress / textLength) * 100;
    }
    return (participant.progress / textLength) * 100;
  };

  const getWpm = (participant: RaceParticipant) => {
    const liveProgress = playerProgress.get(participant.userId);
    return liveProgress?.wpm ?? participant.wpm;
  };

  // Sort by progress
  const sortedParticipants = [...participants].sort((a, b) => {
    const progressA = getProgress(a);
    const progressB = getProgress(b);
    return progressB - progressA;
  });

  return (
    <div className="space-y-3">
      {sortedParticipants.map((participant, index) => {
        const isMe = participant.userId === user?.id;
        const progress = getProgress(participant);
        const wpm = getWpm(participant);
        const isFinished = !!participant.finishedAt;

        return (
          <div key={participant.id} className="relative">
            {/* Player info row */}
            <div className="flex items-center gap-2 mb-1">
              {/* Position */}
              <span className={`retro-text text-sm font-bold w-6 ${
                index === 0 ? 'text-yellow-400' :
                index === 1 ? 'text-gray-300' :
                index === 2 ? 'text-amber-600' :
                'text-gray-500'
              }`}>
                {index + 1}.
              </span>

              {/* Username */}
              <span className={`retro-text text-sm ${isMe ? 'text-cyan-400' : 'text-gray-400'}`}>
                {participant.user.username}
                {isMe && ' [YOU]'}
              </span>

              {/* Bot badge */}
              {participant.user.isBot && (
                <span className={`text-xs px-1 py-0.5 rounded ${getBotBadgeClass(participant.user.botDifficulty)}`}>
                  {participant.user.botDifficulty?.charAt(0).toUpperCase()}
                </span>
              )}

              {/* Spacer */}
              <div className="flex-1" />

              {/* WPM - just the number */}
              <span className={`font-mono text-lg font-bold ${
                isFinished ? 'text-green-400' :
                isMe ? 'text-cyan-400' : 'text-gray-300'
              }`}>
                {wpm}
              </span>
            </div>

            {/* Race track */}
            <div className="relative h-8 bg-gray-900 border-2 border-gray-700 overflow-hidden">
              {/* Track lines */}
              <div className="absolute inset-0 flex items-center">
                <div className="w-full h-px bg-gray-700" />
              </div>

              {/* Progress fill */}
              <div
                className={`absolute inset-y-0 left-0 transition-all duration-150 ${
                  isFinished ? 'bg-green-900/50' :
                  isMe ? 'bg-cyan-900/30' : 'bg-gray-800/50'
                }`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />

              {/* Finish line */}
              <div className="absolute right-0 inset-y-0 w-1 bg-gradient-to-b from-white via-gray-400 to-white opacity-50" />
              <div className="absolute right-2 inset-y-0 flex items-center">
                <span className="text-xs text-gray-500">🏁</span>
              </div>

              {/* Player icon on track */}
              <div
                className="absolute top-1/2 -translate-y-1/2 transition-all duration-150 ease-out"
                style={{ left: `calc(${Math.min(progress, 98)}% - 14px)` }}
              >
                <div
                  className={`w-7 h-7 rounded flex items-center justify-center text-white font-bold text-xs border-2 ${
                    isFinished ? 'border-green-400 shadow-green-glow' :
                    isMe ? 'border-cyan-400 shadow-cyan-glow' : 'border-gray-500'
                  }`}
                  style={{
                    backgroundColor: participant.user.avatarColor,
                    boxShadow: isMe ? '0 0 10px rgba(0, 255, 255, 0.6)' :
                               isFinished ? '0 0 10px rgba(0, 255, 0, 0.6)' : 'none'
                  }}
                >
                  {participant.user.username[0].toUpperCase()}
                </div>
              </div>

              {/* Finished badge */}
              {isFinished && (
                <div className="absolute right-8 top-1/2 -translate-y-1/2">
                  <span className="retro-text text-xs text-green-400 font-bold">DONE!</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
