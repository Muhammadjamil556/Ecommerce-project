import { ApiProperty } from '@nestjs/swagger';
import { CURRENCY, PRODUCT_STATUSES } from '../product.types.js';
import type { ProductStatus } from '../product.types.js';

const TEXT_RECORD = {
  type: 'object',
  additionalProperties: { type: 'string' },
} as const;

export class ProductCategoryDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;
}

export class ProductThumbnailDto {
  @ApiProperty()
  url: string;

  @ApiProperty()
  alt: string;
}

export class ProductImageDto extends ProductThumbnailDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  credit: string;

  @ApiProperty()
  license: string;

  @ApiProperty({ type: String, nullable: true })
  sourceUrl: string | null;

  @ApiProperty()
  width: number;

  @ApiProperty()
  height: number;
}

class ProductBaseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  brand: string;

  @ApiProperty({ enum: [CURRENCY] })
  currency: string;

  @ApiProperty({ type: ProductCategoryDto })
  category: ProductCategoryDto;
}

export class ProductSummaryDto extends ProductBaseDto {
  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'In paisa. Null when the product has no active variant.',
  })
  minPriceMinor: number | null;

  @ApiProperty({ type: Number, nullable: true, description: 'In paisa' })
  maxPriceMinor: number | null;

  @ApiProperty()
  isInStock: boolean;

  @ApiProperty({ type: ProductThumbnailDto, nullable: true })
  image: ProductThumbnailDto | null;
}

export class AdminProductSummaryDto extends ProductSummaryDto {
  @ApiProperty({ enum: PRODUCT_STATUSES })
  status: ProductStatus;
}

export class VariantDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  sku: string;

  @ApiProperty()
  name: string;

  @ApiProperty(TEXT_RECORD)
  options: Record<string, string>;

  @ApiProperty({ description: 'In paisa: 100000 is Rs 1,000' })
  priceMinor: number;

  @ApiProperty()
  isInStock: boolean;
}

export class AdminVariantDto extends VariantDto {
  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  sortOrder: number;

  @ApiProperty({ description: 'Changed through /admin/inventory' })
  quantity: number;

  @ApiProperty()
  lowStockThreshold: number;
}

export class ProductDetailDto extends ProductBaseDto {
  @ApiProperty()
  description: string;

  @ApiProperty(TEXT_RECORD)
  specifications: Record<string, string>;

  @ApiProperty({ type: [ProductImageDto] })
  images: ProductImageDto[];

  @ApiProperty({ type: [VariantDto] })
  variants: VariantDto[];
}

export class AdminProductDetailDto extends ProductBaseDto {
  @ApiProperty()
  description: string;

  @ApiProperty(TEXT_RECORD)
  specifications: Record<string, string>;

  @ApiProperty({ type: [ProductImageDto] })
  images: ProductImageDto[];

  @ApiProperty({ enum: PRODUCT_STATUSES })
  status: ProductStatus;

  @ApiProperty({ type: [AdminVariantDto] })
  variants: AdminVariantDto[];
}
