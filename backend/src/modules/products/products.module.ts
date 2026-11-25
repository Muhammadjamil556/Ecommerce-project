import { Module } from '@nestjs/common';
import { AdminProductsController } from './admin-products.controller.js';
import { AdminProductsService } from './admin-products.service.js';
import { AdminVariantsController } from './admin-variants.controller.js';
import { AdminVariantsService } from './admin-variants.service.js';
import { ProductSearchService } from './product-search.service.js';
import { ProductsController } from './products.controller.js';
import { ProductsService } from './products.service.js';

@Module({
  controllers: [
    ProductsController,
    AdminProductsController,
    AdminVariantsController,
  ],
  providers: [
    ProductsService,
    AdminProductsService,
    AdminVariantsService,
    ProductSearchService,
  ],
})
export class ProductsModule {}
