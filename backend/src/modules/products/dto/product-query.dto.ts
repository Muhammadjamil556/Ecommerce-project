import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { PageQueryDto } from '../../../common/pagination/page-query.dto.js';
import { toBoolean } from '../../../common/utils/to-boolean.js';
import { trim } from '../../../common/utils/trim.js';
import { SLUG_MESSAGE, SLUG_PATTERN } from '../../../common/validators/slug.js';
import { PRODUCT_STATUSES } from '../product.types.js';
import type { ProductStatus } from '../product.types.js';

export const PRODUCT_SORTS = [
  'newest',
  'price_asc',
  'price_desc',
  'name_asc',
] as const;
export type ProductSort = (typeof PRODUCT_SORTS)[number];

const MAX_PRICE_MINOR = 2_147_483_647;

export class ProductQueryDto extends PageQueryDto {
  @ApiPropertyOptional({
    description: 'Words to find in the brand, name or description',
    maxLength: 100,
  })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({ description: 'Category slug', example: 'cameras' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Matches(SLUG_PATTERN, { message: SLUG_MESSAGE })
  category?: string;

  @ApiPropertyOptional({ example: 'Nikon', maxLength: 60 })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @Length(1, 60)
  brand?: string;

  @ApiPropertyOptional({ enum: PRODUCT_SORTS, default: 'newest' })
  @IsOptional()
  @IsIn(PRODUCT_SORTS)
  sort: ProductSort = 'newest';
}

export class PublicProductQueryDto extends ProductQueryDto {
  @ApiPropertyOptional({ description: 'Lowest price, in paisa' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(MAX_PRICE_MINOR)
  minPrice?: number;

  @ApiPropertyOptional({ description: 'Highest price, in paisa' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(MAX_PRICE_MINOR)
  maxPrice?: number;

  @ApiPropertyOptional({ description: 'true: only products in stock' })
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  inStock?: boolean;
}

export class AdminProductQueryDto extends ProductQueryDto {
  @ApiPropertyOptional({ enum: PRODUCT_STATUSES })
  @IsOptional()
  @IsIn(PRODUCT_STATUSES)
  status?: ProductStatus;
}
