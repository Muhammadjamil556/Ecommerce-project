import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { toHttpError } from '../../common/database/database-error.js';
import { requireChanges } from '../../common/utils/require-changes.js';
import { slugify } from '../../common/utils/slugify.js';
import { SupabaseService } from '../../supabase/supabase.service.js';
import {
  AdminCategoryResponseDto,
  CategoryResponseDto,
  CreateCategoryDto,
  UpdateCategoryDto,
} from './dto/category.dto.js';

const COLUMNS = 'id, name, slug, description, is_active, sort_order';

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
}

const CONFLICTS = {
  duplicate: 'Another category already uses this slug.',
  reference: 'This category still has products. Move or delete them first.',
};

@Injectable()
export class CategoriesService {
  constructor(private readonly supabase: SupabaseService) {}

  /** Row Level Security returns active categories only. */
  async findActive(): Promise<CategoryResponseDto[]> {
    const { data, error } = await this.supabase
      .asVisitor()
      .from('categories')
      .select(COLUMNS)
      .order('sort_order')
      .order('name')
      .returns<CategoryRow[]>();

    if (error) throw toHttpError(error, 'Reading categories');
    return data.map(toCategory);
  }

  // The methods below use the system client. AdminCategoriesController checks the role.

  async findAll(): Promise<AdminCategoryResponseDto[]> {
    const { data, error } = await this.table()
      .select(COLUMNS)
      .order('sort_order')
      .order('name')
      .returns<CategoryRow[]>();

    if (error) throw toHttpError(error, 'Reading categories');
    return data.map(toAdminCategory);
  }

  async create(dto: CreateCategoryDto): Promise<AdminCategoryResponseDto> {
    const slug = dto.slug ?? slugify(dto.name);
    if (!slug) throw new BadRequestException('Please provide a slug.');

    const { data, error } = await this.table()
      .insert({ ...toColumns(dto), slug })
      .select(COLUMNS)
      .single<CategoryRow>();

    if (error) throw toHttpError(error, 'Creating category', CONFLICTS);
    return toAdminCategory(data);
  }

  async update(
    id: string,
    dto: UpdateCategoryDto,
  ): Promise<AdminCategoryResponseDto> {
    const { data, error } = await this.table()
      .update(requireChanges(toColumns(dto)))
      .eq('id', id)
      .select(COLUMNS)
      .maybeSingle<CategoryRow>();

    if (error) throw toHttpError(error, 'Updating category', CONFLICTS);
    if (!data) throw categoryMissing();
    return toAdminCategory(data);
  }

  async remove(id: string): Promise<void> {
    const { data, error } = await this.table()
      .delete()
      .eq('id', id)
      .select('id')
      .maybeSingle();

    if (error) throw toHttpError(error, 'Deleting category', CONFLICTS);
    if (!data) throw categoryMissing();
  }

  private table() {
    return this.supabase.asSystem().from('categories');
  }
}

function toColumns(dto: UpdateCategoryDto) {
  return {
    name: dto.name,
    slug: dto.slug,
    description: dto.description,
    is_active: dto.isActive,
    sort_order: dto.sortOrder,
  };
}

function toCategory(row: CategoryRow): CategoryResponseDto {
  return categoryFields(row);
}

function categoryFields(row: CategoryRow) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
  };
}

function toAdminCategory(row: CategoryRow): AdminCategoryResponseDto {
  return {
    ...categoryFields(row),
    isActive: row.is_active,
    sortOrder: row.sort_order,
  };
}

function categoryMissing() {
  return new NotFoundException('Category not found.');
}
