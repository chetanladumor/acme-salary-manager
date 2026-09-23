import { z } from 'zod';
import { EmploymentStatus } from '@prisma/client';

export const employeeQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? Math.max(1, parseInt(val, 10)) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? Math.min(100, Math.max(1, parseInt(val, 10))) : 25)),
  search: z.string().trim().optional(),
  country: z.string().trim().optional(),
  department: z.string().trim().optional(),
  jobTitle: z.string().trim().optional(),
  status: z.nativeEnum(EmploymentStatus).optional(),
  currency: z.string().trim().toUpperCase().optional(),
  minSalary: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : undefined)),
  maxSalary: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : undefined)),
  sortBy: z
    .enum(['employeeCode', 'firstName', 'lastName', 'department', 'country', 'jobTitle', 'hireDate'])
    .default('employeeCode'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type EmployeeQueryInput = z.infer<typeof employeeQuerySchema>;
