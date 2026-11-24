import { Injectable } from '@nestjs/common';
import { HealthResponseDto } from './dto/health-response.dto.js';

@Injectable()
export class HealthService {
  getHealth(): HealthResponseDto {
    return {
      status: 'ok',
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }
}
