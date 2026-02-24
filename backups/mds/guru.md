












check whether the navigation is corret or not

2) UPDATE THE UI FOR 


api.js
theme.js
dont want to break existing functionlity


DailyReportInboxScreen.JS

GurukulAdminScreen.JS

VideoPlayer.js




















gurukul 

i have shared gurukul-create.html my web code for your refrence 

and  GurukulAdminScreen.js 

theme.js , api.js 

deeply analyze this files and give me entire corrected code for the GurukulAdminScreen.js and create our best video player which is 

 a reusable component for video player inside the compomnents folder use best libraries of react - native expo , conduct a deep research and use the best libraries 





1) crete a video 
api : http://192.168.1.75:5000/api/GurukulApi/hr/videos

in body in form-data we have to send

TitleGroup

Category
Title
AllowedDepartment
Description
VideoFile
AllowedDepartment
AllowedEmployeeId
ExternalLink



to get all the all department

api:Get all departments get -> /api/employees/departments



backnes response :

[
    "ACCOUNTANT",
    "AREA MANAGER",
    "BDM",
    "DIRECTOR",
    "DRIVER",
    "Finance",
    "HELPER",
    "HR",
    "INSURANCE",
    "INVESTMENT",
    "IT",
    "LOAN",
    "OFFICE BOY",
    "SALES",
    "WEALTH ADVISOR"
]





to select one option use bset selctor

get the the sepecific employee 

in form-date we have to send the id of the employee ,
while displying to select display the name and emploloyee code 



Limit to Specific Employee
api :http://192.168.1.75:5000/api/employees/active

backned respones :

[
    {
        "id": 112,
        "name": "AARYAN SONAR",
        "employeeCode": "IA00093",
        "displayName": "AARYAN SONAR (IA00093)"
    },
    {
        "id": 117,
        "name": "ANKITA MENDSURE",
        "employeeCode": "IA00098",
        "displayName": "ANKITA MENDSURE (IA00098)"
    },
    {
        "id": 23,
        "name": "ASHWINI BHIMRAO KAMBLE",
        "employeeCode": "IA00004",
        "displayName": "ASHWINI BHIMRAO KAMBLE (IA00004)"
    },
    {
        "id": 106,
        "name": "BHAGYSHREE MORE",
        "employeeCode": "IA00087",
        "displayName": "BHAGYSHREE MORE (IA00087)"
    },



]




backend response :

{
    "message": "Video created successfully",
    "videoPath": "/Uploads/gurukul/6255da83-9e06-410c-b4d5-ac21fba18c92.mp4"
}


2) view all videos details
get 
http://192.168.1.75:5000/api/GurukulApi/hr/videos


backend response :

[
    {
        "id": 36,
        "titleGroup": "AI",
        "category": "Intoduction TO AI ",
        "title": "machine learning part 1",
        "description": "test desctiption",
        "videoPath": "/Uploads/gurukul/6255da83-9e06-410c-b4d5-ac21fba18c92.mp4",
        "isExternal": false,
        "thumbnailPath": null,
        "uploadedOn": "2026-02-24T10:20:11.968696",
        "allowedDepartment": "IT",
        "allowedEmployeeId": null,
        "allowedEmployee": null
    },
    {
        "id": 35,
        "titleGroup": "AI",
        "category": "Intoduction TO AI ",
        "title": "machine learning part 1",
        "description": "test desctiption",
        "videoPath": "/Uploads/gurukul/2e94b4d8-ccc0-46eb-b585-1ff7799bd633.mp4",
        "isExternal": false,
        "thumbnailPath": null,
        "uploadedOn": "2026-02-24T10:18:23.5114674",
        "allowedDepartment": "IT",
        "allowedEmployeeId": null,
        "allowedEmployee": null
    },
    {
        "id": 34,
        "titleGroup": "AI",
        "category": "Intoduction TO AI ",
        "title": "machine learning part 1",
        "description": "test desctiption",
        "videoPath": "/Uploads/gurukul/5566b435-6f48-46a1-a9d4-b7bfaefe1424.mp4",
        "isExternal": false,
        "thumbnailPath": null,
        "uploadedOn": "2026-02-24T10:17:40.9907783",
        "allowedDepartment": "IT",
        "allowedEmployeeId": null,
        "allowedEmployee": null
    },
    {
        "id": 33,
        "titleGroup": "AI",
        "category": "Intoduction TO AI ",
        "title": "machine learning part 1",
        "description": "test desctiption",
        "videoPath": "/Uploads/gurukul/1d98b352-b7ca-4ea2-9d27-aba8322b35ac.mp4",
        "isExternal": false,
        "thumbnailPath": null,
        "uploadedOn": "2026-02-24T10:07:46.3165326",
        "allowedDepartment": "IT",
        "allowedEmployeeId": null,
        "allowedEmployee": null
    },
    {
        "id": 32,
        "titleGroup": "AI tesing",
        "category": "Intoduction TO AI ",
        "title": "machine learning part 1",
        "description": "test desctiption",
        "videoPath": "/Uploads/gurukul/9a3d3d61-5fbd-47d8-95d7-f542e7aa944e.mp4",
        "isExternal": false,
        "thumbnailPath": "/uploads/gurukul/ears-coloring-book-animals-photo.jpg",
        "uploadedOn": "2026-02-24T10:07:32.2227654",
        "allowedDepartment": "IT",
        "allowedEmployeeId": null,
        "allowedEmployee": null
    },

]


