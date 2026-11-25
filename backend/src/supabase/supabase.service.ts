import {
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  SupabaseClient,
  createClient,
  isAuthRetryableFetchError,
} from '@supabase/supabase-js';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
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
  private readonly visitorClient: SupabaseClient;
  /** Only verifies tokens. Keeps Supabase's public keys cached between requests. */
  private readonly tokenVerifier: SupabaseClient;

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
    this.tokenVerifier = createClient(this.url, this.publishableKey, {
      auth: SERVER_AUTH_OPTIONS,
    });
    this.visitorClient = createClient(this.url, this.publishableKey, {
      auth: SERVER_AUTH_OPTIONS,
    });
  }

  /** Checks the signature and expiry, and that this project issued it to a user. */
  async verifyAccessToken(accessToken: string): Promise<AuthenticatedUser> {
    const claims = await this.getClaims(accessToken);

    if (
      claims?.iss !== `${this.url}/auth/v1` ||
      claims.aud !== 'authenticated' ||
      claims.role !== 'authenticated' ||
      !claims.sub ||
      !claims.email
    ) {
      throw invalidSession();
    }

    return { id: claims.sub, email: claims.email, accessToken };
  }

  private async getClaims(accessToken: string) {
    let result: Awaited<ReturnType<typeof this.tokenVerifier.auth.getClaims>>;
    try {
      result = await this.tokenVerifier.auth.getClaims(accessToken);
    } catch {
      // Some badly formed tokens throw instead of returning an error.
      throw invalidSession();
    }

    // Supabase being unreachable does not mean the user's token is wrong.
    if (isAuthRetryableFetchError(result.error)) {
      throw new ServiceUnavailableException('Login check is unavailable.');
    }
    return result.data?.claims;
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
   * For public data. Acts as someone who is not logged in, so Row Level Security
   * applies. Safe to share, because it holds no user's session.
   */
  asVisitor(): SupabaseClient {
    return this.visitorClient;
  }

  /**
   * Bypasses Row Level Security. Only for admin and system work, and only after the
   * caller has checked the user's role or ownership itself.
   */
  asSystem(): SupabaseClient {
    return this.systemClient;
  }
}

function invalidSession() {
  return new UnauthorizedException('Your session is invalid or has expired.');
}
