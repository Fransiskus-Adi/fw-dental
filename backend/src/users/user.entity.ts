import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false, nullable: true })
  password?: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ name: 'role_code', nullable: true })
  roleCode?: string;

  @CreateDateColumn()
  createdAt: Date;
}
