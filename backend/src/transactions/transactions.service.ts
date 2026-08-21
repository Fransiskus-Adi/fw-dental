import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { TransactionsRepository } from './transactions.repository';
import { PatientsRepository } from '../bookings/patients.repository';
import { Transaction } from './transaction.entity';

interface CreateTransactionDto {
  patientId?: string;
  patient?: {
    fullName: string;
    phoneNumber: string;
    email?: string;
  };
  bookingId?: string;
  clinicId?: string;
  doctorId?: string;
  discount?: number;
  tax?: number;
  paymentMethod?: string;
  paymentStatus?: string;
  transactionDate?: string;
  notes?: string;
  items: Array<{
    serviceId?: string;
    name: string;
    price: number;
    quantity: number;
  }>;
}

@Injectable()
export class TransactionsService {
  constructor(
    private readonly repository: TransactionsRepository,
    private readonly patientsRepository: PatientsRepository,
  ) {}

  async findAll(): Promise<Transaction[]> {
    return this.repository.findAll();
  }

  async findById(id: string): Promise<Transaction> {
    const transaction = await this.repository.findById(id);
    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }
    return transaction;
  }

  async create(data: CreateTransactionDto): Promise<Transaction> {
    let patientId = data.patientId;

    // Create patient inline if patient info is passed and patientId is missing
    if (!patientId && data.patient) {
      let patient = await this.patientsRepository.findByPhone(data.patient.phoneNumber);
      if (!patient) {
        const patientCode = `PAT-${Math.floor(1000 + Math.random() * 9000)}`;
        patient = await this.patientsRepository.createAndSave({
          fullName: data.patient.fullName,
          phoneNumber: data.patient.phoneNumber,
          email: data.patient.email,
          patientCode,
        });
      }
      patientId = patient.id;
    }

    if (!patientId) {
      throw new BadRequestException('Patient selection or new patient info is required.');
    }

    if (!data.items || data.items.length === 0) {
      throw new BadRequestException('Transaction must contain at least one item.');
    }

    const transactionCode = `TX-${Math.floor(100000 + Math.random() * 900000)}`;
    
    // Calculate totals
    const subtotal = data.items.reduce(
      (sum, item) => sum + Number(item.price) * (item.quantity || 1),
      0,
    );
    const discount = Number(data.discount || 0);
    const netAmount = Math.max(0, subtotal - discount);
    const tax = Math.round(netAmount * 0.11 * 100) / 100;
    const totalAmount = netAmount + tax;

    const transactionData: Partial<Transaction> = {
      transactionCode,
      clinicId: data.clinicId,
      bookingId: data.bookingId,
      patientId,
      doctorId: data.doctorId,
      subtotal,
      discount,
      tax,
      totalAmount,
      paymentMethod: data.paymentMethod,
      paymentStatus: data.paymentStatus || 'UNPAID',
      transactionDate: data.transactionDate || new Date().toISOString().split('T')[0],
      notes: data.notes,
      enabled: 1,
      deleted: 0,
      items: data.items.map((item) => {
        const itemPrice = Number(item.price);
        const qty = item.quantity || 1;
        return {
          serviceId: item.serviceId,
          name: item.name,
          price: itemPrice,
          quantity: qty,
          totalPrice: itemPrice * qty,
        } as any;
      }),
    };

    return this.repository.createAndSave(transactionData);
  }

  async updateStatus(id: string, paymentStatus: string): Promise<Transaction> {
    const transaction = await this.findById(id);
    transaction.paymentStatus = paymentStatus.toUpperCase();
    return this.repository.save(transaction);
  }

  async remove(id: string): Promise<void> {
    const transaction = await this.findById(id);
    transaction.deleted = 1;
    await this.repository.save(transaction);
  }
}
