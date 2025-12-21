import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypingSession } from '../database/entities';
import { UsersService } from '../users/users.service';

export interface SessionResult {
  wpm: number;
  rawWpm: number;
  accuracy: number;
  mistakesCount: number;
  mistakesData: { position: number; expected: string; actual: string }[];
  timeMs: number;
}

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(TypingSession)
    private sessionsRepository: Repository<TypingSession>,
    private usersService: UsersService,
  ) {}

  async startSession(userId: string, textId: string): Promise<TypingSession> {
    const session = this.sessionsRepository.create({
      userId,
      textId,
      startedAt: new Date(),
    });
    return this.sessionsRepository.save(session);
  }

  async completeSession(
    sessionId: string,
    result: SessionResult,
  ): Promise<TypingSession> {
    const session = await this.sessionsRepository.findOne({
      where: { id: sessionId },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    session.completedAt = new Date();
    session.wpm = result.wpm;
    session.rawWpm = result.rawWpm;
    session.accuracy = result.accuracy;
    session.mistakesCount = result.mistakesCount;
    session.mistakesData = result.mistakesData;
    session.isCompleted = true;

    await this.sessionsRepository.save(session);

    // Update user stats
    await this.usersService.updateStats(
      session.userId,
      result.wpm,
      result.accuracy,
      false, // not a race win
    );

    return session;
  }

  async getUserSessions(
    userId: string,
    limit = 20,
  ): Promise<TypingSession[]> {
    return this.sessionsRepository.find({
      where: { userId, isCompleted: true },
      order: { completedAt: 'DESC' },
      take: limit,
      relations: ['text'],
    });
  }

  async getUserStats(userId: string): Promise<{
    totalSessions: number;
    averageWpm: number;
    bestWpm: number;
    averageAccuracy: number;
    totalTimeMinutes: number;
  }> {
    const result = await this.sessionsRepository
      .createQueryBuilder('session')
      .select('COUNT(*)', 'totalSessions')
      .addSelect('AVG(session.wpm)', 'averageWpm')
      .addSelect('MAX(session.wpm)', 'bestWpm')
      .addSelect('AVG(session.accuracy)', 'averageAccuracy')
      .where('session.userId = :userId', { userId })
      .andWhere('session.isCompleted = true')
      .getRawOne();

    // Calculate total time
    const sessions = await this.sessionsRepository.find({
      where: { userId, isCompleted: true },
      select: ['startedAt', 'completedAt'],
    });

    let totalTimeMs = 0;
    for (const session of sessions) {
      if (session.completedAt && session.startedAt) {
        totalTimeMs +=
          new Date(session.completedAt).getTime() -
          new Date(session.startedAt).getTime();
      }
    }

    return {
      totalSessions: parseInt(result.totalSessions) || 0,
      averageWpm: Math.round(parseFloat(result.averageWpm) || 0),
      bestWpm: Math.round(parseFloat(result.bestWpm) || 0),
      averageAccuracy: Math.round(parseFloat(result.averageAccuracy) || 0),
      totalTimeMinutes: Math.round(totalTimeMs / 60000),
    };
  }

  async getMistakeAnalysis(
    userId: string,
    limit = 50,
  ): Promise<{
    totalMistakes: number;
    characterBreakdown: { char: string; count: number; percentage: number }[];
    confusionPairs: { expected: string; typed: string; count: number }[];
    weakestCharacters: string[];
    recentTrend: 'improving' | 'declining' | 'stable';
  }> {
    // Get recent sessions with mistake data
    const sessions = await this.sessionsRepository.find({
      where: { userId, isCompleted: true },
      order: { completedAt: 'DESC' },
      take: limit,
      select: ['mistakesData', 'accuracy', 'completedAt'],
    });

    // Aggregate all mistakes
    const charCounts: Record<string, number> = {};
    const confusionMap: Record<string, number> = {};
    let totalMistakes = 0;

    for (const session of sessions) {
      if (session.mistakesData) {
        for (const mistake of session.mistakesData) {
          totalMistakes++;
          // Count by expected character
          charCounts[mistake.expected] = (charCounts[mistake.expected] || 0) + 1;
          // Count confusion pairs
          const pairKey = `${mistake.expected}→${mistake.actual}`;
          confusionMap[pairKey] = (confusionMap[pairKey] || 0) + 1;
        }
      }
    }

    // Build character breakdown sorted by frequency
    const characterBreakdown = Object.entries(charCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([char, count]) => ({
        char: char === ' ' ? 'space' : char,
        count,
        percentage: totalMistakes > 0 ? Math.round((count / totalMistakes) * 100) : 0,
      }));

    // Build confusion pairs sorted by frequency
    const confusionPairs = Object.entries(confusionMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([pair, count]) => {
        const [expected, typed] = pair.split('→');
        return {
          expected: expected === ' ' ? 'space' : expected,
          typed: typed === ' ' ? 'space' : typed,
          count,
        };
      });

    // Get top 5 weakest characters
    const weakestCharacters = characterBreakdown.slice(0, 5).map((c) => c.char);

    // Calculate recent trend (compare first half vs second half of sessions)
    let recentTrend: 'improving' | 'declining' | 'stable' = 'stable';
    if (sessions.length >= 10) {
      const half = Math.floor(sessions.length / 2);
      const recentSessions = sessions.slice(0, half);
      const olderSessions = sessions.slice(half);

      const recentAvg =
        recentSessions.reduce((sum, s) => sum + (s.accuracy || 0), 0) /
        recentSessions.length;
      const olderAvg =
        olderSessions.reduce((sum, s) => sum + (s.accuracy || 0), 0) /
        olderSessions.length;

      const diff = recentAvg - olderAvg;
      if (diff > 2) recentTrend = 'improving';
      else if (diff < -2) recentTrend = 'declining';
    }

    return {
      totalMistakes,
      characterBreakdown,
      confusionPairs,
      weakestCharacters,
      recentTrend,
    };
  }
}
