import { describe, it, expect } from 'vitest';
import { generateEmployeesCsv } from './formatters';

describe('CSV Exporter Utility', () => {
  it('formats employee objects into valid RFC-4180 CSV rows with headers', () => {
    const employees = [
      {
        id: '1',
        employeeCode: 'ACM-00001',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@acme.com',
        department: 'Engineering',
        jobTitle: 'Senior Software Engineer',
        country: 'United States',
        status: 'ACTIVE',
        hireDate: '2023-01-15T00:00:00.000Z',
      },
    ];

    const csv = generateEmployeesCsv(employees);
    const lines = csv.split('\n');

    expect(lines[0]).toBe('Employee Code,First Name,Last Name,Email,Department,Job Title,Country,Status,Hire Date');
    expect(lines[1]).toBe('"ACM-00001","John","Doe","john.doe@acme.com","Engineering","Senior Software Engineer","United States","ACTIVE","2023-01-15"');
  });

  it('escapes special characters, double quotes, and commas cleanly', () => {
    const employees = [
      {
        id: '2',
        employeeCode: 'ACM-00002',
        firstName: 'Jane "JJ"',
        lastName: 'Smith, Jr.',
        email: 'jane@acme.com',
        department: 'Sales, Marketing & BD',
        jobTitle: 'VP, Operations',
        country: 'United Kingdom',
        status: 'ACTIVE',
        hireDate: '2022-06-10T00:00:00.000Z',
      },
    ];

    const csv = generateEmployeesCsv(employees);
    const lines = csv.split('\n');

    expect(lines[1]).toBe('"ACM-00002","Jane ""JJ""","Smith, Jr.","jane@acme.com","Sales, Marketing & BD","VP, Operations","United Kingdom","ACTIVE","2022-06-10"');
  });

  it('returns only headers when list is empty', () => {
    const csv = generateEmployeesCsv([]);
    expect(csv).toBe('Employee Code,First Name,Last Name,Email,Department,Job Title,Country,Status,Hire Date');
  });
});
