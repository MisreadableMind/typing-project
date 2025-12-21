import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../database/entities';

// Bot personalities with different skill levels
const BOT_PROFILES = [
  // Rookies (30-50 WPM, 85-92% accuracy)
  { name: 'SlowPoke_Steve', difficulty: 'rookie' as const, wpmRange: [30, 40], accuracy: [85, 90], color: '#6B7280' },
  { name: 'TypeNewbie', difficulty: 'rookie' as const, wpmRange: [35, 45], accuracy: [86, 91], color: '#9CA3AF' },
  { name: 'KeyboardKid', difficulty: 'rookie' as const, wpmRange: [32, 42], accuracy: [84, 89], color: '#D1D5DB' },
  { name: 'HuntNPeck', difficulty: 'rookie' as const, wpmRange: [28, 38], accuracy: [82, 88], color: '#78716C' },

  // Average (50-75 WPM, 92-96% accuracy)
  { name: 'TyperTom', difficulty: 'average' as const, wpmRange: [50, 65], accuracy: [92, 95], color: '#3B82F6' },
  { name: 'KeyMaster', difficulty: 'average' as const, wpmRange: [55, 70], accuracy: [93, 96], color: '#2563EB' },
  { name: 'SwiftFingers', difficulty: 'average' as const, wpmRange: [52, 68], accuracy: [91, 94], color: '#1D4ED8' },
  { name: 'TypingTina', difficulty: 'average' as const, wpmRange: [58, 72], accuracy: [92, 95], color: '#60A5FA' },

  // Pro (75-100 WPM, 96-98% accuracy)
  { name: 'SpeedDemon', difficulty: 'pro' as const, wpmRange: [75, 90], accuracy: [96, 98], color: '#10B981' },
  { name: 'RapidRick', difficulty: 'pro' as const, wpmRange: [80, 95], accuracy: [95, 97], color: '#059669' },
  { name: 'QuickQuentin', difficulty: 'pro' as const, wpmRange: [78, 92], accuracy: [96, 98], color: '#047857' },
  { name: 'VelocityVic', difficulty: 'pro' as const, wpmRange: [82, 98], accuracy: [95, 97], color: '#34D399' },

  // Legend (100-140 WPM, 98-100% accuracy)
  { name: 'THE_MACHINE', difficulty: 'legend' as const, wpmRange: [100, 120], accuracy: [98, 99], color: '#F59E0B' },
  { name: 'LightningLou', difficulty: 'legend' as const, wpmRange: [110, 130], accuracy: [98, 100], color: '#D97706' },
  { name: 'TypeGod_9000', difficulty: 'legend' as const, wpmRange: [105, 125], accuracy: [99, 100], color: '#B45309' },
  { name: 'UNSTOPPABLE', difficulty: 'legend' as const, wpmRange: [115, 140], accuracy: [98, 99], color: '#FBBF24' },
];

export interface BotTypingState {
  odId: string;
  username: string;
  targetWpm: number;
  targetAccuracy: number;
  currentProgress: number;
  currentWpm: number;
  currentAccuracy: number;
  intervalId?: NodeJS.Timeout;
}

@Injectable()
export class BotsService implements OnModuleInit {
  private botUsers: User[] = [];

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async onModuleInit() {
    await this.ensureBotsExist();
  }

  private async ensureBotsExist() {
    for (const profile of BOT_PROFILES) {
      let bot = await this.usersRepository.findOne({
        where: { username: profile.name, isBot: true },
      });

      if (!bot) {
        bot = this.usersRepository.create({
          username: profile.name,
          isBot: true,
          botDifficulty: profile.difficulty,
          avatarColor: profile.color,
          averageWpm: (profile.wpmRange[0] + profile.wpmRange[1]) / 2,
          averageAccuracy: (profile.accuracy[0] + profile.accuracy[1]) / 2,
        });
        await this.usersRepository.save(bot);
      }

      this.botUsers.push(bot);
    }
  }

  // Get random bots of varied difficulty to fill a race
  async getBotsForRace(count: number, excludeIds: string[] = []): Promise<User[]> {
    const availableBots = this.botUsers.filter(
      (b) => !excludeIds.includes(b.id),
    );

    // Try to get a mix of difficulties
    const selected: User[] = [];
    const difficulties: ('rookie' | 'average' | 'pro' | 'legend')[] = [
      'rookie',
      'average',
      'average',
      'pro',
    ];

    for (let i = 0; i < count && availableBots.length > 0; i++) {
      // Prefer variety in difficulty
      const targetDifficulty = difficulties[i % difficulties.length];
      let bot = availableBots.find(
        (b) => b.botDifficulty === targetDifficulty && !selected.includes(b),
      );

      if (!bot) {
        // Fallback to any available bot
        bot = availableBots.find((b) => !selected.includes(b));
      }

      if (bot) {
        selected.push(bot);
      }
    }

    return selected;
  }

  // Get bot profile by user ID
  getBotProfile(userId: string) {
    const bot = this.botUsers.find((b) => b.id === userId);
    if (!bot) return null;

    const profile = BOT_PROFILES.find((p) => p.name === bot.username);
    return profile || null;
  }

  // Calculate bot typing progress for a given time elapsed
  calculateBotProgress(
    botId: string,
    textLength: number,
    elapsedMs: number,
  ): { progress: number; wpm: number; accuracy: number } | null {
    const profile = this.getBotProfile(botId);
    if (!profile) return null;

    // Add some randomness to the bot's performance
    const wpmVariance = Math.random() * 0.2 - 0.1; // -10% to +10%
    const baseWpm =
      profile.wpmRange[0] +
      Math.random() * (profile.wpmRange[1] - profile.wpmRange[0]);
    const actualWpm = baseWpm * (1 + wpmVariance);

    // Characters per minute = WPM * 5 (standard word length)
    const charsPerMinute = actualWpm * 5;
    const charsPerMs = charsPerMinute / 60000;

    // Calculate progress based on elapsed time
    const expectedChars = Math.floor(charsPerMs * elapsedMs);
    const progress = Math.min(expectedChars, textLength);

    // Add slight accuracy variation
    const accuracy =
      profile.accuracy[0] +
      Math.random() * (profile.accuracy[1] - profile.accuracy[0]);

    return {
      progress,
      wpm: Math.round(actualWpm),
      accuracy: Math.round(accuracy * 10) / 10,
    };
  }

  // Check if a user is a bot
  isBot(userId: string): boolean {
    return this.botUsers.some((b) => b.id === userId);
  }

  // Get all bot user IDs
  getBotIds(): string[] {
    return this.botUsers.map((b) => b.id);
  }
}
