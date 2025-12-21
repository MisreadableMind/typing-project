import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export function Header() {
  const { user, logout } = useAuthStore();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-black/80 border-b-2 border-cyan-500/50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <span className="text-2xl">⌨️</span>
            <h1 className="retro-title text-lg text-cyan-400">
              TAPTAPTAP
            </h1>
          </Link>

          {user && (
            <nav className="flex items-center gap-2">
              <Link
                to="/race"
                className={`retro-text px-4 py-2 text-sm uppercase tracking-wider transition-all ${
                  isActive('/race')
                    ? 'text-cyan-400 border-b-2 border-cyan-400 glow-cyan'
                    : 'text-gray-400 hover:text-cyan-300 border-b-2 border-transparent'
                }`}
              >
                Race
              </Link>
              <Link
                to="/practice"
                className={`retro-text px-4 py-2 text-sm uppercase tracking-wider transition-all ${
                  isActive('/practice')
                    ? 'text-green-400 border-b-2 border-green-400 glow-green'
                    : 'text-gray-400 hover:text-green-300 border-b-2 border-transparent'
                }`}
              >
                Practice
              </Link>
            </nav>
          )}
        </div>

        {user && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded flex items-center justify-center text-white font-bold border-2 border-gray-600"
                style={{ backgroundColor: user.avatarColor }}
              >
                {user.username[0].toUpperCase()}
              </div>
              <span className="retro-text text-lg text-gray-200">{user.username}</span>
            </div>

            <div className="retro-text text-sm text-gray-400">
              HI-SCORE: <span className="text-yellow-400 font-bold glow-yellow">{user.bestWpm}</span> WPM
            </div>

            <button
              onClick={logout}
              className="retro-text text-sm text-gray-500 hover:text-red-400 transition-colors uppercase"
            >
              Exit
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
