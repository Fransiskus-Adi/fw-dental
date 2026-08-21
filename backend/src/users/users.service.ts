import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
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

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.usersRepository.findByEmailWithPassword(email);
  }

  async create(
    name: string,
    email: string,
    password?: string,
    phone?: string,
  ): Promise<User> {
    const existing = await this.usersRepository.findByEmail(email);
    if (existing) {
      throw new ConflictException('Email already exists');
    }

    let hashedPassword: string | undefined = undefined;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    }

    return this.usersRepository.createAndSave({
      name,
      email,
      password: hashedPassword,
      phone,
    });
  }

  async update(
    id: string,
    name: string,
    email: string,
    password?: string,
    phone?: string,
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
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    return this.usersRepository.createAndSave(user);
  }

  async updatePassword(email: string, password: string): Promise<void> {
    const user = await this.usersRepository.findByEmailWithPassword(email);
    if (!user) {
      throw new ConflictException('User not found');
    }
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await this.usersRepository.createAndSave(user);
  }

  async delete(id: string): Promise<void> {
    await this.usersRepository.deleteById(id);
  }
}
