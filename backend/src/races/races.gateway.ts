import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { RacesService } from './races.service';
import { UsersService } from '../users/users.service';
import { RaceStatus } from '../database/entities';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  username?: string;
  currentRaceId?: string;
}

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
  },
  namespace: '/races',
})
export class RacesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private countdownTimers: Map<string, NodeJS.Timeout> = new Map();
  private raceTimers: Map<string, NodeJS.Timeout> = new Map();
  private botSimulators: Map<string, NodeJS.Timeout[]> = new Map(); // Bot typing simulation timers

  constructor(
    private racesService: RacesService,
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = client.handshake.auth.token;
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      client.userId = payload.sub;
      client.username = payload.username;

      console.log(`Client connected: ${client.username}`);
    } catch {
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    if (client.currentRaceId && client.userId) {
      await this.racesService.leaveRace(client.currentRaceId, client.userId);
      this.server.to(client.currentRaceId).emit('playerLeft', {
        userId: client.userId,
        username: client.username,
      });

      // Update race state for remaining players
      const race = await this.racesService.getRaceWithParticipants(
        client.currentRaceId,
      );
      if (race) {
        this.server.to(client.currentRaceId).emit('raceState', race);
      }
    }
    console.log(`Client disconnected: ${client.username}`);
  }

  @SubscribeMessage('findRace')
  async handleFindRace(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { difficulty?: string },
  ) {
    if (!client.userId) return;

    try {
      const race = await this.racesService.findOrCreateWaitingRace(
        data.difficulty as any,
      );
      await this.racesService.joinRace(race.id, client.userId);

      client.currentRaceId = race.id;
      client.join(race.id);

      // Get updated race with participants
      const updatedRace = await this.racesService.getRaceWithParticipants(
        race.id,
      );

      // Notify all players in the race
      this.server.to(race.id).emit('raceState', updatedRace);
      this.server.to(race.id).emit('playerJoined', {
        userId: client.userId,
        username: client.username,
      });

      return { success: true, race: updatedRace };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  @SubscribeMessage('ready')
  async handleReady(@ConnectedSocket() client: AuthenticatedSocket) {
    if (!client.userId || !client.currentRaceId) return;

    await this.racesService.setReady(client.currentRaceId, client.userId);

    const race = await this.racesService.getRaceWithParticipants(
      client.currentRaceId,
    );

    this.server.to(client.currentRaceId).emit('raceState', race);

    // Check if all ready
    const allReady = await this.racesService.areAllReady(client.currentRaceId);

    if (allReady && race && race.participants.length >= 2) {
      await this.startCountdown(client.currentRaceId);
    }
  }

  private async startCountdown(raceId: string) {
    await this.racesService.startRace(raceId);

    let count = 3;
    this.server.to(raceId).emit('countdown', { count });

    const timer = setInterval(async () => {
      count--;

      if (count > 0) {
        this.server.to(raceId).emit('countdown', { count });
      } else {
        clearInterval(timer);
        this.countdownTimers.delete(raceId);

        await this.racesService.setInProgress(raceId);
        const race = await this.racesService.getRaceWithParticipants(raceId);

        this.server.to(raceId).emit('raceStart', { race });

        // Start race timer (120 seconds default)
        if (race) {
          this.startRaceTimer(raceId, race.durationSeconds);

          // Start bot simulation
          this.startBotSimulation(raceId, race.text.content.length);
        }
      }
    }, 1000);

    this.countdownTimers.set(raceId, timer);
  }

  private startRaceTimer(raceId: string, durationSeconds: number) {
    // Clear any existing timer
    const existingTimer = this.raceTimers.get(raceId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Emit time updates every second
    let remaining = durationSeconds;
    const tickInterval = setInterval(() => {
      remaining--;
      this.server.to(raceId).emit('raceTimer', { remaining, total: durationSeconds });

      if (remaining <= 0) {
        clearInterval(tickInterval);
      }
    }, 1000);

    // Set timeout for race end
    const timer = setTimeout(async () => {
      clearInterval(tickInterval);
      this.raceTimers.delete(raceId);
      this.stopBotSimulation(raceId);

      // Force complete the race
      const race = await this.racesService.forceCompleteRace(raceId);
      if (race) {
        this.server.to(raceId).emit('raceTimeout', { race });
        this.server.to(raceId).emit('raceComplete', { race });
      }
    }, durationSeconds * 1000);

    this.raceTimers.set(raceId, timer);
  }

  @SubscribeMessage('progress')
  async handleProgress(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody()
    data: { progress: number; wpm: number; accuracy: number },
  ) {
    if (!client.userId || !client.currentRaceId) return;

    await this.racesService.updateProgress(
      client.currentRaceId,
      client.userId,
      data.progress,
      data.wpm,
      data.accuracy,
    );

    // Broadcast to other players
    client.to(client.currentRaceId).emit('playerProgress', {
      userId: client.userId,
      username: client.username,
      progress: data.progress,
      wpm: data.wpm,
      accuracy: data.accuracy,
    });
  }

  @SubscribeMessage('finish')
  async handleFinish(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { wpm: number; accuracy: number; mistakes?: any[] },
  ) {
    if (!client.userId || !client.currentRaceId) return;

    const participant = await this.racesService.finishParticipant(
      client.currentRaceId,
      client.userId,
      data.wpm,
      data.accuracy,
    );

    this.server.to(client.currentRaceId).emit('playerFinished', {
      userId: client.userId,
      username: client.username,
      rank: participant.rank,
      wpm: data.wpm,
      accuracy: data.accuracy,
    });

    const race = await this.racesService.getRaceWithParticipants(
      client.currentRaceId,
    );

    if (race?.status === RaceStatus.COMPLETED) {
      // Clear the race timer since everyone finished
      const timer = this.raceTimers.get(client.currentRaceId);
      if (timer) {
        clearTimeout(timer);
        this.raceTimers.delete(client.currentRaceId);
      }
      this.stopBotSimulation(client.currentRaceId);

      this.server.to(client.currentRaceId).emit('raceComplete', { race });
    }
  }

  @SubscribeMessage('leaveRace')
  async handleLeaveRace(@ConnectedSocket() client: AuthenticatedSocket) {
    if (!client.userId || !client.currentRaceId) return;

    const raceId = client.currentRaceId;

    await this.racesService.leaveRace(raceId, client.userId);
    client.leave(raceId);
    client.currentRaceId = undefined;

    this.server.to(raceId).emit('playerLeft', {
      userId: client.userId,
      username: client.username,
    });

    const race = await this.racesService.getRaceWithParticipants(raceId);
    if (race) {
      this.server.to(raceId).emit('raceState', race);
    }

    return { success: true };
  }

  // Create a private race with invite code
  @SubscribeMessage('createPrivateRace')
  async handleCreatePrivateRace(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { difficulty?: string },
  ) {
    if (!client.userId) return;

    try {
      const race = await this.racesService.createPrivateRace(
        client.userId,
        data.difficulty as any,
      );
      await this.racesService.joinRace(race.id, client.userId);

      client.currentRaceId = race.id;
      client.join(race.id);

      const updatedRace = await this.racesService.getRaceWithParticipants(
        race.id,
      );

      this.server.to(race.id).emit('raceState', updatedRace);

      return { success: true, race: updatedRace, inviteCode: race.inviteCode };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  // Join a race by invite code
  @SubscribeMessage('joinByInvite')
  async handleJoinByInvite(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { inviteCode: string },
  ) {
    if (!client.userId) return;

    try {
      const race = await this.racesService.joinByInviteCode(
        data.inviteCode,
        client.userId,
      );

      if (!race) {
        return { success: false, error: 'Invalid or expired invite code' };
      }

      client.currentRaceId = race.id;
      client.join(race.id);

      this.server.to(race.id).emit('raceState', race);
      this.server.to(race.id).emit('playerJoined', {
        userId: client.userId,
        username: client.username,
      });

      return { success: true, race };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  // Creator starts the race (doesn't need to wait for all ready)
  @SubscribeMessage('creatorStart')
  async handleCreatorStart(@ConnectedSocket() client: AuthenticatedSocket) {
    if (!client.userId || !client.currentRaceId) return;

    const race = await this.racesService.getRaceWithParticipants(
      client.currentRaceId,
    );

    if (!race) return { success: false, error: 'Race not found' };

    // Check if user is the creator
    if (race.creatorId !== client.userId) {
      return { success: false, error: 'Only the race creator can force start' };
    }

    // Add bots to fill the race
    const botParticipants = await this.racesService.fillRaceWithBots(
      client.currentRaceId,
    );

    // Notify about bots joining
    for (const bot of botParticipants) {
      this.server.to(client.currentRaceId).emit('playerJoined', {
        userId: bot.userId,
        username: bot.user.username,
        isBot: true,
      });
    }

    // Update race state with bots
    const updatedRace = await this.racesService.getRaceWithParticipants(
      client.currentRaceId,
    );
    this.server.to(client.currentRaceId).emit('raceState', updatedRace);

    // Start the countdown
    await this.startCountdown(client.currentRaceId);

    return { success: true };
  }

  // Start bot typing simulation when race begins
  private startBotSimulation(raceId: string, textLength: number) {
    const botsService = this.racesService.getBotsService();
    const botIds = botsService.getBotIds();
    const raceStartTime = Date.now();
    const intervals: NodeJS.Timeout[] = [];

    // Get bot participants for this race
    this.racesService.getRaceWithParticipants(raceId).then((race) => {
      if (!race) return;

      const botParticipants = race.participants.filter((p) =>
        botIds.includes(p.userId),
      );

      for (const botParticipant of botParticipants) {
        // Each bot updates every 200-500ms with slight randomness
        const updateInterval = 200 + Math.random() * 300;

        const interval = setInterval(async () => {
          const elapsedMs = Date.now() - raceStartTime;
          const botProgress = botsService.calculateBotProgress(
            botParticipant.userId,
            textLength,
            elapsedMs,
          );

          if (!botProgress) return;

          // Update bot progress in DB
          await this.racesService.updateProgress(
            raceId,
            botParticipant.userId,
            botProgress.progress,
            botProgress.wpm,
            botProgress.accuracy,
          );

          // Broadcast bot progress
          this.server.to(raceId).emit('playerProgress', {
            userId: botParticipant.userId,
            username: botParticipant.user.username,
            progress: botProgress.progress,
            wpm: botProgress.wpm,
            accuracy: botProgress.accuracy,
          });

          // Check if bot finished
          if (botProgress.progress >= textLength) {
            clearInterval(interval);

            const participant = await this.racesService.finishParticipant(
              raceId,
              botParticipant.userId,
              botProgress.wpm,
              botProgress.accuracy,
            );

            this.server.to(raceId).emit('playerFinished', {
              userId: botParticipant.userId,
              username: botParticipant.user.username,
              rank: participant.rank,
              wpm: botProgress.wpm,
              accuracy: botProgress.accuracy,
            });

            // Check if race is complete
            const updatedRace =
              await this.racesService.getRaceWithParticipants(raceId);
            if (updatedRace?.status === RaceStatus.COMPLETED) {
              this.server.to(raceId).emit('raceComplete', { race: updatedRace });
            }
          }
        }, updateInterval);

        intervals.push(interval);
      }
    });

    this.botSimulators.set(raceId, intervals);
  }

  // Clean up bot simulators
  private stopBotSimulation(raceId: string) {
    const intervals = this.botSimulators.get(raceId);
    if (intervals) {
      intervals.forEach((interval) => clearInterval(interval));
      this.botSimulators.delete(raceId);
    }
  }
}
