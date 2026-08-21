import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('absences')
export class Absence {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ type: 'date' })
  date: string; // YYYY-MM-DD

  @Column({ name: 'clock_in', type: 'timestamptz', nullable: true })
  clockIn: Date;

  @Column({ name: 'clock_out', type: 'timestamptz', nullable: true })
  clockOut: Date;

  @Column({ name: 'clock_in_location', nullable: true })
  clockInLocation: string;

  @Column({ name: 'clock_out_location', nullable: true })
  clockOutLocation: string;

  @Column()
  status: string; // 'PRESENT' or 'LATE'

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
