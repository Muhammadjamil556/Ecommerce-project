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
  Put,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiConsumes,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiPayloadTooLargeResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AdminOnly } from '../../../common/decorators/admin-only.decorator.js';
import { ApiDataResponse } from '../../../common/decorators/api-data-response.decorator.js';
import {
  ReorderImagesDto,
  UpdateImageDto,
  UploadImageDto,
} from '../dto/image-input.dto.js';
import { ProductImageDto } from '../dto/product-response.dto.js';
import { AdminImagesService } from './admin-images.service.js';

// Guards run first, so only an admin's upload is read into memory.
const UPLOAD_LIMITS = {
  files: 1,
  fileSize: 10 * 1024 * 1024,
  fields: 10,
  fieldSize: 4 * 1024,
};

@ApiTags('Admin: photos')
@AdminOnly()
@Controller('admin/products/:productId/images')
export class AdminImagesController {
  constructor(private readonly imagesService: AdminImagesService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', { limits: UPLOAD_LIMITS }))
  @ApiOperation({ summary: 'Upload a JPEG, PNG or WebP photo (10 MB)' })
  @ApiConsumes('multipart/form-data')
  @ApiDataResponse(ProductImageDto, { status: HttpStatus.CREATED })
  @ApiBadRequestResponse({ description: 'Invalid input or not a photo' })
  @ApiNotFoundResponse({ description: 'Product not found' })
  @ApiConflictResponse({ description: 'Too many photos' })
  @ApiPayloadTooLargeResponse({ description: 'File too large' })
  upload(
    @Param('productId', ParseUUIDPipe) productId: string,
    @UploadedFile() file: { buffer: Buffer } | undefined,
    @Body() dto: UploadImageDto,
  ): Promise<ProductImageDto> {
    return this.imagesService.upload(productId, file?.buffer, dto);
  }

  @Put('order')
  @ApiOperation({ summary: 'Set the order. The first is the main photo.' })
  @ApiDataResponse(ProductImageDto, { isArray: true })
  @ApiBadRequestResponse({ description: 'Invalid input' })
  @ApiConflictResponse({ description: 'Not exactly the current photos' })
  reorder(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() dto: ReorderImagesDto,
  ): Promise<ProductImageDto[]> {
    return this.imagesService.reorder(productId, dto.imageIds);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Change the description, credit or license' })
  @ApiDataResponse(ProductImageDto)
  @ApiBadRequestResponse({ description: 'Invalid input' })
  @ApiNotFoundResponse({ description: 'Photo not found' })
  update(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateImageDto,
  ): Promise<ProductImageDto> {
    return this.imagesService.update(productId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a photo' })
  @ApiNoContentResponse()
  @ApiNotFoundResponse({ description: 'Photo not found' })
  remove(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.imagesService.remove(productId, id);
  }
}
