/**
 * RFC-4180 compliant CSV export utility for employee data.
 */

export interface ExportableEmployee {
  id?: string;
  employeeCode?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  department?: string;
  jobTitle?: string;
  country?: string;
  status?: string;
  hireDate?: string | Date;
}

/**
 * Escapes a cell value for RFC-4180 CSV compliance:
 * - Wraps in double quotes
 * - Replaces any existing double quotes with two double quotes ("")
 */
function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) {
    return '""';
  }
  const str = String(value);
  return `"${str.replace(/"/g, '""')}"`;
}

/**
 * Converts a list of employees into a CSV string with standard headers.
 */
export function generateEmployeesCsv(employees: ExportableEmployee[]): string {
  const headers = [
    'Employee Code',
    'First Name',
    'Last Name',
    'Email',
    'Department',
    'Job Title',
    'Country',
    'Status',
    'Hire Date',
  ];

  const headerRow = headers.join(',');

  if (!employees || employees.length === 0) {
    return headerRow;
  }

  const rows = employees.map((emp) => {
    let formattedDate = '';
    if (emp.hireDate) {
      formattedDate = typeof emp.hireDate === 'string'
        ? emp.hireDate.slice(0, 10)
        : emp.hireDate.toISOString().slice(0, 10);
    }

    return [
      escapeCsvCell(emp.employeeCode),
      escapeCsvCell(emp.firstName),
      escapeCsvCell(emp.lastName),
      escapeCsvCell(emp.email),
      escapeCsvCell(emp.department),
      escapeCsvCell(emp.jobTitle),
      escapeCsvCell(emp.country),
      escapeCsvCell(emp.status),
      escapeCsvCell(formattedDate),
    ].join(',');
  });

  return [headerRow, ...rows].join('\n');
}

/**
 * Triggers a browser file download of the CSV string.
 */
export function downloadCsv(csvContent: string, filename?: string): void {
  const finalFilename = filename || `employees_export_${new Date().toISOString().slice(0, 10)}.csv`;
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.setAttribute('href', url);
  link.setAttribute('download', finalFilename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
