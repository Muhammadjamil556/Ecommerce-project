import { Module } from '@nestjs/common';
import { AdminProductsController } from './admin-products.controller.js';
import { AdminProductsService } from './admin-products.service.js';
import { AdminVariantsController } from './admin-variants.controller.js';
import { AdminVariantsService } from './admin-variants.service.js';
import { AdminImagesController } from './images/admin-images.controller.js';
import { AdminImagesService } from './images/admin-images.service.js';
import { ProductImageStorageService } from './images/product-image-storage.service.js';
import { ProductSearchService } from './product-search.service.js';
import { ProductsController } from './products.controller.js';
import { ProductsService } from './products.service.js';

@Module({
  controllers: [
    ProductsController,
    AdminProductsController,
    AdminVariantsController,
    AdminImagesController,
  ],
  providers: [
    ProductsService,
    AdminProductsService,
    AdminVariantsService,
    AdminImagesService,
    ProductImageStorageService,
    ProductSearchService,
  ],
})
export class ProductsModule {}
