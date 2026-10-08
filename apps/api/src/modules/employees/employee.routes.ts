import { Router } from 'express';
import { EmployeeController } from './employee.controller';
import { SalaryController } from '../salary/salary.controller';
import { requireAuth, requireRole } from '../../middleware/auth.middleware';

export const employeeRouter = Router();

// Protect all employee endpoints with HR authentication
employeeRouter.use(requireAuth);

employeeRouter.get('/', EmployeeController.list);
employeeRouter.get('/facets', EmployeeController.getFacets);
employeeRouter.get('/export', EmployeeController.exportEmployee);
employeeRouter.get('/:id', EmployeeController.getById);

// Compensation adjustment & history (Only HR_ADMIN can modify salaries)
employeeRouter.post('/:id/salary', requireRole(['HR_ADMIN']), SalaryController.adjust);
employeeRouter.get('/:id/salary', SalaryController.getHistory);