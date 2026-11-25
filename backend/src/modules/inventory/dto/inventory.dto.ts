import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
  NotEquals,
} from 'class-validator';
import { PageQueryDto } from '../../../common/pagination/page-query.dto.js';
import { toBoolean } from '../../../common/utils/to-boolean.js';
import { trim } from '../../../common/utils/trim.js';
import { PRODUCT_STATUSES } from '../../products/product.types.js';
import type { ProductStatus } from '../../products/product.types.js';
import { STOCK_CHANGE_REASONS } from '../inventory.types.js';
import type { StockChangeReason } from '../inventory.types.js';

const MAX_CHANGE = 100_000;

export class InventoryQueryDto extends PageQueryDto {
  @ApiPropertyOptional({
    description: 'Words to find in the SKU, brand, product or variant name',
    maxLength: 100,
  })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({ description: 'true: only low or empty stock' })
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  low?: boolean;
}

export class AdjustStockDto {
  @ApiProperty({ example: 5, description: 'Positive adds, negative removes' })
  @IsInt()
  @NotEquals(0)
  @Min(-MAX_CHANGE)
  @Max(MAX_CHANGE)
  change: number;

  @ApiProperty({ enum: STOCK_CHANGE_REASONS })
  @IsIn(STOCK_CHANGE_REASONS)
  reason: StockChangeReason;

  @ApiPropertyOptional({ maxLength: 300 })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @Length(1, 300)
  note?: string;
}

export class UpdateInventoryDto {
  @ApiProperty({ description: 'Stock at or below this counts as low' })
  @IsInt()
  @Min(0)
  @Max(MAX_CHANGE)
  lowStockThreshold: number;
}

export class InventoryItemDto {
  @ApiProperty({ format: 'uuid' })
  variantId: string;

  @ApiProperty()
  sku: string;

  @ApiProperty()
  variantName: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty({ format: 'uuid' })
  productId: string;

  @ApiProperty()
  productName: string;

  @ApiProperty({ enum: PRODUCT_STATUSES })
  productStatus: ProductStatus;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  lowStockThreshold: number;

  @ApiProperty()
  isLow: boolean;
}

export class StockMovementDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  change: number;

  @ApiProperty()
  quantityAfter: number;

  @ApiProperty({ enum: STOCK_CHANGE_REASONS })
  reason: StockChangeReason;

  @ApiProperty({ type: String, nullable: true })
  note: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Null when a script made the change or the account is gone',
  })
  createdByName: string | null;

  @ApiProperty({ format: 'date-time' })
  createdAt: string;
}
