import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('services')
export class Service {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'clinic_id', type: 'uuid', nullable: true })
  clinicId?: string;

  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  slug?: string;

  @Column({ name: 'short_description', length: 500, nullable: true })
  shortDescription?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'duration_minutes', type: 'integer', default: 30 })
  durationMinutes: number;

  @Column({ name: 'price_from', type: 'decimal', precision: 15, scale: 2, nullable: true })
  priceFrom?: number;

  @Column({ name: 'price_to', type: 'decimal', precision: 15, scale: 2, nullable: true })
  priceTo?: number;

  @Column({ name: 'image_url', type: 'text', nullable: true })
  imageUrl?: string;

  @Column({ name: 'display_order', type: 'integer', default: 0 })
  displayOrder: number;

  @Column({ type: 'smallint', default: 1 })
  enabled: number;

  @Column({ type: 'smallint', default: 0 })
  deleted: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
