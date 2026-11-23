import { z } from 'zod';
import { emailField, textField } from '../input';

export const paymentStatusField = z.enum(['UNPAID', 'PAID', 'CANCELLED']);

export const transactionInput = z.object({
  patientId: z.guid().optional(),
  patient: z.object({
    fullName: textField(150),
    phoneNumber: textField(30),
    email: emailField.optional(),
  }).optional(),
  doctorId: z.guid().optional(),
  discount: z.number().min(0).max(9999999999999).optional(),
  paymentMethod: z.enum(['CASH', 'DEBIT_CARD', 'CREDIT_CARD', 'QRIS', 'BANK_TRANSFER']).optional(),
  paymentStatus: paymentStatusField.optional(),
  transactionDate: z.iso.date().optional(),
  notes: z.string().max(2000).optional(),
  items: z.array(z.object({
    serviceId: z.guid().optional(),
    name: textField(150),
    price: z.number().min(0).max(9999999999999),
    quantity: z.number().int().min(1).max(10000),
  })).min(1).max(100),
}).refine(({ items }) => items.reduce((sum, item) => sum + item.price * item.quantity, 0) <= 9_000_000_000_000, {
  path: ['items'],
  message: 'Transaction total is too large.',
});

export type TransactionInput = z.infer<typeof transactionInput>;