3) view a particular video

get :
http://192.168.1.75:5000/Uploads/gurukul/1d98b352-b7ca-4ea2-9d27-aba8322b35ac.mp4

we get the video directly




4) delete the video

to delete the video (hr side)

52.HR — DELETE VIDEO DELETE -> /api/GurukulApi/hr/videos/8


.Response
{
    "message": "Video deleted"
}








ui requirement


proer collapse and minimize layout

gurkul admin panel :

show the details in poper way , and one add new video button to crete a new video 




first main --> titleGroup
just below that show all categories under that 

category


, in the category show the list of videos present on that particular category with a delete button to delete the particular video 

in particular shows the detaild like , video1 - detsils -title , descriptiuon , and view option to view the video same for the other video under this category 


folow the hirachy of 

titleGroup
category

and vidos under the each category 

the titleGroup and 
category are present  






==========================================

Here is your **highly structured, professional, and complete master prompt** that clearly explains APIs, backend responses, UI hierarchy, architecture expectations, and technical requirements for deep analysis and implementation.

You can directly use this prompt with ChatGPT or any advanced coding AI.

---

# 🚀 MASTER IMPLEMENTATION PROMPT – Gurukul Admin Module (React Native + Expo)

I have shared the following files for reference:

* `gurukul-create.html` (Web implementation reference)
* `GurukulAdminScreen.js`
* `theme.js`
* `api.js`

Your task is to:

> Deeply analyze and understand all shared files (UI structure, API handling, theme usage, backend integration patterns, folder structure, and reusable logic).
> Then provide the **entire corrected and production-ready code** for:
>
> * `GurukulAdminScreen.js`
> * A **reusable Video Player component** inside `/components` folder
>

---

use best libraries after research and guide to install it 

### ✅ Video Player Requirements

Create a **reusable video player component** using the best available Expo-supported libraries.

You must:

* Deeply research and select the best stable video solution in Expo ecosystem
* Support:

  * Fullscreen mode
  * Play/Pause , speed 
  same like youtube video (all functionlities)
  * Loading indicator
  * Auto aspect ratio handling
  * External link support
  * Proper buffering handling
  * Clean UI controls

The component must:

* Accept `videoUrl`
* Support both:

  * Local server videos
  * External URLs
* Be reusable across screens

---

# 📡 COMPLETE API DOCUMENTATION (Backend Integration Requirements)

You must strictly follow the backend contract below.

---

# 1️⃣ CREATE VIDEO

### Endpoint

```
POST http://192.168.1.75:5000/api/GurukulApi/hr/videos
```

### Request Type

`multipart/form-data`

### Body Fields (Form Data)

| Field             | Type   | Required        | Description               |
| ----------------- | ------ | --------------- | ------------------------- |
| TitleGroup        | string | ✅               | Main grouping title       |
| Category          | string | ✅               | Category under titleGroup |
| Title             | string | ✅               | Video title               |
| Description       | string | ✅               | Video description         |
| VideoFile         | file   |  required      | Video file upload         |
| ExternalLink      | string | ❌               | External video URL        |
| AllowedDepartment | string | ❌               | Department name           |
| AllowedEmployeeId | number | ❌               | Specific employee ID      |

> Note: Either VideoFile OR ExternalLink must be provided.

