import { BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

export function hashNewPassword(password: unknown) {
  if (typeof password !== 'string' || [...password].length < 15 || bcrypt.truncates(password)) {
    throw new BadRequestException('Use at least 15 characters and at most 72 UTF-8 bytes.');
  }
  return bcrypt.hash(password, 12);
}
