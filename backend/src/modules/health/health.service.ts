import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service.js';
import { HealthResponseDto } from './dto/health-response.dto.js';

const DATABASE_TIMEOUT_MS = 5000;

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(private readonly supabase: SupabaseService) {}

  async getHealth(): Promise<HealthResponseDto> {
    const isDatabaseUp = await this.isDatabaseUp();

    return {
      status: isDatabaseUp ? 'ok' : 'degraded',
      database: isDatabaseUp ? 'up' : 'down',
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }

  // Reads at most one ID and never returns it, so the system client is safe here.
  private async isDatabaseUp(): Promise<boolean> {
    const { error } = await this.supabase
      .asSystem()
      .from('profiles')
      .select('id')
      .limit(1)
      .abortSignal(AbortSignal.timeout(DATABASE_TIMEOUT_MS));

    if (error) {
      this.logger.error(`Database check failed: ${error.message}`);
    }
    return !error;
  }
}
