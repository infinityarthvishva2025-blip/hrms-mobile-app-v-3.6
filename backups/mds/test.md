deeply analyze and understand shrd  file




MarkAttendanceScreen.js


AuthContext.js
AttendanceContext.js
AttendanceActionButton.js
locationUtils.js

 EmployeePanel.html (it is main file of main frontend web projecy , we want eactly same functionluity while keeping our exiting functioinlity fully working
 
 )

deeply analyze and understand this files and give me the entire correted code , files that needed changes , do not give me the code in partial parts 

give me entire corrected code 



now the issue is 

1) it is taking time for geo check in and geo checkout

2) conduct a deep reseach , how we can implement exactly same functionlity as in the web project 

3) make sure when user closes or open the app , make the timer works properly , not resets 

4) now the main issue is that when i check in from the web , in mobile app , it is not starting the timer , and it is at initail  state that is chekc in

5) make it best in class , make it fast and best in class




1) 
http://192.168.1.75:5000/api/attendance/today


backend response :



{
    "record": {
        "id": null,
        "emp_Code": "IA00101",
        "date": "2026-02-23T00:00:00",
        "status": "A",
        "inTime": "11:57:53.2140699",
        "outTime": null,
        "total_Hours": 0.00,
        "isLate": false,
        "lateMinutes": 0,
        "att_Date": "2026-02-23T00:00:00",
        "correctionRequested": false,
        "correctionProofPath": null,
        "correctionRemark": null,
        "correctionStatus": "None",
        "correctionRequestedOn": null,
        "reviewedBy": null,
        "reviewedOn": null,
        "isGeoAttendance": true,
        "checkInLatitude": null,
        "checkInLongitude": null,
        "checkOutLatitude": null,
        "checkOutLongitude": null,
        "isCompOffCredited": false
    }
}

2) geo check in


{
    "success": true
}

3) geo check out


{
    "success": true
}



