import { ApiProperty } from '@nestjs/swagger';

export class AdminSummaryResponseDto {
  @ApiProperty({ example: 12 })
  customerCount: number;
}
