import { Router } from 'express';
import { EmployeeController } from './employee.controller';
import { requireAuth } from '../../middleware/auth.middleware';

export const employeeRouter = Router();

// Protect all employee endpoints with HR authentication
employeeRouter.use(requireAuth);

employeeRouter.get('/', EmployeeController.list);
employeeRouter.get('/facets', EmployeeController.getFacets);
employeeRouter.get('/:id', EmployeeController.getById);
