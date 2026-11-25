import { Logger } from '@nestjs/common';
import sharp from 'sharp';
import { processImage } from './image-processor.js';

function photo(width: number, height: number) {
  return sharp({
    create: { width, height, channels: 3, background: '#336699' },
  });
}

describe('processImage', () => {
  beforeEach(() => {
    vi.spyOn(Logger.prototype, 'warn').mockReturnValue();
  });

  it.each(['jpeg', 'png', 'webp'] as const)(
    'turns %s into WebP',
    async (type) => {
      const result = await processImage(
        await photo(40, 30).toFormat(type).toBuffer(),
      );
      expect((await sharp(result.buffer).metadata()).format).toBe('webp');
      expect(result).toMatchObject({ width: 40, height: 30 });
    },
  );

  it('shrinks large photos and does not enlarge small ones', async () => {
    const large = await photo(4000, 2000).jpeg().toBuffer();
    expect(await processImage(large)).toMatchObject({
      width: 1600,
      height: 800,
    });
  });

  it('removes hidden data such as the GPS location', async () => {
    const original = await photo(40, 30)
      .withExif({
        IFD0: { Copyright: 'private-marker' },
        IFD3: { GPSLatitude: '31/1 30/1 0/1', GPSLatitudeRef: 'N' },
      })
      .jpeg()
      .toBuffer();
    // Proves that the original really has the data.
    expect((await sharp(original).metadata()).exif).toBeDefined();
    expect(original.includes('private-marker')).toBe(true);

    const { buffer } = await processImage(original);
    const metadata = await sharp(buffer).metadata();
    expect(metadata.exif).toBeUndefined();
    expect(metadata.xmp).toBeUndefined();
    expect(buffer.includes('private-marker')).toBe(false);
  });

  it('applies the camera rotation', async () => {
    const sideways = await photo(40, 30)
      .withMetadata({ orientation: 6 })
      .jpeg()
      .toBuffer();
    expect(await processImage(sideways)).toMatchObject({
      width: 30,
      height: 40,
    });
  });

  it.each([
    ['an empty file', Buffer.alloc(0)],
    ['text', Buffer.from('not a photo')],
    ['HTML', Buffer.from('<html><script>alert(1)</script></html>')],
    ['only the first bytes of a JPEG', Buffer.from([0xff, 0xd8, 0xff, 0xe0])],
    ['only the first bytes of a WebP', Buffer.from('RIFF....WEBPVP8 ')],
  ])('rejects %s', async (_name, file) => {
    await expect(processImage(file)).rejects.toMatchObject({ status: 400 });
  });

  it('rejects image types that the library itself could read', async () => {
    const svg = Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="9" height="9"><rect width="9" height="9"/></svg>',
    );
    const gif = await photo(9, 9).gif().toBuffer();

    for (const file of [svg, gif]) {
      // Proves that the files are valid, so only our own check stops them.
      expect((await sharp(file).metadata()).width).toBe(9);
      await expect(processImage(file)).rejects.toMatchObject({ status: 400 });
    }
  });

  it('rejects a small file that would unpack into a huge photo', async () => {
    const bomb = await photo(10_000, 10_000).png().toBuffer();
    // Small enough to pass the upload limit.
    expect(bomb.length).toBeLessThan(10 * 1024 * 1024);
    await expect(processImage(bomb)).rejects.toMatchObject({ status: 400 });
  });

  it('rejects a photo that is cut off', async () => {
    const whole = await photo(400, 300).png().toBuffer();
    await expect(
      processImage(whole.subarray(0, whole.length / 2)),
    ).rejects.toMatchObject({ status: 400 });
  });
});
