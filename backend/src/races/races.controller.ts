import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RacesService } from './races.service';

@ApiTags('races')
@Controller('api/races')
export class RacesController {
  constructor(private racesService: RacesService) {}

  @Get()
  @ApiOperation({ summary: 'Get active races' })
  async getActiveRaces() {
    return this.racesService.getActiveRaces();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get race by ID' })
  async getRace(@Param('id') id: string) {
    return this.racesService.getRaceWithParticipants(id);
  }
}
