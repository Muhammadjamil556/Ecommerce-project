import {
  Body,
  Controller,
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
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AdminOnly } from '../../common/decorators/admin-only.decorator.js';
import { ApiDataResponse } from '../../common/decorators/api-data-response.decorator.js';
import { ApiPageResponse } from '../../common/decorators/api-page-response.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { PageQueryDto } from '../../common/pagination/page-query.dto.js';
import { Page } from '../../common/pagination/page.js';
import type { AuthenticatedUser } from '../../common/types/authenticated-user.js';
import {
  AdjustStockDto,
  InventoryItemDto,
  InventoryQueryDto,
  StockMovementDto,
  UpdateInventoryDto,
} from './dto/inventory.dto.js';
import { InventoryService } from './inventory.service.js';

@ApiTags('Admin: inventory')
@AdminOnly()
@Controller('admin/inventory')
export class AdminInventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  @ApiOperation({ summary: 'List stock, optionally only low stock' })
  @ApiPageResponse(InventoryItemDto)
  @ApiBadRequestResponse({ description: 'Invalid filter' })
  search(@Query() query: InventoryQueryDto): Promise<Page<InventoryItemDto>> {
    return this.inventoryService.search(query);
  }

  @Get(':variantId')
  @ApiOperation({ summary: 'Get the stock of a variant' })
  @ApiDataResponse(InventoryItemDto)
  @ApiNotFoundResponse({ description: 'Variant not found' })
  findOne(
    @Param('variantId', ParseUUIDPipe) variantId: string,
  ): Promise<InventoryItemDto> {
    return this.inventoryService.findOne(variantId);
  }

  @Patch(':variantId')
  @ApiOperation({ summary: 'Set when stock counts as low' })
  @ApiDataResponse(InventoryItemDto)
  @ApiBadRequestResponse({ description: 'Invalid input' })
  @ApiNotFoundResponse({ description: 'Variant not found' })
  update(
    @Param('variantId', ParseUUIDPipe) variantId: string,
    @Body() dto: UpdateInventoryDto,
  ): Promise<InventoryItemDto> {
    return this.inventoryService.update(variantId, dto);
  }

  @Post(':variantId/adjustments')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add or remove stock, and record why' })
  @ApiDataResponse(InventoryItemDto)
  @ApiBadRequestResponse({ description: 'Invalid input' })
  @ApiNotFoundResponse({ description: 'Variant not found' })
  @ApiConflictResponse({ description: 'Not enough stock' })
  adjust(
    @Param('variantId', ParseUUIDPipe) variantId: string,
    @Body() dto: AdjustStockDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<InventoryItemDto> {
    return this.inventoryService.adjust(variantId, dto, user.id);
  }

  @Get(':variantId/movements')
  @ApiOperation({ summary: 'List the stock history, newest first' })
  @ApiPageResponse(StockMovementDto)
  @ApiNotFoundResponse({ description: 'Variant not found' })
  findMovements(
    @Param('variantId', ParseUUIDPipe) variantId: string,
    @Query() query: PageQueryDto,
  ): Promise<Page<StockMovementDto>> {
    return this.inventoryService.findMovements(variantId, query);
  }
}
