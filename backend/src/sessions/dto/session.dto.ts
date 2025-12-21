import {
  IsUUID,
  IsNumber,
  IsArray,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class StartSessionDto {
  @ApiProperty({ description: 'Text ID to practice' })
  @IsUUID()
  textId: string;
}

class MistakeDto {
  @IsNumber()
  position: number;

  @ApiProperty()
  expected: string;

  @ApiProperty()
  actual: string;
}

export class CompleteSessionDto {
  @ApiProperty({ example: 65.5 })
  @IsNumber()
  @Min(0)
  wpm: number;

  @ApiProperty({ example: 72.3 })
  @IsNumber()
  @Min(0)
  rawWpm: number;

  @ApiProperty({ example: 98.5 })
  @IsNumber()
  @Min(0)
  @Max(100)
  accuracy: number;

  @ApiProperty({ example: 3 })
  @IsNumber()
  @Min(0)
  mistakesCount: number;

  @ApiProperty({ type: [MistakeDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MistakeDto)
  mistakesData: MistakeDto[];

  @ApiProperty({ example: 45000, description: 'Time in milliseconds' })
  @IsNumber()
  @Min(0)
  timeMs: number;
}
