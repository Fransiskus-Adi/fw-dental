import { z } from 'zod';
import { emailField, roleCodeField, textField } from '../input';

export const userInput = z.object({
  name: textField(255),
  email: emailField,
  phone: z.string().trim().max(30).optional(),
  password: z.string().min(1).max(72).optional(),
});

export const employeeInput = userInput.extend({
  roleCode: roleCodeField.nullable().optional(),
});
