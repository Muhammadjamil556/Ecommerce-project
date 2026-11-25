import { BadRequestException, Logger } from '@nestjs/common';
import sharp from 'sharp';

const MAX_SIDE = 1600;
const MAX_INPUT_PIXELS = 60_000_000;
const PROCESSING_SECONDS = 20;

const NOT_AN_IMAGE = 'Upload a JPEG, PNG or WebP photo.';

export interface ProcessedImage {
  buffer: Buffer;
  width: number;
  height: number;
}

/**
 * Checks that the file is really a photo, then makes a smaller WebP copy. The copy has
 * none of the original's hidden data, such as the GPS location added by phones.
 */
export async function processImage(file: Buffer): Promise<ProcessedImage> {
  // Checked first, so risky formats such as SVG never reach the image library.
  if (!hasAllowedSignature(file)) throw new BadRequestException(NOT_AN_IMAGE);

  try {
    const { data, info } = await sharp(file, {
      limitInputPixels: MAX_INPUT_PIXELS,
    })
      // Applies the rotation stored by the camera before that data is dropped.
      .autoOrient()
      .resize(MAX_SIDE, MAX_SIDE, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .timeout({ seconds: PROCESSING_SECONDS })
      .toBuffer({ resolveWithObject: true });

    return { buffer: data, width: info.width, height: info.height };
  } catch (error) {
    new Logger('ImageProcessor').warn(`Photo rejected: ${String(error)}`);
    throw new BadRequestException(
      'This photo is damaged, too large or not supported.',
    );
  }
}

/** The first bytes tell the real type. The file name and stated type can lie. */
function hasAllowedSignature(file: Buffer): boolean {
  const startsWith = (...bytes: number[]) =>
    bytes.every((byte, index) => file[index] === byte);

  const isJpeg = startsWith(0xff, 0xd8, 0xff);
  const isPng = startsWith(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
  const isWebp =
    file.toString('latin1', 0, 4) === 'RIFF' &&
    file.toString('latin1', 8, 12) === 'WEBP';
  return isJpeg || isPng || isWebp;
}
