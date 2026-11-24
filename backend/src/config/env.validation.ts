import { Transform, plainToInstance } from 'class-transformer';
import { IsIn, IsInt, IsUrl, Max, Min, validateSync } from 'class-validator';

const ENVIRONMENTS = ['development', 'test', 'production'] as const;

/** Browsers send an origin without a trailing slash, so CORS needs the same form. */
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
