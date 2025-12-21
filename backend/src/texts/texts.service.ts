import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Text, TextDifficulty, TextSource } from '../database/entities';
import { OpenAIService } from './openai.service';

@Injectable()
export class TextsService implements OnModuleInit {
  constructor(
    @InjectRepository(Text)
    private textsRepository: Repository<Text>,
    private openaiService: OpenAIService,
  ) {}

  async onModuleInit() {
    // Seed default texts if none exist
    const count = await this.textsRepository.count();
    if (count === 0) {
      await this.seedDefaultTexts();
    }
  }

  private async seedDefaultTexts() {
    const defaultTexts = [
      {
        title: 'The Quick Brown Fox',
        content: 'The quick brown fox jumps over the lazy dog. This sentence contains every letter of the alphabet at least once.',
        difficulty: TextDifficulty.EASY,
        category: 'classic',
      },
      {
        title: 'Programming Basics',
        content: 'Programming is the art of telling a computer what to do. It requires patience, logic, and creativity. Every great program starts with a simple idea.',
        difficulty: TextDifficulty.EASY,
        category: 'technology',
      },
      {
        title: 'The Ocean',
        content: 'The ocean covers more than seventy percent of the Earth surface. It is home to countless species of marine life, from tiny plankton to massive whales. The deep sea remains one of the least explored frontiers on our planet.',
        difficulty: TextDifficulty.MEDIUM,
        category: 'nature',
      },
      {
        title: 'Coffee Culture',
        content: 'Coffee has become an integral part of modern society. From small cafes to global chains, the aroma of freshly brewed coffee fills the air. Each cup tells a story of farmers, roasters, and baristas working together to deliver that perfect morning boost.',
        difficulty: TextDifficulty.MEDIUM,
        category: 'lifestyle',
      },
      {
        title: 'Artificial Intelligence',
        content: 'Artificial intelligence represents one of the most transformative technologies of our era. Machine learning algorithms can now recognize patterns, make predictions, and even generate creative content. As these systems become more sophisticated, they raise profound questions about the nature of intelligence itself.',
        difficulty: TextDifficulty.HARD,
        category: 'technology',
      },
      {
        title: 'The Stars Above',
        content: 'When we gaze at the night sky, we witness light that has traveled for millions of years. Each star represents a sun, potentially hosting planets and perhaps even life. The vastness of space reminds us of our place in the cosmic dance.',
        difficulty: TextDifficulty.MEDIUM,
        category: 'science',
      },
      {
        title: 'Philosophical Inquiry',
        content: 'Philosophy challenges us to question our fundamental assumptions about reality, knowledge, and existence. Through rigorous logical analysis and contemplation, philosophers have shaped human understanding across millennia. The unexamined life, as Socrates proclaimed, is not worth living.',
        difficulty: TextDifficulty.HARD,
        category: 'philosophy',
      },
      {
        title: 'Morning Routine',
        content: 'A good day begins with a good morning. Wake up early, stretch your body, and take a few deep breaths. A simple routine can set the tone for success.',
        difficulty: TextDifficulty.EASY,
        category: 'lifestyle',
      },
    ];

    for (const textData of defaultTexts) {
      const text = this.textsRepository.create({
        ...textData,
        source: TextSource.BUILT_IN,
        wordCount: textData.content.split(/\s+/).length,
        characterCount: textData.content.length,
      });
      await this.textsRepository.save(text);
    }
  }

  async findAll(difficulty?: TextDifficulty): Promise<Text[]> {
    const query = this.textsRepository.createQueryBuilder('text');

    if (difficulty) {
      query.where('text.difficulty = :difficulty', { difficulty });
    }

    return query.orderBy('text.createdAt', 'DESC').getMany();
  }

  async findById(id: string): Promise<Text | null> {
    return this.textsRepository.findOne({ where: { id } });
  }

  async findRandom(difficulty?: TextDifficulty): Promise<Text | null> {
    const query = this.textsRepository.createQueryBuilder('text');

    if (difficulty) {
      query.where('text.difficulty = :difficulty', { difficulty });
    }

    const count = await query.getCount();
    if (count === 0) return null;

    const randomOffset = Math.floor(Math.random() * count);
    return query.offset(randomOffset).limit(1).getOne();
  }

  async create(data: {
    content: string;
    title?: string;
    difficulty: TextDifficulty;
    source: TextSource;
    category?: string;
  }): Promise<Text> {
    const text = this.textsRepository.create({
      ...data,
      wordCount: data.content.split(/\s+/).length,
      characterCount: data.content.length,
    });
    return this.textsRepository.save(text);
  }

  async generateWithAI(
    difficulty: TextDifficulty,
    category?: string,
  ): Promise<Text | null> {
    const generated = await this.openaiService.generateTypingText(
      difficulty,
      category,
    );

    if (!generated) return null;

    return this.create({
      content: generated.content,
      title: generated.title,
      difficulty,
      source: TextSource.AI_GENERATED,
      category,
    });
  }

  async generateTargetedPractice(
    weakCharacters: string[],
  ): Promise<{ text: Text; stats?: { targetedCharacters: string[]; characterFrequency: Record<string, number> } } | null> {
    // Convert display names back to actual characters
    const chars = weakCharacters.map((c) => (c === 'space' ? ' ' : c));

    const generated = await this.openaiService.generateTextForWeaknesses(chars);

    if (!generated) return null;

    const text = await this.create({
      content: generated.content,
      title: `Practice: ${weakCharacters.slice(0, 3).join(', ')}`,
      difficulty: TextDifficulty.MEDIUM,
      source: TextSource.AI_GENERATED,
      category: 'targeted_practice',
    });

    return {
      text,
      stats: generated.stats,
    };
  }
}
