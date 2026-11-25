import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { toHttpError } from '../../../common/database/database-error.js';
import { requireChanges } from '../../../common/utils/require-changes.js';
import { SupabaseService } from '../../../supabase/supabase.service.js';
import { UpdateImageDto, UploadImageDto } from '../dto/image-input.dto.js';
import { ProductImageDto } from '../dto/product-response.dto.js';
import { toImage } from '../product.mapper.js';
import { IMAGE_COLUMNS, ImageRow } from '../product.types.js';
import { processImage } from './image-processor.js';
import { ProductImageStorageService } from './product-image-storage.service.js';

const MAX_IMAGES = 10;

/** Uses the system client, so RLS does not apply. The controller checks the role. */
@Injectable()
export class AdminImagesService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly storage: ProductImageStorageService,
  ) {}

  async upload(
    productId: string,
    file: Buffer | undefined,
    dto: UploadImageDto,
  ): Promise<ProductImageDto> {
    if (!file) throw new BadRequestException('Choose a photo to upload.');

    const sortOrder = await this.nextSortOrder(productId);
    const image = await processImage(file);
    const path = await this.storage.upload(productId, image.buffer);

    const { data, error } = await this.table()
      .insert({
        ...toColumns(dto),
        product_id: productId,
        storage_path: path,
        width: image.width,
        height: image.height,
        sort_order: sortOrder,
      })
      .select(IMAGE_COLUMNS)
      .single<ImageRow>();

    if (error) {
      await this.storage.remove([path]);
      throw toHttpError(error, 'Saving photo', {
        reference: 'The product no longer exists.',
      });
    }
    return this.toDto(data);
  }

  async update(
    productId: string,
    id: string,
    dto: UpdateImageDto,
  ): Promise<ProductImageDto> {
    const { data, error } = await this.table()
      .update(requireChanges(toColumns(dto)))
      .eq('id', id)
      .eq('product_id', productId)
      .select(IMAGE_COLUMNS)
      .maybeSingle<ImageRow>();

    if (error) throw toHttpError(error, 'Updating photo');
    if (!data) throw imageMissing();
    return this.toDto(data);
  }

  async reorder(
    productId: string,
    imageIds: string[],
  ): Promise<ProductImageDto[]> {
    const { error } = await this.supabase
      .asSystem()
      .rpc('reorder_product_images', {
        p_product_id: productId,
        p_image_ids: imageIds,
      });

    if (error?.code === 'P0001') {
      throw new ConflictException(
        'The photos have changed. Reload the page and try again.',
      );
    }
    if (error) throw toHttpError(error, 'Reordering photos');

    const { data, error: readError } = await this.table()
      .select(IMAGE_COLUMNS)
      .eq('product_id', productId)
      .order('sort_order')
      .order('id')
      .returns<ImageRow[]>();
    if (readError) throw toHttpError(readError, 'Reading photos');
    return data.map((row) => this.toDto(row));
  }

  async remove(productId: string, id: string): Promise<void> {
    const { data, error } = await this.table()
      .delete()
      .eq('id', id)
      .eq('product_id', productId)
      .select('storage_path')
      .maybeSingle<{ storage_path: string }>();

    if (error) throw toHttpError(error, 'Deleting photo');
    if (!data) throw imageMissing();
    await this.storage.remove([data.storage_path]);
  }

  /** Puts a new photo last, and checks that the product exists and has room. */
  private async nextSortOrder(productId: string): Promise<number> {
    const { data, error } = await this.supabase
      .asSystem()
      .from('products')
      .select('images:product_images (sort_order)')
      .eq('id', productId)
      .maybeSingle<{ images: { sort_order: number }[] }>();

    if (error) throw toHttpError(error, 'Reading product');
    if (!data) throw new NotFoundException('Product not found.');
    if (data.images.length >= MAX_IMAGES) {
      throw new ConflictException(
        `A product can have at most ${MAX_IMAGES} photos.`,
      );
    }
    return Math.max(-1, ...data.images.map((image) => image.sort_order)) + 1;
  }

  private toDto(row: ImageRow): ProductImageDto {
    return toImage(row, (path) => this.storage.publicUrl(path));
  }

  private table() {
    return this.supabase.asSystem().from('product_images');
  }
}

function toColumns(dto: UpdateImageDto) {
  return {
    alt_text: dto.altText,
    credit: dto.credit,
    license: dto.license,
    source_url: dto.sourceUrl,
  };
}

function imageMissing() {
  return new NotFoundException('Photo not found.');
}
