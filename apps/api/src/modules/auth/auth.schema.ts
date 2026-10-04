// to validate and sanitize incoming payloads before they hit our controllers—rejecting invalid emails and missing passwords with a 400 Bad Request to protect our database and save CPU cycles on bcrypt hashing
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address format'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;
