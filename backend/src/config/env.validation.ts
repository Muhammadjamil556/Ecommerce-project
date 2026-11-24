import { Transform, plainToInstance } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsUrl,
  Matches,
  Max,
  Min,
  validateSync,
} from 'class-validator';

// Rejects the placeholders from .env.example, and catches the two keys being swapped.
const PUBLISHABLE_KEY = /^sb_publishable_(?!replace_me)\S+$/;
const SECRET_KEY = /^sb_secret_(?!replace_me)\S+$/;

const ENVIRONMENTS = ['development', 'test', 'production'] as const;

/** Keeps only "https://host:port", removing a trailing slash or path. */
function toOrigin(value: unknown): unknown {
  return typeof value === 'string' && URL.canParse(value)
    ? new URL(value).origin
    : value;
}

export class EnvironmentVariables {
  @IsIn(ENVIRONMENTS)
  NODE_ENV: (typeof ENVIRONMENTS)[number] = 'development';

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT: number = 3000;

  @Transform(({ value }) => toOrigin(value))
  @IsUrl({
    require_tld: false,
    require_protocol: true,
    protocols: ['http', 'https'],
  })
  FRONTEND_URL: string;

  @Transform(({ value }) => toOrigin(value))
  @IsUrl({ require_protocol: true, protocols: ['https'] })
  SUPABASE_URL: string;

  @Matches(PUBLISHABLE_KEY, {
    message: 'SUPABASE_PUBLISHABLE_KEY must be your sb_publishable_... key',
  })
  SUPABASE_PUBLISHABLE_KEY: string;

  @Matches(SECRET_KEY, {
    message: 'SUPABASE_SECRET_KEY must be your sb_secret_... key',
  })
  SUPABASE_SECRET_KEY: string;
}

/** Stops the server from starting when an environment variable is missing or wrong. */
export function validateEnv(
  rawEnv: Record<string, unknown>,
): EnvironmentVariables {
  const env = plainToInstance(EnvironmentVariables, rawEnv, {
    exposeDefaultValues: true,
  });
  const errors = validateSync(env);

  if (errors.length > 0) {
    const problems = errors
      .flatMap((error) => Object.values(error.constraints ?? {}))
      .map((message) => `  - ${message}`)
      .join('\n');
    throw new Error(
      `Invalid environment variables:\n${problems}\nCheck backend/.env against backend/.env.example.`,
    );
  }

  return env;
}
