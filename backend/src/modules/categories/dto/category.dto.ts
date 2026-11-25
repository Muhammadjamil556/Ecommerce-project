import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { trim } from '../../../common/utils/trim.js';
import { SLUG_MESSAGE, SLUG_PATTERN } from '../../../common/validators/slug.js';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Cameras', maxLength: 80 })
  @Transform(trim)
  @IsString()
  @Length(1, 80)
  name: string;

  @ApiPropertyOptional({
    example: 'cameras',
    description: 'Used in the address. Made from the name if left out.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Matches(SLUG_PATTERN, { message: SLUG_MESSAGE })
  slug?: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(500)
  description?: string;

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

// With "skipNullProperties: false", null is rejected instead of skipping validation.
export class UpdateCategoryDto extends PartialType(CreateCategoryDto, {
  skipNullProperties: false,
}) {}

export class CategoryResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiProperty({ type: String, nullable: true })
  description: string | null;
}

export class AdminCategoryResponseDto extends CategoryResponseDto {
  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  sortOrder: number;
}
