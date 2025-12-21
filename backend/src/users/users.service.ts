import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../database/entities';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  private generateAvatarColor(): string {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
      '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
      '#BB8FCE', '#85C1E9', '#F8B500', '#00CED1',
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  async create(username: string): Promise<User> {
    const user = this.usersRepository.create({
      username,
      avatarColor: this.generateAvatarColor(),
    });
    return this.usersRepository.save(user);
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { username } });
  }

  async updateStats(
    userId: string,
    wpm: number,
    accuracy: number,
    won: boolean,
  ): Promise<void> {
    const user = await this.findById(userId);
    if (!user) return;

    const newTotalRaces = user.totalRaces + 1;
    const newAverageWpm =
      (user.averageWpm * user.totalRaces + wpm) / newTotalRaces;
    const newAverageAccuracy =
      (user.averageAccuracy * user.totalRaces + accuracy) / newTotalRaces;

    await this.usersRepository.update(userId, {
      totalRaces: newTotalRaces,
      racesWon: won ? user.racesWon + 1 : user.racesWon,
      averageWpm: Math.round(newAverageWpm * 100) / 100,
      averageAccuracy: Math.round(newAverageAccuracy * 100) / 100,
      bestWpm: Math.max(user.bestWpm, wpm),
    });
  }

  async getLeaderboard(limit = 10): Promise<User[]> {
    return this.usersRepository.find({
      order: { bestWpm: 'DESC' },
      take: limit,
    });
  }
}
