import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';

export function parseInput<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    const field = result.error.issues[0]?.path.join('.');
    throw new BadRequestException(field ? 'Check the value of ' + field + '.' : 'Invalid request.');
  }
  return result.data;
}

export const textField = (max: number) => z.string().trim().min(1).max(max);
export const emailField = z.string().trim().pipe(z.email().max(255));
export const roleCodeField = z.string().regex(/^[A-Z0-9_]{1,50}$/);
