interface CountdownProps {
  count: number;
}

export function Countdown({ count }: CountdownProps) {
  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 scanlines">
      <div className="text-center">
        <div className="retro-title text-9xl text-cyan-400 glow-cyan animate-pulse">
          {count}
        </div>
        <div className="retro-text text-3xl text-yellow-400 mt-8 glow-yellow">
          GET READY!
        </div>
        <div className="retro-text text-lg text-gray-500 mt-4 retro-blink">
          RACE STARTING...
        </div>
      </div>
    </div>
  );
}
