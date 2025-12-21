import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Text } from '../database/entities';
import { TextsService } from './texts.service';
import { TextsController } from './texts.controller';
import { OpenAIService } from './openai.service';

@Module({
  imports: [TypeOrmModule.forFeature([Text])],
  controllers: [TextsController],
  providers: [TextsService, OpenAIService],
  exports: [TextsService],
})
export class TextsModule {}
