import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiDataResponse } from '../../common/decorators/api-data-response.decorator.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { HealthResponseDto } from './dto/health-response.dto.js';
import { HealthService } from './health.service.js';

@ApiTags('Health')
@Public()
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Check that the API and database are running' })
  @ApiDataResponse(HealthResponseDto)
  getHealth(): Promise<HealthResponseDto> {
    return this.healthService.getHealth();
  }
}
