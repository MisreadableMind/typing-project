import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { TypingSession } from './session.entity';
import { Race } from './race.entity';

export enum TextDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

export enum TextSource {
  BUILT_IN = 'built_in',
  AI_GENERATED = 'ai_generated',
  USER_SUBMITTED = 'user_submitted',
}

@Entity('texts')
export class Text {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  content: string;

  @Column({ nullable: true })
  title: string;

  @Column({
    type: 'enum',
    enum: TextDifficulty,
    default: TextDifficulty.MEDIUM,
  })
  difficulty: TextDifficulty;

  @Column({
    type: 'enum',
    enum: TextSource,
    default: TextSource.BUILT_IN,
  })
  source: TextSource;

  @Column({ nullable: true })
  category: string;

  @Column()
  wordCount: number;

  @Column()
  characterCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => TypingSession, (session) => session.text)
  sessions: TypingSession[];

  @OneToMany(() => Race, (race) => race.text)
  races: Race[];
}
