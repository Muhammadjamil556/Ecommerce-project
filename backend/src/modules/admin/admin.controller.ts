import { Controller, Get } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiDataResponse } from '../../common/decorators/api-data-response.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { AdminService } from './admin.service.js';
import { AdminSummaryResponseDto } from './dto/admin-summary-response.dto.js';

@ApiTags('Admin')
@ApiBearerAuth()
@Roles('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get store totals (admin only)' })
  @ApiDataResponse(AdminSummaryResponseDto)
  @ApiUnauthorizedResponse({ description: 'Not logged in' })
  @ApiForbiddenResponse({ description: 'Not an admin' })
  getSummary(): Promise<AdminSummaryResponseDto> {
    return this.adminService.getSummary();
  }
}
