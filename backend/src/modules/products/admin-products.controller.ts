import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AdminOnly } from '../../common/decorators/admin-only.decorator.js';
import { ApiDataResponse } from '../../common/decorators/api-data-response.decorator.js';
import { ApiPageResponse } from '../../common/decorators/api-page-response.decorator.js';
import { Page } from '../../common/pagination/page.js';
import { AdminProductsService } from './admin-products.service.js';
import { CreateProductDto, UpdateProductDto } from './dto/product-input.dto.js';
import { AdminProductQueryDto } from './dto/product-query.dto.js';
import {
  AdminProductDetailDto,
  AdminProductSummaryDto,
} from './dto/product-response.dto.js';

@ApiTags('Admin: products')
@AdminOnly()
@Controller('admin/products')
export class AdminProductsController {
  constructor(private readonly productsService: AdminProductsService) {}

  @Get()
  @ApiOperation({ summary: 'Search all products, including drafts' })
  @ApiPageResponse(AdminProductSummaryDto)
  search(
    @Query() query: AdminProductQueryDto,
  ): Promise<Page<AdminProductSummaryDto>> {
    return this.productsService.search(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a product with every variant and its stock' })
  @ApiDataResponse(AdminProductDetailDto)
  @ApiNotFoundResponse({ description: 'Product not found' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AdminProductDetailDto> {
    return this.productsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a draft product' })
  @ApiDataResponse(AdminProductDetailDto, { status: HttpStatus.CREATED })
  @ApiBadRequestResponse({ description: 'Invalid input' })
  @ApiConflictResponse({ description: 'Slug used, or category missing' })
  create(@Body() dto: CreateProductDto): Promise<AdminProductDetailDto> {
    return this.productsService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Change, publish or archive a product' })
  @ApiDataResponse(AdminProductDetailDto)
  @ApiBadRequestResponse({ description: 'Invalid input' })
  @ApiNotFoundResponse({ description: 'Product not found' })
  @ApiConflictResponse({ description: 'Slug used, or nothing to sell yet' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
  ): Promise<AdminProductDetailDto> {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a draft' })
  @ApiNoContentResponse()
  @ApiNotFoundResponse({ description: 'Product not found' })
  @ApiConflictResponse({ description: 'Not a draft' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.productsService.remove(id);
  }
}
