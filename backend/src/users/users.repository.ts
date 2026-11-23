import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
  ) {}

  async findById(id: string): Promise<User | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findForSession(id: string): Promise<User | null> {
    return this.repository.createQueryBuilder('user')
      .addSelect('user.sessionVersion')
      .where('user.id = :id', { id })
      .getOne();
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repository.findOne({ where: { email } });
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.repository.findOne({
      where: { email, enabled: 1, deleted: 0 },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        sessionVersion: true,
        roleCode: true,
        createdAt: true,
      },
    });
  }

  async issuePasswordReset(email: string, hash: string): Promise<string | undefined> {
    const [row] = await this.repository.query<{ email: string }[]>(
      `WITH issued AS (
        UPDATE auth.users
        SET password_reset_hash = $2, password_reset_expires_at = now() + interval '30 minutes'
        WHERE email = $1 AND enabled = 1 AND deleted = 0
          AND (password_reset_expires_at IS NULL
            OR password_reset_expires_at <= now() + interval '29 minutes')
          AND EXISTS (
            SELECT 1 FROM auth.user_roles ur JOIN auth.roles r ON r.code = ur.role_code
            WHERE ur.user_id = users.id AND ur.enabled = 1 AND ur.deleted = 0
              AND r.enabled = 1 AND r.deleted = 0
          )
        RETURNING email
      ) SELECT email FROM issued`,
      [email, hash],
    );
    return row?.email;
  }

  async hasPasswordReset(hash: string): Promise<boolean> {
    const [row] = await this.repository.query<{ id: string }[]>(
      `SELECT id FROM auth.users WHERE password_reset_hash = $1
        AND password_reset_expires_at > now() AND enabled = 1 AND deleted = 0`,
      [hash],
    );
    return Boolean(row);
  }

  async consumePasswordReset(hash: string, passwordHash: string): Promise<boolean> {
    const [row] = await this.repository.query<{ id: string }[]>(
      `WITH changed AS (
        UPDATE auth.users
        SET password_hash = $2, updated_at = now()
        WHERE password_reset_hash = $1 AND password_reset_expires_at > now()
          AND enabled = 1 AND deleted = 0
        RETURNING id
      ) SELECT id FROM changed`,
      [hash, passwordHash],
    );
    return Boolean(row);
  }

  async findAllOrderedByCreatedAtDesc(): Promise<User[]> {
    return this.repository.find({ order: { createdAt: 'DESC' } });
  }

  async createAndSave(
    userData: Partial<User>,
    role?: { code?: string },
  ): Promise<User> {
    return this.repository.manager.transaction(async (manager) => {
      const users = manager.getRepository(User);
      const { id } = await users.save(users.create(userData));
      if (role) {
        await manager.query('SELECT id FROM auth.users WHERE id = $1 FOR UPDATE', [id]);
        await manager.query(
          `UPDATE auth.user_roles SET enabled = 0, updated_at = now()
           WHERE user_id = $1 AND enabled = 1 AND deleted = 0
             AND role_code IS DISTINCT FROM $2`,
          [id, role.code ?? null],
        );
        if (role.code) {
          await manager.query(
            `INSERT INTO auth.user_roles (user_id, role_code) VALUES ($1, $2)
             ON CONFLICT (user_id, role_code) DO UPDATE SET
                 enabled = 1, deleted = 0, updated_at = now()`,
            [id, role.code],
          );
        }
      }
      return users.findOneByOrFail({ id });
    });
  }

  async deleteById(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
