import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Race } from './race.entity';

@Entity('race_participants')
export class RaceParticipant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  raceId: string;

  @Column('uuid')
  userId: string;

  @ManyToOne(() => Race, (race) => race.participants)
  @JoinColumn({ name: 'raceId' })
  race: Race;

  @ManyToOne(() => User, (user) => user.raceParticipants)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ default: 0 })
  progress: number; // characters typed correctly

  @Column({ type: 'decimal', precision: 6, scale: 2, default: 0 })
  wpm: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 100 })
  accuracy: number;

  @Column({ type: 'timestamp', nullable: true })
  finishedAt: Date;

  @Column({ nullable: true })
  rank: number;

  @Column({ default: false })
  isReady: boolean;

  @Column({ default: false })
  isDnf: boolean; // Did Not Finish - timed out

  @CreateDateColumn()
  createdAt: Date;
}
