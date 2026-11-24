import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Allows a route without login. Every route needs login unless it has this. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
