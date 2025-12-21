import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { TypingSession } from './session.entity';
import { RaceParticipant } from './race-participant.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column({ nullable: true })
  avatarColor: string;

  @Column({ type: 'decimal', precision: 6, scale: 2, default: 0 })
  bestWpm: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  averageWpm: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  averageAccuracy: number;

  @Column({ default: 0 })
  totalRaces: number;

  @Column({ default: 0 })
  racesWon: number;

  @Column({ default: false })
  isBot: boolean;

  @Column({ nullable: true })
  botDifficulty: 'rookie' | 'average' | 'pro' | 'legend'; // Bot skill level

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => TypingSession, (session) => session.user)
  sessions: TypingSession[];

  @OneToMany(() => RaceParticipant, (participant) => participant.user)
  raceParticipants: RaceParticipant[];
}
