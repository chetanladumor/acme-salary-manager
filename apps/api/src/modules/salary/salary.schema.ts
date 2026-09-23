import { z } from 'zod';
import { ChangeReason } from '@prisma/client';

export const salaryAdjustmentSchema = z.object({
  annualSalary: z
    .number({ invalid_type_error: 'Annual salary must be a number' })
    .positive('Annual salary must be greater than zero'),
  currency: z
    .string()
    .trim()
    .length(3, 'Currency must be a 3-letter ISO code')
    .toUpperCase(),
  effectiveFrom: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: 'Effective from must be a valid ISO date string',
    }),
  reason: z.nativeEnum(ChangeReason, {
    errorMap: () => ({ message: 'A valid compensation change reason is required' }),
  }),
});

export type SalaryAdjustmentInput = z.infer<typeof salaryAdjustmentSchema>;
