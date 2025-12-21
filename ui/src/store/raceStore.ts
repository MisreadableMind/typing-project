import { create } from 'zustand';
import { Race, RaceParticipant } from '../types';

interface PlayerProgress {
  userId: string;
  username: string;
  progress: number;
  wpm: number;
  accuracy: number;
}

interface RaceTimer {
  remaining: number;
  total: number;
}

interface RaceState {
  race: Race | null;
  countdown: number | null;
  isRacing: boolean;
  playerProgress: Map<string, PlayerProgress>;
  raceTimer: RaceTimer | null;
  isTimedOut: boolean;

  setRace: (race: Race | null) => void;
  setCountdown: (count: number | null) => void;
  setIsRacing: (isRacing: boolean) => void;
  updatePlayerProgress: (progress: PlayerProgress) => void;
  updateParticipant: (participant: Partial<RaceParticipant> & { userId: string }) => void;
  setRaceTimer: (timer: RaceTimer | null) => void;
  setTimedOut: (value: boolean) => void;
  reset: () => void;
}

export const useRaceStore = create<RaceState>((set, get) => ({
  race: null,
  countdown: null,
  isRacing: false,
  playerProgress: new Map(),
  raceTimer: null,
  isTimedOut: false,

  setRace: (race) => set({ race }),

  setCountdown: (countdown) => set({ countdown }),

  setIsRacing: (isRacing) => set({ isRacing }),

  updatePlayerProgress: (progress) => {
    const newMap = new Map(get().playerProgress);
    newMap.set(progress.userId, progress);
    set({ playerProgress: newMap });
  },

  updateParticipant: (update) => {
    const race = get().race;
    if (!race) return;

    const participants = race.participants.map((p) =>
      p.userId === update.userId ? { ...p, ...update } : p
    );

    set({ race: { ...race, participants } });
  },

  setRaceTimer: (raceTimer) => set({ raceTimer }),

  setTimedOut: (isTimedOut) => set({ isTimedOut }),

  reset: () => set({
    race: null,
    countdown: null,
    isRacing: false,
    playerProgress: new Map(),
    raceTimer: null,
    isTimedOut: false,
  }),
}));
