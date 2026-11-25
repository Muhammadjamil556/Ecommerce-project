import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsOptional,
  IsString,
  IsUUID,
  IsUrl,
  Length,
  MaxLength,
} from 'class-validator';
import { trim } from '../../../common/utils/trim.js';

class ImageDetailsDto {
  @ApiProperty({
    maxLength: 200,
    description: 'Describes the photo for people who cannot see it',
  })
  @Transform(trim)
  @IsString()
  @Length(1, 200)
  altText: string;

  @ApiProperty({ maxLength: 200, description: 'Who made the photo' })
  @Transform(trim)
  @IsString()
  @Length(1, 200)
  credit: string;

  @ApiProperty({ maxLength: 100, example: 'CC BY-SA 4.0' })
  @Transform(trim)
  @IsString()
  @Length(1, 100)
  license: string;

  @ApiPropertyOptional({ description: 'Where the photo came from' })
  @IsOptional()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  @MaxLength(500)
  sourceUrl?: string;
}

export class UploadImageDto extends ImageDetailsDto {
  // Read by FileInterceptor. Listed here only for Swagger.
  @ApiProperty({ type: 'string', format: 'binary' })
  @IsOptional()
  file?: unknown;
}

// With "skipNullProperties: false", null is rejected instead of skipping validation.
export class UpdateImageDto extends PartialType(ImageDetailsDto, {
  skipNullProperties: false,
}) {}

export class ReorderImagesDto {
  @ApiProperty({
    type: [String],
    description: 'Every photo of the product. The first is the main photo.',
  })
  @IsUUID(undefined, { each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  imageIds: string[];
}
