import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  VirtualColumn,
} from 'typeorm';

@Entity({ name: 'users', schema: 'auth' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'full_name', length: 255 })
  name: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ name: 'password_hash', type: 'text', select: false, nullable: true })
  password?: string;

  @Column({ name: 'phone_number', length: 30, nullable: true })
  phone?: string;

  @Column({ type: 'smallint', default: 1 })
  enabled: number;

  @Column({ type: 'smallint', default: 0 })
  deleted: number;

  @Column({ name: 'session_version', select: false })
  sessionVersion: number;

  @VirtualColumn({
    type: 'varchar',
    query: (alias) =>
      `SELECT role_code FROM auth.user_roles
       WHERE user_id = ${alias}.id AND enabled = 1 AND deleted = 0`,
  })
  roleCode?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
