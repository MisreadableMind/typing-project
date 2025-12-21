import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Header } from '../components/Header';
import { useAuthStore } from '../store/authStore';
import { api } from '../api/client';
import { User } from '../types';

export function HomePage() {
  const { user } = useAuthStore();
  const [leaderboard, setLeaderboard] = useState<User[]>([]);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const response = await api.get<User[]>('/api/users/leaderboard?limit=5');
      setLeaderboard(response.data);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-12">
        {/* Welcome */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-100 mb-3">
            Welcome back, <span className="text-primary-400">{user?.username}</span>!
          </h1>
          <p className="text-gray-400">Choose your training mode</p>
        </div>

        {/* Mode selection */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* Race Mode */}
          <Link
            to="/race"
            className="group bg-gray-800 rounded-xl p-8 border border-gray-700 hover:border-primary-500 transition-all hover:shadow-lg hover:shadow-primary-500/10"
          >
            <div className="text-5xl mb-4">🏎️</div>
            <h2 className="text-2xl font-bold text-gray-100 mb-2 group-hover:text-primary-400 transition-colors">
              Multiplayer Race
            </h2>
            <p className="text-gray-400 mb-4">
              Compete against other players in real-time typing races.
              First to finish wins!
            </p>
            <div className="flex items-center text-primary-400 font-medium">
              Start Racing
              <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </Link>

          {/* Practice Mode */}
          <Link
            to="/practice"
            className="group bg-gray-800 rounded-xl p-8 border border-gray-700 hover:border-green-500 transition-all hover:shadow-lg hover:shadow-green-500/10"
          >
            <div className="text-5xl mb-4">📚</div>
            <h2 className="text-2xl font-bold text-gray-100 mb-2 group-hover:text-green-400 transition-colors">
              Solo Practice
            </h2>
            <p className="text-gray-400 mb-4">
              Train at your own pace. Track your progress and improve your
              weak spots with AI-generated texts.
            </p>
            <div className="flex items-center text-green-400 font-medium">
              Start Practicing
              <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </Link>
        </div>

        {/* Stats overview */}
        {user && (
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-8">
            <h3 className="text-lg font-medium text-gray-200 mb-4">Your Stats</h3>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-3xl font-bold text-primary-400">{user.bestWpm}</div>
                <div className="text-sm text-gray-500">Best WPM</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-200">{user.averageWpm}</div>
                <div className="text-sm text-gray-500">Avg WPM</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-400">{user.averageAccuracy}%</div>
                <div className="text-sm text-gray-500">Accuracy</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-yellow-400">{user.racesWon}</div>
                <div className="text-sm text-gray-500">Races Won</div>
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard preview */}
        {leaderboard.length > 0 && (
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-lg font-medium text-gray-200 mb-4">Top Typists</h3>
            <div className="space-y-3">
              {leaderboard.map((player, index) => (
                <div
                  key={player.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    player.id === user?.id ? 'bg-primary-900/30 border border-primary-500' : 'bg-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-lg font-bold ${
                      index === 0 ? 'text-yellow-400' :
                      index === 1 ? 'text-gray-400' :
                      index === 2 ? 'text-amber-600' :
                      'text-gray-500'
                    }`}>
                      #{index + 1}
                    </span>
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                      style={{ backgroundColor: player.avatarColor }}
                    >
                      {player.username[0].toUpperCase()}
                    </div>
                    <span className="text-gray-200">{player.username}</span>
                    {player.id === user?.id && (
                      <span className="text-xs text-primary-400">(you)</span>
                    )}
                  </div>
                  <div className="text-primary-400 font-bold">
                    {player.bestWpm} WPM
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
