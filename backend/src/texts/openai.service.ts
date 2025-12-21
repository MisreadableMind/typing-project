import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import { z } from 'zod';
import { TextDifficulty } from '../database/entities';

// Helper to work around TypeScript's overly strict type inference with zodTextFormat
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createTextFormat = (schema: z.ZodType, name: string): any =>
  zodTextFormat(schema as any, name);

// Define Zod schemas for structured outputs
const TypingTextSchema = z.object({
  title: z.string().describe('A short, engaging title for the typing text (2-5 words)'),
  content: z.string().describe('The typing practice text content'),
  topic: z.string().describe('The main topic or theme of the text'),
});

const WeaknessTextSchema = z.object({
  title: z.string().describe('A short title for the practice text'),
  content: z.string().describe('Text that emphasizes the problematic characters'),
  targetedCharacters: z.array(z.string()).describe('The characters that were targeted in this text'),
  characterFrequency: z.record(z.string(), z.number()).describe('Count of each targeted character in the text'),
});

type TypingText = z.infer<typeof TypingTextSchema>;
type WeaknessText = z.infer<typeof WeaknessTextSchema>;

@Injectable()
export class OpenAIService {
  private readonly logger = new Logger(OpenAIService.name);
  private openai: OpenAI | null = null;

  // Use the latest model that supports structured outputs
  private readonly MODEL = 'gpt-4o';

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    }
  }

  async generateTypingText(
    difficulty: TextDifficulty,
    category?: string,
  ): Promise<{ content: string; title: string } | null> {
    if (!this.openai) {
      this.logger.warn('OpenAI API key not configured');
      return null;
    }

    const difficultyGuide = {
      [TextDifficulty.EASY]: {
        wordCount: '30-50 words',
        description: 'simple words, short sentences, common vocabulary',
      },
      [TextDifficulty.MEDIUM]: {
        wordCount: '50-80 words',
        description: 'moderate complexity, varied sentence structure',
      },
      [TextDifficulty.HARD]: {
        wordCount: '80-120 words',
        description: 'complex vocabulary, longer sentences, technical terms allowed',
      },
    };

    const guide = difficultyGuide[difficulty];
    const categoryPrompt = category
      ? `The text should be about: ${category}.`
      : 'Choose an interesting topic like technology, nature, history, science, philosophy, or everyday life.';

    try {
      const response = await this.openai.responses.parse({
        model: this.MODEL,
        input: [
          {
            role: 'system',
            content: `You are a typing practice text generator. Generate engaging, grammatically correct text for typing practice.

Rules:
- Use proper punctuation and capitalization
- Only use common punctuation: . , ! ? ' " - : ;
- No special characters, URLs, emails, or code
- Make it interesting, educational, and fun to type
- The text should flow naturally and be coherent`,
          },
          {
            role: 'user',
            content: `Generate a typing practice text with these requirements:

Difficulty: ${difficulty}
- ${guide.description}
- Length: ${guide.wordCount}

${categoryPrompt}`,
          },
        ],
        text: {
          format: createTextFormat(TypingTextSchema, 'typing_text'),
        },
      });

      const result = response.output_parsed as TypingText | null;

      if (!result) {
        // Check for refusal
        const output = response.output?.[0];
        if (output && 'content' in output) {
          const content = output.content?.[0];
          if (content && 'refusal' in content) {
            this.logger.warn('OpenAI refused the request:', content.refusal);
          }
        }
        return null;
      }

      return {
        title: result.title,
        content: result.content,
      };
    } catch (error) {
      this.logger.error('Failed to generate text with OpenAI', error);
      return null;
    }
  }

  async generateTextForWeaknesses(
    problematicCharacters: string[],
  ): Promise<{ content: string; title: string; stats?: { targetedCharacters: string[]; characterFrequency: Record<string, number> } } | null> {
    if (!this.openai) {
      this.logger.warn('OpenAI API key not configured');
      return null;
    }

    if (problematicCharacters.length === 0) {
      return null;
    }

    try {
      const response = await this.openai.responses.parse({
        model: this.MODEL,
        input: [
          {
            role: 'system',
            content: `You are a typing practice text generator focused on helping users improve specific character weaknesses.

Your goal is to create natural, readable text that frequently uses the characters the user struggles with.
The text should:
- Be grammatically correct and coherent
- Feel natural to read, not forced
- Contain many instances of the problematic characters
- Be 50-80 words long
- Use proper punctuation`,
          },
          {
            role: 'user',
            content: `Generate a typing practice text that heavily features these characters the user struggles with: ${problematicCharacters.join(', ')}

Create a coherent paragraph that naturally incorporates words containing these characters as frequently as possible while still being readable and making sense.`,
          },
        ],
        text: {
          format: createTextFormat(WeaknessTextSchema, 'weakness_text'),
        },
      });

      const result = response.output_parsed as WeaknessText | null;

      if (!result) {
        const output = response.output?.[0];
        if (output && 'content' in output) {
          const content = output.content?.[0];
          if (content && 'refusal' in content) {
            this.logger.warn('OpenAI refused the request:', content.refusal);
          }
        }
        return null;
      }

      return {
        title: result.title,
        content: result.content,
        stats: {
          targetedCharacters: result.targetedCharacters,
          characterFrequency: result.characterFrequency,
        },
      };
    } catch (error) {
      this.logger.error('Failed to generate weakness text', error);
      return null;
    }
  }

  async generateMultipleTexts(
    count: number,
    difficulty: TextDifficulty,
    categories?: string[],
  ): Promise<{ content: string; title: string }[]> {
    if (!this.openai) {
      return [];
    }

    // Schema for multiple texts
    const MultipleTextsSchema = z.object({
      texts: z.array(TypingTextSchema).describe(`Array of ${count} typing practice texts`),
    });

    const categoryList = categories?.length
      ? `Choose from these topics: ${categories.join(', ')}`
      : 'Choose from varied interesting topics like technology, nature, history, science, philosophy, sports, cooking, travel, music, or art';

    try {
      const response = await this.openai.responses.parse({
        model: this.MODEL,
        input: [
          {
            role: 'system',
            content: `You are a typing practice text generator. Generate multiple engaging, grammatically correct texts for typing practice.

Each text should:
- Use proper punctuation and capitalization
- Only use common punctuation: . , ! ? ' " - : ;
- No special characters, URLs, emails, or code
- Be unique and cover different topics
- Flow naturally and be coherent`,
          },
          {
            role: 'user',
            content: `Generate ${count} different typing practice texts.

Difficulty: ${difficulty}
Each text should be unique and cover a different topic.
${categoryList}`,
          },
        ],
        text: {
          format: createTextFormat(MultipleTextsSchema, 'multiple_texts'),
        },
      });

      const result = response.output_parsed as { texts: TypingText[] } | null;

      if (!result?.texts) {
        return [];
      }

      return result.texts.map((t) => ({
        title: t.title,
        content: t.content,
      }));
    } catch (error) {
      this.logger.error('Failed to generate multiple texts', error);
      return [];
    }
  }
}
