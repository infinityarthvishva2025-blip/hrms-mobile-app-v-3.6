Your first task is to deeply analyze and thoroughly understand the existing project architecture and implementation.

After completing the analysis, focus on implementing a fully functional and properly working salary view feature in PayslipsScreen.js.

Current Issue

When clicking on the “View” button, the payslip details for the selected user are not displayed.

Instead, a blank screen is shown.

The payslip data must be displayed in a proper, structured, and professional format.

Follow best coding practices, clean architecture, and proper state management.

APIs to Implement
1️⃣ View Payslip API

GET

http://192.168.1.75:5000/api/payroll/payslip-range?empCode=IA00022&fromDate=2025-12-21&toDate=2026-01-20
Backend Response:
{
  "empCode": "IA00022",
  "empName": "TUSHAR PAWAR",
  "year": 2025,
  "month": 12,
  "totalDaysInMonth": 31,
  "absentDays": 10,
  "lateMarks": 0,
  "lateDeductionDays": 0,
  "paidDays": 18.5,
  "totalSaturdayPaid": 0,
  "otherDeductions": 0,
  "monthlySalary": 10000.00,
  "perDaySalary": 322.58064516129032258064516129,
  "grossSalary": 5967.7419354838709677419354839,
  "performanceAllowance": 0,
  "otherAllowances": 0,
  "petrolAllowance": 0,
  "reimbursement": 0,
  "professionalTax": 0,
  "totalDeductions": 0,
  "netSalary": 5967.7419354838709677419354839,
  "totalPay": 5967.7419354838709677419354839,
  "base_salary": 0,
  "presentHalfDays": 3,
  "weeklyOffDays": 4,
  "bankName": null,
  "accountNumber": null,
  "ifscCode": null,
  "bankBranch": null,
  "department": "Finance",
  "designation": "Software Developer",
  "fromDate": "2025-12-21T00:00:00",
  "toDate": "2026-01-20T00:00:00"
}

The data must be rendered cleanly with proper formatting (currency formatting, section grouping like Earnings, Deductions, Attendance, Employee Details, etc.).

2️⃣ Download Payslip API

GET

http://192.168.1.75:5000/api/payroll/download-range?empCode=IA00022&fromDate=2025-12-21&toDate=2026-01-20

The response returns a PDF file for download (web).

We only need to pass the authentication token in the request header.

Implement proper file handling and download functionality.
for now just open the url for the salary slip 
Files That Must Be Deeply Analyzed

api.js

theme.js

AuthContext.js

DatePickerInput.js

PayslipModal.js

All navigation-related files

Ensure:

Proper token handling from AuthContext

Correct API integration using api.js

Consistent UI theming (without breaking existing theme structure)

Correct date selection handling using DatePickerInput

Proper modal handling (if used)

Implementation Requirements

Implement a best-in-class Payslip Screen UI

Clean, modern, professional layout

No blank screens

Proper loading state handling

Proper error handling

Fallback handling for null bank details

Do not break existing functionality

Maintain navigation integrity

Follow best coding standards and modular structure

The final implementation must ensure that:

The payslip details are correctly fetched and displayed for the selected employee.

The PDF download functionality works seamlessly.

The UI is clean, responsive, and production-ready.

The feature is fully functional without affecting existing project logic.