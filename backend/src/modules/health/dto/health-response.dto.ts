import { ApiProperty } from '@nestjs/swagger';

export class HealthResponseDto {
  @ApiProperty({ example: 'ok' })
  status: string;

  @ApiProperty({ example: 42, description: 'Seconds since the server started' })
  uptimeSeconds: number;

  @ApiProperty({ example: '2026-01-01T12:00:00.000Z' })
  timestamp: string;
}
