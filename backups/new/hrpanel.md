


hr panel 

1) dashboard

2) employee managemenrt
a) view all employess
b) view particular employee detaild
c) edit employee
d)add new employee
e) set use active and inactive


3) attendance

4) leave management and approval

5) payroll

6) gurkukul admin

7) Announ cement

8) Rsignation

9) reports

=======================

deeply analyze and understand existing project , all files and folder structure , navigations , apis file 
do not change any functionlity of employee or hr 

what we have to is that , when the role is

1) Director
2) GM
3) Manager
4) VP

add one more tab in the 
currenr hr tabs 



this should be not visible to the hr 
just visible to the 

1) Director
2) GM
3) Manager
4) VP

the tab is 

Daily Report Inbox

show the data in table format 


From	Role	Date	Report	Status



in report columns there is view functionlity , when clicked on it a form showing the detais of reports of that particular employee opens 
in that show    

Today's Work

Pending Work

Issues








and in the status colums , the functionluity of mark as read , the check box button to mark as read the reoport

api flows 



login :

http://192.168.1.75:5000/api/auth/login

backend response :
{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6IjMzIiwiaHR0cDovL3NjaGVtYXMubWljcm9zb2Z0LmNvbS93cy8yMDA4LzA2L2lkZW50aXR5L2NsYWltcy9yb2xlIjoiTWFuYWdlciIsIkVtcGxveWVlQ29kZSI6IklBMDAwMTQiLCJFbXBsb3llZU5hbWUiOiJWUlVTSEFMSSBVIEhJUlZFIiwiZXhwIjoxNzcxODY3NjE4LCJpc3MiOiJIUk1TIiwiYXVkIjoiSFJNU1VzZXJzIn0.SruzSDEiPNQIfdDQXlR5yfb0E8exJuoPm9oX12fllHU",
    "role": "Manager",
    "employeeId": 33,
    "employeeCode": "IA00014",
    "employeeName": "VRUSHALI U HIRVE"
}

to get all the reports 

just we have to add the token proprly , then accordingly we will get the details

http://192.168.1.75:5000/api/DailyReportApi/inbox?selectedDate=2026-02-23

backend response :

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


to view the detailed details , use the same api , when clicked on the view 

3) mark  as read : in status column 

http://192.168.1.75:5000/api/DailyReportApi/mark-read/1678

backend response :

{
    "message": "Marked as read"
}


==================================



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