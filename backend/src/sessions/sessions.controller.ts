import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SessionsService } from './sessions.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../database/entities';
import { StartSessionDto, CompleteSessionDto } from './dto/session.dto';

@ApiTags('sessions')
@Controller('api/sessions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SessionsController {
  constructor(private sessionsService: SessionsService) {}

  @Post()
  @ApiOperation({ summary: 'Start a new typing session' })
  async startSession(
    @CurrentUser() user: User,
    @Body() dto: StartSessionDto,
  ) {
    return this.sessionsService.startSession(user.id, dto.textId);
  }

  @Put(':id/complete')
  @ApiOperation({ summary: 'Complete a typing session' })
  async completeSession(
    @Param('id') id: string,
    @Body() dto: CompleteSessionDto,
  ) {
    return this.sessionsService.completeSession(id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get user typing sessions' })
  async getUserSessions(
    @CurrentUser() user: User,
    @Query('limit') limit = 20,
  ) {
    return this.sessionsService.getUserSessions(user.id, limit);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get user statistics' })
  async getUserStats(@CurrentUser() user: User) {
    return this.sessionsService.getUserStats(user.id);
  }

  @Get('mistakes')
  @ApiOperation({ summary: 'Get mistake analysis for targeted practice' })
  async getMistakeAnalysis(
    @CurrentUser() user: User,
    @Query('limit') limit = 50,
  ) {
    return this.sessionsService.getMistakeAnalysis(user.id, limit);
  }
}
