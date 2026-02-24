
Deeply analyze and fully understand the existing project, including:

All files and folder structure

Navigation flow

Role-based rendering logic

API integration files

Authentication handling (JWT token usage)

⚠️ Important:
Do NOT modify or break any existing functionality for:

Employee

HR

Everything currently working must remain unchanged.

🎯 Objective

When the logged-in user's role is:

Director

GM

Manager

VP

Add a new tab inside the current HR tabs section.

This tab must:

Be visible ONLY to:

Director

GM

Manager

VP

NOT be visible to HR

NOT affect employee view

🆕 New Tab: "Daily Report Inbox"
📌 UI Requirements

Display report data in table format with the following columns:

| From | Role | Date | Report | Status |

🔍 Report Column Functionality

Add a "View" button in the Report column.

When clicked:

Open a form/modal/page.

Show detailed report information of that specific employee.

Detailed View Should Display:

Today's Work

Pending Work

Issues

✅ Status Column Functionality

Add a checkbox/button: "Mark as Read"

When clicked:

Call mark-as-read API

Update status visually

Reflect read state in UI

🔐 Authentication Flow
Login API
POST http://192.168.1.75:5000/api/auth/login

Backend Response:

{
  "token": "JWT_TOKEN",
  "role": "Manager",
  "employeeId": 33,
  "employeeCode": "IA00014",
  "employeeName": "VRUSHALI U HIRVE"
}

Store and use the token properly in Authorization header:

Authorization: Bearer <token>
📥 Fetch All Reports (Inbox API)
GET http://192.168.1.75:5000/api/DailyReportApi/inbox?selectedDate=2026-02-23

Must pass JWT token in header

Data will be returned based on role permissions

Backend Response Example:

[
  {
    "id": 1678,
    "sender": "SHIVSHANKAR SURYKANT SAWARIKAR",
    "todaysWork": "Test",
    "pendingWork": "Na",
    "issues": "Na",
    "isRead": true,
    "createdDate": "2026-02-21T11:06:05.51"
  }
]
👁 View Detailed Report

Use the same inbox API data.

When "View" is clicked:

Use the selected report object

Display:

Today's Work

Pending Work

Issues

✔ Mark as Read API
POST http://192.168.1.75:5000/api/DailyReportApi/mark-read/{id}

Example:

http://192.168.1.75:5000/api/DailyReportApi/mark-read/1678

Backend Response:

{
  "message": "Marked as read"
}

After success:

Update UI immediately

Disable or mark checkbox as checked

Refresh state if needed

🧠 Technical Expectations

Implement proper role-based conditional rendering.

Reuse existing authentication/token system.

Follow existing project structure and patterns.

Do NOT duplicate logic unnecessarily.

Ensure clean state management.

Maintain performance and UI consistency.

Handle API errors gracefully.

🚫 Strict Restrictions

Do not change existing HR functionality.

Do not modify Employee functionality.

Do not break existing navigation.

Do not refactor unrelated files.

🎯 Final Deliverables

List of modified files

Any new files created

Full updated code for those files

Clear explanation of role-based rendering logic used