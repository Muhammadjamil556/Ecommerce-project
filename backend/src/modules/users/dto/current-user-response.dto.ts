import { ApiProperty } from '@nestjs/swagger';
import type { AppRole } from '../../../common/types/authenticated-user.js';

export class CurrentUserResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'customer@example.com' })
  email: string;

  @ApiProperty({ type: String, nullable: true })
  fullName: string | null;

  @ApiProperty({ type: String, nullable: true })
  phone: string | null;

  @ApiProperty({ enum: ['customer', 'admin'] })
  role: AppRole;
}
