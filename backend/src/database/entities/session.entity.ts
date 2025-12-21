import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Text } from './text.entity';

@Entity('typing_sessions')
export class TypingSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @Column('uuid')
  textId: string;

  @ManyToOne(() => User, (user) => user.sessions)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Text, (text) => text.sessions)
  @JoinColumn({ name: 'textId' })
  text: Text;

  @Column({ type: 'timestamp' })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true })
  wpm: number;

  @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true })
  rawWpm: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  accuracy: number;

  @Column({ default: 0 })
  mistakesCount: number;

  @Column({ type: 'jsonb', nullable: true })
  mistakesData: {
    position: number;
    expected: string;
    actual: string;
  }[];

  @Column({ default: false })
  isCompleted: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
