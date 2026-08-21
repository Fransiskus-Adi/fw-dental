import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TransactionItem } from './transaction-item.entity';
import { Patient } from '../bookings/patient.entity';
import { Doctor } from '../doctors/doctor.entity';
import { Booking } from '../bookings/booking.entity';

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'transaction_code', unique: true })
  transactionCode: string;

  @Column({ name: 'clinic_id', type: 'uuid', nullable: true })
  clinicId?: string;

  @Column({ name: 'booking_id', type: 'uuid', nullable: true })
  bookingId?: string;

  @Column({ name: 'patient_id', type: 'uuid' })
  patientId: string;

  @Column({ name: 'doctor_id', type: 'uuid', nullable: true })
  doctorId?: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  discount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  tax: number;

  @Column({ name: 'total_amount', type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalAmount: number;

  @Column({ name: 'payment_method', nullable: true })
  paymentMethod?: string;

  @Column({ name: 'payment_status', default: 'UNPAID' })
  paymentStatus: string;

  @Column({ name: 'transaction_date', type: 'date' })
  transactionDate: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'smallint', default: 1 })
  enabled: number;

  @Column({ type: 'smallint', default: 0 })
  deleted: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Patient)
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @ManyToOne(() => Doctor, { nullable: true })
  @JoinColumn({ name: 'doctor_id' })
  doctor?: Doctor;

  @ManyToOne(() => Booking, { nullable: true })
  @JoinColumn({ name: 'booking_id' })
  booking?: Booking;

  @OneToMany(() => TransactionItem, (item) => item.transaction, { cascade: true })
  items: TransactionItem[];
}
