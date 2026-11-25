import { randomUUID } from 'node:crypto';
import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../../../supabase/supabase.service.js';
import { IMAGE_BUCKET } from '../product.types.js';

/** Photo files in Supabase Storage. Only admin code uses it. */
@Injectable()
export class ProductImageStorageService {
  private readonly logger = new Logger(ProductImageStorageService.name);

  constructor(private readonly supabase: SupabaseService) {}

  /** Saves a WebP file under a random name and returns its path. */
  async upload(productId: string, file: Buffer): Promise<string> {
    const path = `${productId}/${randomUUID()}.webp`;
    const { error } = await this.bucket().upload(path, file, {
      contentType: 'image/webp',
      // A path is never reused, so browsers may keep the file for a year.
      cacheControl: '31536000',
      upsert: false,
    });
    if (error) throw new Error(`Uploading photo failed: ${error.message}`);
    return path;
  }

  /**
   * Called after the database row is gone. A failure leaves an unused file behind,
   * which is not a reason to report an error to the admin.
   */
  async remove(paths: string[]): Promise<void> {
    if (paths.length === 0) return;
    const { error } = await this.bucket().remove(paths);
    if (error) {
      this.logger.error(
        `Unused photos left in storage (${paths.join(', ')}): ${error.message}`,
      );
    }
  }

  publicUrl(path: string): string {
    return this.bucket().getPublicUrl(path).data.publicUrl;
  }

  private bucket() {
    return this.supabase.asSystem().storage.from(IMAGE_BUCKET);
  }
}
