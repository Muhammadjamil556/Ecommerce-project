import {
  ApiProperty,
  ApiPropertyOptional,
  IntersectionType,
  PartialType,
} from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { trim } from '../../../common/utils/trim.js';
import { IsTextRecord } from '../../../common/validators/is-text-record.decorator.js';
import { SLUG_MESSAGE, SLUG_PATTERN } from '../../../common/validators/slug.js';
import { PRODUCT_STATUSES } from '../product.types.js';
import type { ProductStatus } from '../product.types.js';

export class CreateProductDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  categoryId: string;

  @ApiProperty({ example: 'Nikon Z8', maxLength: 150 })
  @Transform(trim)
  @IsString()
  @Length(1, 150)
  name: string;

  @ApiPropertyOptional({
    example: 'nikon-z8',
    description: 'Used in the address. Made from the name if left out.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(180)
  @Matches(SLUG_PATTERN, { message: SLUG_MESSAGE })
  slug?: string;

  @ApiProperty({ example: 'Nikon', maxLength: 60 })
  @Transform(trim)
  @IsString()
  @Length(1, 60)
  brand: string;

  @ApiPropertyOptional({ maxLength: 5000 })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: { type: 'string' },
    example: { Sensor: 'Full frame', Weight: '910 g' },
  })
  @IsOptional()
  @IsTextRecord({ maxEntries: 40, maxKeyLength: 60, maxValueLength: 300 })
  specifications?: Record<string, string>;
}

class ProductStatusDto {
  @ApiPropertyOptional({
    enum: PRODUCT_STATUSES,
    description: 'Publishing needs at least one active variant',
  })
  @IsIn(PRODUCT_STATUSES)
  status: ProductStatus;
}

// With "skipNullProperties: false", null is rejected instead of skipping validation.
export class UpdateProductDto extends PartialType(
  IntersectionType(CreateProductDto, ProductStatusDto),
  { skipNullProperties: false },
) {}

export class CreateVariantDto {
  @ApiProperty({ example: 'NIK-Z8-BODY', maxLength: 60 })
  @IsString()
  @MaxLength(60)
  @Matches(/^[A-Z0-9]+(-[A-Z0-9]+)*$/, {
    message:
      '$property may contain only uppercase letters, numbers and single hyphens',
  })
  sku: string;

  @ApiProperty({ example: 'Body only', maxLength: 100 })
  @Transform(trim)
  @IsString()
  @Length(1, 100)
  name: string;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: { type: 'string' },
    example: { Kit: 'Body only' },
  })
  @IsOptional()
  @IsTextRecord({ maxEntries: 5, maxKeyLength: 40, maxValueLength: 80 })
  options?: Record<string, string>;

  @ApiProperty({ example: 100000, description: 'In paisa: 100000 is Rs 1,000' })
  @IsInt()
  @Min(1)
  @Max(2_147_483_647)
  priceMinor: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ default: 0, description: 'Lower numbers come first' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10_000)
  sortOrder?: number;
}

export class UpdateVariantDto extends PartialType(CreateVariantDto, {
  skipNullProperties: false,
}) {}
