import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Text } from './text.entity';
import { RaceParticipant } from './race-participant.entity';

export enum RaceStatus {
  WAITING = 'waiting',
  COUNTDOWN = 'countdown',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

@Entity('races')
export class Race {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  textId: string;

  @ManyToOne(() => Text, (text) => text.races)
  @JoinColumn({ name: 'textId' })
  text: Text;

  @Column({
    type: 'enum',
    enum: RaceStatus,
    default: RaceStatus.WAITING,
  })
  status: RaceStatus;

  @Column({ default: 5 })
  maxParticipants: number;

  @Column({ default: 120 })
  durationSeconds: number; // Race duration in seconds (default 2 minutes)

  @Column({ nullable: true })
  creatorId: string; // User who created/owns this race

  @Column({ default: false })
  isPrivate: boolean; // Private races require invite code

  @Column({ nullable: true, unique: true })
  inviteCode: string; // Unique code for inviting friends

  @Column({ default: false })
  fillWithBots: boolean; // Auto-fill with bots when race starts

  @Column({ type: 'timestamp', nullable: true })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => RaceParticipant, (participant) => participant.race)
  participants: RaceParticipant[];
}
