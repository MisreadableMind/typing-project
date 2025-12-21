import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Race, RaceParticipant, RaceStatus, TextDifficulty } from '../database/entities';
import { TextsService } from '../texts/texts.service';
import { UsersService } from '../users/users.service';
import { BotsService } from '../bots/bots.service';
import { nanoid } from 'nanoid';

@Injectable()
export class RacesService {
  constructor(
    @InjectRepository(Race)
    private racesRepository: Repository<Race>,
    @InjectRepository(RaceParticipant)
    private participantsRepository: Repository<RaceParticipant>,
    private textsService: TextsService,
    private usersService: UsersService,
    private botsService: BotsService,
  ) {}

  async findOrCreateWaitingRace(difficulty?: TextDifficulty): Promise<Race> {
    // Find an existing race that's waiting for players
    let race = await this.racesRepository.findOne({
      where: { status: RaceStatus.WAITING },
      relations: ['participants', 'participants.user', 'text'],
    });

    if (race && race.participants.length < race.maxParticipants) {
      return race;
    }

    // Create a new race
    const text = await this.textsService.findRandom(difficulty);
    if (!text) {
      throw new Error('No texts available');
    }

    race = this.racesRepository.create({
      textId: text.id,
      status: RaceStatus.WAITING,
      maxParticipants: 5,
    });

    race = await this.racesRepository.save(race);
    race.text = text;
    race.participants = [];

    return race;
  }

  async joinRace(raceId: string, userId: string): Promise<RaceParticipant> {
    const race = await this.racesRepository.findOne({
      where: { id: raceId },
      relations: ['participants'],
    });

    if (!race) {
      throw new NotFoundException('Race not found');
    }

    // Check if already joined
    const existing = await this.participantsRepository.findOne({
      where: { raceId, userId },
    });

    if (existing) {
      return existing;
    }

    if (race.participants.length >= race.maxParticipants) {
      throw new Error('Race is full');
    }

    const participant = this.participantsRepository.create({
      raceId,
      userId,
      progress: 0,
      wpm: 0,
      accuracy: 100,
      isReady: false,
    });

    return this.participantsRepository.save(participant);
  }

  async leaveRace(raceId: string, userId: string): Promise<void> {
    await this.participantsRepository.delete({ raceId, userId });

    // Check if race is empty, delete if so
    const participants = await this.participantsRepository.count({
      where: { raceId },
    });

    if (participants === 0) {
      await this.racesRepository.delete(raceId);
    }
  }

  async setReady(raceId: string, userId: string): Promise<RaceParticipant> {
    const participant = await this.participantsRepository.findOne({
      where: { raceId, userId },
    });

    if (!participant) {
      throw new NotFoundException('Participant not found');
    }

    participant.isReady = true;
    return this.participantsRepository.save(participant);
  }

  async getRaceWithParticipants(raceId: string): Promise<Race | null> {
    return this.racesRepository.findOne({
      where: { id: raceId },
      relations: ['participants', 'participants.user', 'text'],
    });
  }

  async areAllReady(raceId: string): Promise<boolean> {
    const race = await this.racesRepository.findOne({
      where: { id: raceId },
      relations: ['participants'],
    });

    if (!race || race.participants.length < 2) {
      return false;
    }

    return race.participants.every((p) => p.isReady);
  }

  async startRace(raceId: string): Promise<Race> {
    const race = await this.racesRepository.findOne({
      where: { id: raceId },
    });

    if (!race) {
      throw new NotFoundException('Race not found');
    }

    race.status = RaceStatus.COUNTDOWN;
    return this.racesRepository.save(race);
  }

  async setInProgress(raceId: string): Promise<Race> {
    const race = await this.racesRepository.findOne({
      where: { id: raceId },
    });

    if (!race) {
      throw new NotFoundException('Race not found');
    }

    race.status = RaceStatus.IN_PROGRESS;
    race.startedAt = new Date();
    return this.racesRepository.save(race);
  }

  async updateProgress(
    raceId: string,
    userId: string,
    progress: number,
    wpm: number,
    accuracy: number,
  ): Promise<RaceParticipant> {
    const participant = await this.participantsRepository.findOne({
      where: { raceId, userId },
    });

    if (!participant) {
      throw new NotFoundException('Participant not found');
    }

    participant.progress = progress;
    participant.wpm = wpm;
    participant.accuracy = accuracy;

    return this.participantsRepository.save(participant);
  }

  async finishParticipant(
    raceId: string,
    userId: string,
    wpm: number,
    accuracy: number,
  ): Promise<RaceParticipant> {
    const participant = await this.participantsRepository.findOne({
      where: { raceId, userId },
    });

    if (!participant) {
      throw new NotFoundException('Participant not found');
    }

    participant.finishedAt = new Date();
    participant.wpm = wpm;
    participant.accuracy = accuracy;

    // Calculate rank
    const finishedCount = await this.participantsRepository.count({
      where: { raceId },
    });

    const finishedBefore = await this.participantsRepository
      .createQueryBuilder('p')
      .where('p.raceId = :raceId', { raceId })
      .andWhere('p.finishedAt IS NOT NULL')
      .andWhere('p.userId != :userId', { userId })
      .getCount();

    participant.rank = finishedBefore + 1;

    await this.participantsRepository.save(participant);

    // Update user stats
    await this.usersService.updateStats(
      userId,
      wpm,
      accuracy,
      participant.rank === 1,
    );

    // Check if race is complete
    await this.checkRaceComplete(raceId);

    return participant;
  }

