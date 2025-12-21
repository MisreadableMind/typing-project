export interface User {
  id: string;
  username: string;
  avatarColor: string;
  bestWpm: number;
  averageWpm: number;
  averageAccuracy: number;
  totalRaces: number;
  racesWon: number;
  isBot?: boolean;
  botDifficulty?: 'rookie' | 'average' | 'pro' | 'legend';
}

export interface Text {
  id: string;
  content: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  source: 'built_in' | 'ai_generated' | 'user_submitted';
  category: string;
  wordCount: number;
  characterCount: number;
}

export interface TypingSession {
  id: string;
  userId: string;
  textId: string;
  text?: Text;
  startedAt: string;
  completedAt?: string;
  wpm?: number;
  rawWpm?: number;
  accuracy?: number;
  mistakesCount: number;
  isCompleted: boolean;
}

export interface RaceParticipant {
  id: string;
  raceId: string;
  userId: string;
  user: User;
  progress: number;
  wpm: number;
  accuracy: number;
  finishedAt?: string;
  rank?: number;
  isReady: boolean;
  isDnf?: boolean;
}

export interface Race {
  id: string;
  textId: string;
  text: Text;
  status: 'waiting' | 'countdown' | 'in_progress' | 'completed';
  maxParticipants: number;
  durationSeconds: number;
  creatorId?: string;
  isPrivate?: boolean;
  inviteCode?: string;
  fillWithBots?: boolean;
  startedAt?: string;
  completedAt?: string;
  participants: RaceParticipant[];
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface Mistake {
  position: number;
  expected: string;
  actual: string;
}
