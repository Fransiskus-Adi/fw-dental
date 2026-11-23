import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { hashNewPassword } from '../auth/password';
import { User } from './user.entity';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async findAll(): Promise<User[]> {
    return this.usersRepository.findAllOrderedByCreatedAtDesc();
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findById(id);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findByEmail(email);
  }

  async findForSession(id: string): Promise<User | null> {
    return this.usersRepository.findForSession(id);
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.usersRepository.findByEmailWithPassword(email);
  }

  async create(
    name: string,
    email: string,
    password?: string,
    phone?: string,
    roleCode?: string | null,
  ): Promise<User> {
    const existing = await this.usersRepository.findByEmail(email);
    if (existing) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = password ? await hashNewPassword(password) : undefined;

    return this.usersRepository.createAndSave(
      { name, email, password: hashedPassword, phone },
      { code: roleCode ?? undefined },
    );
  }

  async update(
    id: string,
    name: string,
    email: string,
    password?: string,
    phone?: string,
    roleCode?: string | null,
  ): Promise<User> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (email !== user.email) {
      const existing = await this.usersRepository.findByEmail(email);
      if (existing) {
        throw new ConflictException('Email already exists');
      }
    }

    user.name = name;
    user.email = email;
    user.phone = phone;

    if (password) {
      user.password = await hashNewPassword(password);
    }

    return this.usersRepository.createAndSave(
      user,
      roleCode === undefined ? undefined : { code: roleCode || undefined },
    );
  }

  issuePasswordReset(email: string, hash: string) {
    return this.usersRepository.issuePasswordReset(email, hash);
  }

  async resetPassword(hash: string, password: string): Promise<boolean> {
    if (!await this.usersRepository.hasPasswordReset(hash)) return false;
    return this.usersRepository.consumePasswordReset(hash, await hashNewPassword(password));
  }

  async delete(id: string): Promise<void> {
    await this.usersRepository.deleteById(id);
  }
}
