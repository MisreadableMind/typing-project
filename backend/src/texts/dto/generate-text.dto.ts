import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TextDifficulty } from '../../database/entities';

export class GenerateTextDto {
  @ApiProperty({ enum: TextDifficulty, default: TextDifficulty.MEDIUM })
  @IsEnum(TextDifficulty)
  difficulty: TextDifficulty;

  @ApiProperty({ required: false, example: 'technology' })
  @IsOptional()
  @IsString()
  category?: string;
}
