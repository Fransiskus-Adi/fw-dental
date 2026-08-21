import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('patients')
export class Patient {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'patient_code', unique: true, nullable: true })
  patientCode?: string;

  @Column({ name: 'full_name' })
  fullName: string;

  @Column({ name: 'phone_number' })
  phoneNumber: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ name: 'date_of_birth', type: 'date', nullable: true })
  dateOfBirth?: string;

  @Column({ name: 'gender_code', nullable: true })
  genderCode?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'smallint', default: 1 })
  enabled: number;

  @Column({ type: 'smallint', default: 0 })
  deleted: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
