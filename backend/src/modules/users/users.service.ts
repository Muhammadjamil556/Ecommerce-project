import { Injectable, UnauthorizedException } from '@nestjs/common';
import type {
  AppRole,
  AuthenticatedUser,
} from '../../common/types/authenticated-user.js';
import { SupabaseService } from '../../supabase/supabase.service.js';
import { CurrentUserResponseDto } from './dto/current-user-response.dto.js';

@Injectable()
export class UsersService {
  constructor(private readonly supabase: SupabaseService) {}

  async getCurrentUser(
    user: AuthenticatedUser,
  ): Promise<CurrentUserResponseDto> {
    const [profile, role] = await Promise.all([
      this.getProfile(user),
      this.getRole(user),
    ]);

    return {
      id: user.id,
      email: user.email,
      fullName: profile.full_name,
      phone: profile.phone,
      role,
    };
  }

  async getRole(user: AuthenticatedUser): Promise<AppRole> {
    const { data, error } = await this.supabase
      .forUser(user.accessToken)
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle<{ role: AppRole }>();

    if (error) throw new Error(`Reading role failed: ${error.message}`);
    if (!data) throw accountMissing();
    return data.role;
  }

  private async getProfile(user: AuthenticatedUser) {
    const { data, error } = await this.supabase
      .forUser(user.accessToken)
      .from('profiles')
      .select('full_name, phone')
      .eq('id', user.id)
      .maybeSingle<{ full_name: string | null; phone: string | null }>();

    if (error) throw new Error(`Reading profile failed: ${error.message}`);
    if (!data) throw accountMissing();
    return data;
  }
}

// A token stays valid for a while after its account is deleted.
function accountMissing() {
  return new UnauthorizedException('This account no longer exists.');
}
