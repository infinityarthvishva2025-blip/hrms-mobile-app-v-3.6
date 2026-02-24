please deeply analyze and understand shared files ;
give me entire corrected code for PayrollScreen.js





displya the data in proper format 






ui -->

date selector , one button Export Excel (All Employees) (

    for keep the functionlity for download excel on hold , we will implement it later
)




in table show all this details in proper way 

Emp Code	Name	Working Days	Half Days	Absent Days	 Paid Days	  Basic Salary  	Gross Salary 	Deduction	 Net Salary 	Payslip





eg :
api: http://192.168.1.75:5000/api/payroll/generate-range
in body we have to send :
{
  "fromDate": "2025-12-21",
  "toDate": "2026-01-20"
}

backend response : 




{
    "fromDate": "2025-12-21T00:00:00",
    "toDate": "2026-01-20T00:00:00",
    "payrolls": [
        {
            "empCode": "IA00001",
            "empName": "RAHUL ASHOK KANGANE",
            "year": 2025,
            "month": 12,
            "totalDaysInMonth": 31,
            "absentDays": 17,
            "lateMarks": 0,
            "lateDeductionDays": 0,
            "paidDays": 3.0,
            "totalSaturdayPaid": 0,
            "otherDeductions": 0,
            "monthlySalary": 200000.00,
            "perDaySalary": 6451.6129032258064516129032258,
            "grossSalary": 19354.838709677419354838709677,
            "performanceAllowance": 0,
            "otherAllowances": 0,
            "petrolAllowance": 0,
            "reimbursement": 0,
            "professionalTax": 200,
            "totalDeductions": 200,
            "netSalary": 19154.838709677419354838709677,
            "totalPay": 19154.838709677419354838709677,
            "base_salary": 0,
            "presentHalfDays": 0,
            "weeklyOffDays": 3,
            "bankName": null,
            "accountNumber": null,
            "ifscCode": null,
            "bankBranch": null,
            "department": "DIRECTOR",
            "designation": "Director",
            "fromDate": "2025-12-21T00:00:00",
            "toDate": "2026-01-20T00:00:00",
            "logoBase64": null,
            "signatureBase64": null
        },
        {}
    ]




in payslip , show slip 

when clicked on it 
call this api , http://192.168.1.75:5000/api/payroll/download-range?empCode=IA00022&fromDate=2025-12-21&toDate=2026-01-20

and use exactly same functionlity:
mentioned below:

  const downloadPayslip = async () => {
    if (!validateDates()) return;
    if (!user || (!user.employeeCode && !user.emp_code)) {
      Alert.alert('Error', 'User information is missing');
      return;
    }

    setDownloading(true);
    setError('');

    try {
      const empCode = get payraol data , empCode 
      and the date is already selected 
      const baseURL = api.defaults.baseURL.replace('/api', '');
      const url = `${baseURL}/api/payroll/download-range?empCode=${empCode}&fromDate=${fromDate}&toDate=${toDate}`;

      console.log(`Opening download link: ${url}`);
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', `Could not open the download link`);
      }
    } catch (err) {
      const errorMessage = err.message || "Failed to initiate download";
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setDownloading(false);
    }
  };




