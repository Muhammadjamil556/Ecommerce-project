import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiDataResponse } from '../../common/decorators/api-data-response.decorator.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { CategoriesService } from './categories.service.js';
import { CategoryResponseDto } from './dto/category.dto.js';

@ApiTags('Categories')
@Public()
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'List active categories' })
  @ApiDataResponse(CategoryResponseDto, { isArray: true })
  findActive(): Promise<CategoryResponseDto[]> {
    return this.categoriesService.findActive();
  }
}
