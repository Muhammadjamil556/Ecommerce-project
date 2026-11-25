import { ApiProperty } from '@nestjs/swagger';
import { Matches, MaxLength } from 'class-validator';

export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const SLUG_MESSAGE =
  '$property may contain only lowercase letters, numbers and single hyphens';

/** Validates the :slug part of an address. */
export class SlugParamDto {
  @ApiProperty({ example: 'nikon-z8' })
  @MaxLength(180)
  @Matches(SLUG_PATTERN, { message: SLUG_MESSAGE })
  slug: string;
}
