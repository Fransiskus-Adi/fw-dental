import { z } from 'zod';

const production = z.object({
  DB_HOST: z.string().min(1),
  DB_USERNAME: z.string().min(1),
  DB_PASSWORD: z.string().min(1),
  DB_DATABASE: z.string().min(1),
  DB_PORT: z.coerce.number().int().min(1).max(65535).default(5432),
  DB_SYNCHRONIZE: z.literal('false').optional(),
  PUBLIC_APP_URL: z.url({ protocol: /^https$/ }).refine((value) => {
    const url = new URL(value);
    return url.origin === value.replace(/\/$/, '');
  }),
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(587),
  SMTP_USER: z.string().min(1),
  SMTP_PASS: z.string().min(1),
  SMTP_FROM: z.string().min(1),
  NOTIFICATION_WEBHOOK_SECRET: z.string().regex(/^[A-Za-z0-9_-]{32,}$/),
});

export function validateEnvironment(env: Record<string, unknown>) {
  if (env.NODE_ENV !== 'production') return env;
  const result = production.safeParse(env);
  if (!result.success) {
    throw new Error('Invalid production configuration: ' + result.error.issues.map(issue => issue.path.join('.')).join(', '));
  }
  // ConfigService and existing environment consumers keep their string values.
  return env;
}
