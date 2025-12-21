import { Controller, Get, Post, Query, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { TextsService } from './texts.service';
import { TextDifficulty } from '../database/entities';
import { GenerateTextDto } from './dto/generate-text.dto';

@ApiTags('texts')
@Controller('api/texts')
export class TextsController {
  constructor(private textsService: TextsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all texts' })
  @ApiQuery({ name: 'difficulty', required: false, enum: TextDifficulty })
  async findAll(@Query('difficulty') difficulty?: TextDifficulty) {
    return this.textsService.findAll(difficulty);
  }

  @Get('random')
  @ApiOperation({ summary: 'Get a random text' })
  @ApiQuery({ name: 'difficulty', required: false, enum: TextDifficulty })
  async findRandom(@Query('difficulty') difficulty?: TextDifficulty) {
    return this.textsService.findRandom(difficulty);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get text by ID' })
  async findById(@Param('id') id: string) {
    return this.textsService.findById(id);
  }

  @Post('generate')
  @ApiOperation({ summary: 'Generate a new text using AI' })
  async generate(@Body() dto: GenerateTextDto) {
    return this.textsService.generateWithAI(dto.difficulty, dto.category);
  }

  @Post('generate-targeted')
  @ApiOperation({ summary: 'Generate practice text targeting specific weak characters' })
  async generateTargeted(
    @Body() body: { characters: string[] },
  ) {
    return this.textsService.generateTargetedPractice(body.characters);
  }
}