  private async checkRaceComplete(raceId: string): Promise<void> {
    const race = await this.racesRepository.findOne({
      where: { id: raceId },
      relations: ['participants'],
    });

    if (!race) return;

    const allFinished = race.participants.every((p) => p.finishedAt || p.isDnf);

    if (allFinished) {
      race.status = RaceStatus.COMPLETED;
      race.completedAt = new Date();
      await this.racesRepository.save(race);
    }
  }

  async forceCompleteRace(raceId: string): Promise<Race | null> {
    const race = await this.racesRepository.findOne({
      where: { id: raceId },
      relations: ['participants', 'participants.user', 'text'],
    });

    if (!race || race.status !== RaceStatus.IN_PROGRESS) return null;

    // Count how many already finished
    const finishedCount = race.participants.filter((p) => p.finishedAt).length;

    // Mark unfinished participants as DNF and assign ranks
    for (const participant of race.participants) {
      if (!participant.finishedAt) {
        participant.isDnf = true;
        // DNF players are ranked after finishers, by progress
        const dnfParticipants = race.participants
          .filter((p) => !p.finishedAt)
          .sort((a, b) => b.progress - a.progress);

        const dnfIndex = dnfParticipants.findIndex((p) => p.id === participant.id);
        participant.rank = finishedCount + dnfIndex + 1;

        await this.participantsRepository.save(participant);

        // Still update user stats for DNF (with their current WPM/accuracy)
        await this.usersService.updateStats(
          participant.userId,
          participant.wpm,
          participant.accuracy,
          false, // DNF = not a win
        );
      }
    }

    // Mark race as complete
    race.status = RaceStatus.COMPLETED;
    race.completedAt = new Date();
    await this.racesRepository.save(race);

    // Return updated race
    return this.racesRepository.findOne({
      where: { id: raceId },
      relations: ['participants', 'participants.user', 'text'],
    });
  }

  async getActiveRaces(): Promise<Race[]> {
    return this.racesRepository.find({
      where: [
        { status: RaceStatus.WAITING },
        { status: RaceStatus.COUNTDOWN },
        { status: RaceStatus.IN_PROGRESS },
      ],
      relations: ['participants', 'participants.user', 'text'],
      order: { createdAt: 'DESC' },
    });
  }

  // Create a private race with invite code
  async createPrivateRace(
    creatorId: string,
    difficulty?: TextDifficulty,
  ): Promise<Race> {
    const text = await this.textsService.findRandom(difficulty);
    if (!text) {
      throw new Error('No texts available');
    }

    const inviteCode = nanoid(8).toUpperCase(); // e.g., "ABCD1234"

    const race = this.racesRepository.create({
      textId: text.id,
      status: RaceStatus.WAITING,
      maxParticipants: 5,
      creatorId,
      isPrivate: true,
      inviteCode,
      fillWithBots: true,
    });

    const savedRace = await this.racesRepository.save(race);
    savedRace.text = text;
    savedRace.participants = [];

    return savedRace;
  }

  // Join a race by invite code
  async joinByInviteCode(
    inviteCode: string,
    userId: string,
  ): Promise<Race | null> {
    const race = await this.racesRepository.findOne({
      where: { inviteCode: inviteCode.toUpperCase(), status: RaceStatus.WAITING },
      relations: ['participants', 'participants.user', 'text'],
    });

    if (!race) return null;

    await this.joinRace(race.id, userId);

    return this.getRaceWithParticipants(race.id);
  }

  // Add bots to fill a race
  async fillRaceWithBots(raceId: string): Promise<RaceParticipant[]> {
    const race = await this.racesRepository.findOne({
      where: { id: raceId },
      relations: ['participants'],
    });

    if (!race) return [];

    const realPlayerCount = race.participants.filter(
      (p) => !this.botsService.isBot(p.userId),
    ).length;

    // Only add bots if fewer than 5 real players
    if (realPlayerCount >= 5) return [];

    // Add 2-4 bots depending on player count
    const botsToAdd = Math.min(4, 5 - realPlayerCount);
    const existingUserIds = race.participants.map((p) => p.userId);

    const bots = await this.botsService.getBotsForRace(botsToAdd, existingUserIds);
    const botParticipants: RaceParticipant[] = [];

    for (const bot of bots) {
      const participant = this.participantsRepository.create({
        raceId,
        userId: bot.id,
        progress: 0,
        wpm: 0,
        accuracy: 100,
        isReady: true, // Bots are always ready
      });
      const saved = await this.participantsRepository.save(participant);
      saved.user = bot;
      botParticipants.push(saved);
    }

    return botParticipants;
  }

  // Check if user is the race creator
  isRaceCreator(race: Race, userId: string): boolean {
    return race.creatorId === userId;
  }

  // Get race by invite code
  async getRaceByInviteCode(inviteCode: string): Promise<Race | null> {
    return this.racesRepository.findOne({
      where: { inviteCode: inviteCode.toUpperCase() },
      relations: ['participants', 'participants.user', 'text'],
    });
  }

  // Get bot service for gateway use
  getBotsService(): BotsService {
    return this.botsService;
  }
}
