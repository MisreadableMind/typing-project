import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Race, RaceParticipant } from '../database/entities';
import { RacesService } from './races.service';
import { RacesController } from './races.controller';
import { RacesGateway } from './races.gateway';
import { TextsModule } from '../texts/texts.module';
import { UsersModule } from '../users/users.module';
import { BotsModule } from '../bots/bots.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Race, RaceParticipant]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET', 'dev-secret-change-me'),
      }),
    }),
    TextsModule,
    UsersModule,
    BotsModule,
  ],
  controllers: [RacesController],
  providers: [RacesService, RacesGateway],
  exports: [RacesService],
})
export class RacesModule {}
