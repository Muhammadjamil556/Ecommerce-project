import { Global, Module } from '@nestjs/common';
import { SupabaseService } from './supabase.service.js';

/** Global, because almost every feature needs the database. */
@Global()
@Module({
  providers: [SupabaseService],
  exports: [SupabaseService],
})
export class SupabaseModule {}