---

### Success Response

```json
{
  "message": "Video created successfully",
  "videoPath": "/Uploads/gurukul/6255da83-9e06-410c-b4d5-ac21fba18c92.mp4"
}
```

---

# 2️⃣ GET ALL DEPARTMENTS

### Endpoint

```
GET /api/employees/departments
```

### Response

```json
[
  "ACCOUNTANT",
  "AREA MANAGER",
  "BDM",
  "DIRECTOR",
  "DRIVER",
  "Finance",
  "HELPER",
  "HR",
  "INSURANCE",
  "INVESTMENT",
  "IT",
  "LOAN",
  "OFFICE BOY",
  "SALES",
  "WEALTH ADVISOR"
]
```

### UI Requirement

* Use a **best modern selector**
* Dropdown / modal picker
* Clean UX

---

# 3️⃣ GET ACTIVE EMPLOYEES

### Endpoint

```
GET http://192.168.1.75:5000/api/employees/active
```

### Response

```json
[
  {
    "id": 112,
    "name": "AARYAN SONAR",
    "employeeCode": "IA00093",
    "displayName": "AARYAN SONAR (IA00093)"
  }
]
```

### UI Requirement

* When selecting specific employee:

  * Show `displayName`
  * Send `id` in form-data as `AllowedEmployeeId`

---

# 4️⃣ GET ALL VIDEOS

### Endpoint

```
GET http://192.168.1.75:5000/api/GurukulApi/hr/videos
```

### Response Structure

```json
[
  {
    "id": 36,
    "titleGroup": "AI",
    "category": "Introduction TO AI",
    "title": "machine learning part 1",
    "description": "test description",
    "videoPath": "/Uploads/gurukul/6255da83.mp4",
    "isExternal": false,
    "thumbnailPath": null,
    "uploadedOn": "2026-02-24T10:20:11.968696",
    "allowedDepartment": "IT",
    "allowedEmployeeId": null,
    "allowedEmployee": null
  }
]
```

---

# 5️⃣ VIEW VIDEO

If `isExternal == false`

```
http://192.168.1.75:5000 + videoPath
```

Example:

```
http://192.168.1.75:5000/Uploads/gurukul/1d98b352.mp4
```

If `isExternal == true`

Use `ExternalLink` directly in player.

---

# 6️⃣ DELETE VIDEO

### Endpoint

```
DELETE /api/GurukulApi/hr/videos/{id}
```

### Example

```
DELETE /api/GurukulApi/hr/videos/8
```

### Response

```json
{
  "message": "Video deleted"
}
```

---

# 🧩 UI REQUIREMENTS – GURUKUL ADMIN PANEL

## 🎯 Layout Requirements

* Proper collapsible / expandable structure
* Clean professional admin design
* Modern UI
* Use theme.js properly

---

# 📂 REQUIRED HIERARCHY

You MUST follow this exact hierarchy:

```
TitleGroup
   └── Category
           └── Video List
```

---

## 📌 UI Behavior

### 1️⃣ Main Screen

* Show list grouped by `titleGroup`
* Each `titleGroup` collapsible

Inside each titleGroup:

* Show categories under it
* Each category collapsible

Inside each category:

* Show list of videos
* Each video card should show:

  * Title
  * Description
  * Allowed Department (if any)
  * Uploaded Date
  * View Button
  * Delete Button (HR only)

---

### 2️⃣ Add New Video Button

At top:

➕ Add New Video

On press:

* Open form modal or separate screen
* Include:

  * TitleGroup input
  * Category input
  * Title
  * Description
  * Department selector
  * Specific employee selector
  * Upload video option
  * OR external link input

---

# 🎨 UI Expectations

* Use proper spacing
* Modern cards
* Loading indicators
* Pull to refresh
* Proper empty state
* Error state handling
* Confirm dialog before delete

---

# 🧠 Architecture Rules

* Do NOT break api.js structure
* Use existing API utility methods
* Maintain current theme structure
* Create reusable VideoPlayer component in:

```
/components/VideoPlayer.js
```

---

# 📦 What You Must Deliver

1. Full corrected `GurukulAdminScreen.js`
2. New reusable `VideoPlayer.js`
3. All necessary helper logic
4. Proper API integration
5. Clean production-ready code
6. Proper comments

* Ensure video works on Android & iOS.
* Ensure file upload works properly with FormData.








