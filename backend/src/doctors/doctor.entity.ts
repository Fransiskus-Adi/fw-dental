import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('doctors')
export class Doctor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'clinic_id', type: 'uuid', nullable: true })
  clinicId?: string;

  @Column({ unique: true, nullable: true })
  code?: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  title?: string;

  @Column()
  specialty: string;

  @Column({ name: 'registration_number', nullable: true })
  registrationNumber?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'profile_image_url', type: 'text', nullable: true })
  profileImageUrl?: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ name: 'shift_start', default: '09:00' })
  shiftStart: string;

  @Column({ name: 'shift_end', default: '17:00' })
  shiftEnd: string;

  @Column({ type: 'simple-array', nullable: true })
  days?: string[];

  @Column({ default: 'Active' })
  status: string;

  @Column({ name: 'appointments_count', type: 'integer', default: 0 })
  appointmentsCount: number;

  @Column({ type: 'decimal', precision: 3, scale: 1, default: 5.0 })
  rating: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
