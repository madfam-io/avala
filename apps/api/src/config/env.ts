import { z } from 'zod';

/**
 * Environment Configuration Schema
 *
 * Provides runtime validation of all required environment variables
 * with type-safe exports and clear error messages on validation failure.
 *
 * Supports: development, staging, production environments
 */

const NodeEnvSchema = z.enum(['development', 'staging', 'production', 'test']);

const DatabaseSchema = z.object({
  url: z.string().url('DATABASE_URL must be a valid PostgreSQL connection string'),
});

const RedisSchema = z.object({
  url: z.string().url('REDIS_URL must be a valid Redis connection string').optional(),
});

const JWTSchema = z.object({
  secret: z
    .string()
    .min(32, 'JWT_SECRET must be at least 32 characters for security'),
  expiresIn: z.string().default('7d'),
});

const JanuaSchema = z.object({
  baseUrl: z.string().url('JANUA_BASE_URL must be a valid URL'),
  clientId: z.string().min(1, 'JANUA_CLIENT_ID is required'),
  clientSecret: z.string().min(1, 'JANUA_CLIENT_SECRET is required'),
  redirectUri: z.string().url('JANUA_REDIRECT_URI must be a valid URL'),
  internalApiKey: z.string().optional(),
});

const SMTPSchema = z.object({
  host: z.string().default('localhost'),
  port: z.coerce.number().int().min(1).max(65535).default(1025),
  user: z.string().optional(),
  pass: z.string().optional(),
  from: z.string().email('SMTP_FROM must be a valid email').default('noreply@avala.local'),
});

const APISchema = z.object({
  port: z.coerce.number().int().min(1).max(65535).default(4000),
  host: z.string().default('0.0.0.0'),
  webUrl: z.string().url('WEB_URL must be a valid URL').optional(),
});

const AppURLSchema = z.object({
  publicAppUrl: z.string().url('NEXT_PUBLIC_APP_URL must be a valid URL').optional(),
  publicApiUrl: z.string().url('NEXT_PUBLIC_API_URL must be a valid URL').optional(),
});

const ThrottleSchema = z.object({
  shortLimit: z.coerce.number().int().min(1).default(3),
  mediumLimit: z.coerce.number().int().min(1).default(20),
  longLimit: z.coerce.number().int().min(1).default(100),
});

const RenecSchema = z.object({
  harvestEnabled: z
    .string()
    .transform((val) => val === 'true')
    .default('false'),
});

const BillingSchema = z.object({
  stripeWebhookSecret: z.string().optional(),
  stripeSecretKey: z.string().optional(),
});

const S3Schema = z.object({
  accessKeyId: z.string().optional(),
  secretAccessKey: z.string().optional(),
  region: z.string().default('us-east-1'),
  bucket: z.string().optional(),
});

const AnalyticsSchema = z.object({
  sentryDsn: z.string().url().optional(),
  gaTrackingId: z.string().optional(),
});

const EnvSchema = z.object({
  NODE_ENV: NodeEnvSchema.default('development'),
  DATABASE_URL: z.string(),
  REDIS_URL: z.string().optional(),
  JWT_SECRET: z.string(),
  JWT_EXPIRES_IN: z.string().optional(),
  JANUA_BASE_URL: z.string(),
  JANUA_CLIENT_ID: z.string(),
  JANUA_CLIENT_SECRET: z.string(),
  JANUA_REDIRECT_URI: z.string(),
  JANUA_INTERNAL_API_KEY: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  PORT: z.string().optional(),
  HOST: z.string().optional(),
  WEB_URL: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().optional(),
  NEXT_PUBLIC_API_URL: z.string().optional(),
  THROTTLE_SHORT_LIMIT: z.string().optional(),
  THROTTLE_MEDIUM_LIMIT: z.string().optional(),
  THROTTLE_LONG_LIMIT: z.string().optional(),
  RENEC_HARVEST_ENABLED: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  GA_TRACKING_ID: z.string().optional(),
});

