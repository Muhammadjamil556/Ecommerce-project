import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ApiDataResponse } from '../../common/decorators/api-data-response.decorator.js';
import { ApiPageResponse } from '../../common/decorators/api-page-response.decorator.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { Page } from '../../common/pagination/page.js';
import { SlugParamDto } from '../../common/validators/slug.js';
import { PublicProductQueryDto } from './dto/product-query.dto.js';
import {
  ProductDetailDto,
  ProductSummaryDto,
} from './dto/product-response.dto.js';
import { ProductsService } from './products.service.js';

@ApiTags('Products')
@Public()
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'Search, filter and sort published products' })
  @ApiPageResponse(ProductSummaryDto)
  @ApiBadRequestResponse({ description: 'Invalid filter' })
  search(
    @Query() query: PublicProductQueryDto,
  ): Promise<Page<ProductSummaryDto>> {
    return this.productsService.search(query);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get a published product' })
  @ApiDataResponse(ProductDetailDto)
  @ApiNotFoundResponse({ description: 'Product not found' })
  findBySlug(@Param() { slug }: SlugParamDto): Promise<ProductDetailDto> {
    return this.productsService.findBySlug(slug);
  }
}
