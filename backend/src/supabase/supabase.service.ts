import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { EnvironmentVariables } from '../config/env.validation.js';

// A server handles many users at once, so it must never store anyone's session.
const SERVER_AUTH_OPTIONS = {
  persistSession: false,
  autoRefreshToken: false,
  detectSessionInUrl: false,
};

/** The only place in the backend that creates Supabase clients. */
@Injectable()
export class SupabaseService {
  private readonly url: string;
  private readonly publishableKey: string;
  private readonly systemClient: SupabaseClient;

  constructor(config: ConfigService<EnvironmentVariables, true>) {
    this.url = config.get('SUPABASE_URL', { infer: true });
    this.publishableKey = config.get('SUPABASE_PUBLISHABLE_KEY', {
      infer: true,
    });
    this.systemClient = createClient(
      this.url,
      config.get('SUPABASE_SECRET_KEY', { infer: true }),
      { auth: SERVER_AUTH_OPTIONS },
    );
  }

  /**
   * The default choice. Acts as the given user, so Row Level Security applies.
   * Creates a new client for each request, so users can never share one.
   */
  forUser(accessToken: string): SupabaseClient {
    return createClient(this.url, this.publishableKey, {
      auth: SERVER_AUTH_OPTIONS,
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });
  }

  /**
   * Bypasses Row Level Security. Only for admin and system work, and only after the
   * caller has checked the user's role or ownership itself.
   */
  asSystem(): SupabaseClient {
    return this.systemClient;
  }
}