/**
 * Validates and parses environment variables
 * Throws detailed error messages on validation failure
 */
function validateEnv() {
  try {
    const rawEnv = EnvSchema.parse(process.env);

    const database = DatabaseSchema.parse({
      url: rawEnv.DATABASE_URL,
    });

    const redis = RedisSchema.parse({
      url: rawEnv.REDIS_URL,
    });

    const jwt = JWTSchema.parse({
      secret: rawEnv.JWT_SECRET,
      expiresIn: rawEnv.JWT_EXPIRES_IN,
    });

    const janua = JanuaSchema.parse({
      baseUrl: rawEnv.JANUA_BASE_URL,
      clientId: rawEnv.JANUA_CLIENT_ID,
      clientSecret: rawEnv.JANUA_CLIENT_SECRET,
      redirectUri: rawEnv.JANUA_REDIRECT_URI,
      internalApiKey: rawEnv.JANUA_INTERNAL_API_KEY,
    });

    const smtp = SMTPSchema.parse({
      host: rawEnv.SMTP_HOST,
      port: rawEnv.SMTP_PORT,
      user: rawEnv.SMTP_USER,
      pass: rawEnv.SMTP_PASS,
      from: rawEnv.SMTP_FROM,
    });

    const api = APISchema.parse({
      port: rawEnv.PORT,
      host: rawEnv.HOST,
      webUrl: rawEnv.WEB_URL,
    });

    const appUrls = AppURLSchema.parse({
      publicAppUrl: rawEnv.NEXT_PUBLIC_APP_URL,
      publicApiUrl: rawEnv.NEXT_PUBLIC_API_URL,
    });

    const throttle = ThrottleSchema.parse({
      shortLimit: rawEnv.THROTTLE_SHORT_LIMIT,
      mediumLimit: rawEnv.THROTTLE_MEDIUM_LIMIT,
      longLimit: rawEnv.THROTTLE_LONG_LIMIT,
    });

    const renec = RenecSchema.parse({
      harvestEnabled: rawEnv.RENEC_HARVEST_ENABLED,
    });

    const billing = BillingSchema.parse({
      stripeWebhookSecret: rawEnv.STRIPE_WEBHOOK_SECRET,
      stripeSecretKey: rawEnv.STRIPE_SECRET_KEY,
    });

    const s3 = S3Schema.parse({
      accessKeyId: rawEnv.AWS_ACCESS_KEY_ID,
      secretAccessKey: rawEnv.AWS_SECRET_ACCESS_KEY,
      region: rawEnv.AWS_REGION,
      bucket: rawEnv.AWS_S3_BUCKET,
    });

    const analytics = AnalyticsSchema.parse({
      sentryDsn: rawEnv.SENTRY_DSN,
      gaTrackingId: rawEnv.GA_TRACKING_ID,
    });

    return {
      nodeEnv: rawEnv.NODE_ENV,
      database,
      redis,
      jwt,
      janua,
      smtp,
      api,
      appUrls,
      throttle,
      renec,
      billing,
      s3,
      analytics,
      raw: rawEnv,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.errors
        .map((err) => {
          const path = err.path.join('.');
          return `  ❌ ${path}: ${err.message}`;
        })
        .join('\n');

      console.error('\n🚨 Environment Validation Failed 🚨\n');
      console.error('Missing or invalid environment variables:\n');
      console.error(formattedErrors);
      console.error('\n📝 Please check your .env file and ensure all required variables are set.\n');
      console.error(
        '💡 Refer to .env.example for the complete list of required variables.\n',
      );

      process.exit(1);
    }

    throw error;
  }
}

/**
 * Validated and typed environment configuration
 */
export const env = validateEnv();

export type Env = ReturnType<typeof validateEnv>;

export const isProduction = env.nodeEnv === 'production';
export const isDevelopment = env.nodeEnv === 'development';
export const isTest = env.nodeEnv === 'test';
export const isStaging = env.nodeEnv === 'staging';
