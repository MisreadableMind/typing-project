import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../database/entities';
import { BotsService } from './bots.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [BotsService],
  exports: [BotsService],
})
export class BotsModule {}
