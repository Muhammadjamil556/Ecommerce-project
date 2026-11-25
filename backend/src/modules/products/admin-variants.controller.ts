import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
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
import { AdminVariantsService } from './admin-variants.service.js';
import { CreateVariantDto, UpdateVariantDto } from './dto/product-input.dto.js';
import { AdminVariantDto } from './dto/product-response.dto.js';

@ApiTags('Admin: variants')
@AdminOnly()
@Controller('admin/products/:productId/variants')
export class AdminVariantsController {
  constructor(private readonly variantsService: AdminVariantsService) {}

  @Post()
  @ApiOperation({ summary: 'Add a variant. Stock starts at 0.' })
  @ApiDataResponse(AdminVariantDto, { status: HttpStatus.CREATED })
  @ApiBadRequestResponse({ description: 'Invalid input' })
  @ApiNotFoundResponse({ description: 'Product not found' })
  @ApiConflictResponse({ description: 'SKU or name already used' })
  create(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() dto: CreateVariantDto,
  ): Promise<AdminVariantDto> {
    return this.variantsService.create(productId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Change a variant' })
  @ApiDataResponse(AdminVariantDto)
  @ApiBadRequestResponse({ description: 'Invalid input' })
  @ApiNotFoundResponse({ description: 'Variant not found' })
  @ApiConflictResponse({ description: 'SKU or name used, or last variant' })
  update(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVariantDto,
  ): Promise<AdminVariantDto> {
    return this.variantsService.update(productId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a variant' })
  @ApiNoContentResponse()
  @ApiNotFoundResponse({ description: 'Variant not found' })
  @ApiConflictResponse({ description: 'Last active variant' })
  remove(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.variantsService.remove(productId, id);
  }
}
