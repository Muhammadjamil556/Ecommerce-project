import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service.js';
import { AdminSummaryResponseDto } from './dto/admin-summary-response.dto.js';

@Injectable()
export class AdminService {
  constructor(private readonly supabase: SupabaseService) {}

  // Counts every user, so it needs the system client. AdminController checks the role.
  async getSummary(): Promise<AdminSummaryResponseDto> {
    const { count, error } = await this.supabase
      .asSystem()
      .from('user_roles')
      .select('user_id', { count: 'exact', head: true })
      .eq('role', 'customer');

    if (error || count === null) {
      throw new Error(`Counting customers failed: ${error?.message}`);
    }
    return { customerCount: count };
  }
}
