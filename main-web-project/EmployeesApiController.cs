using HRMS.Data;
using HRMS.Helpers;
using HRMS.Models;
using HRMS.ViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OfficeOpenXml;
using System.Security.Cryptography;
using System.Text;

namespace HRMS.Controllers.Api
{
    [ApiController]
    [Route("api/employees")]
    public class EmployeesApiController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private const string FILE_ROOT = @"C:\HRMSFiles";
        private readonly IWebHostEnvironment _env;

        public EmployeesApiController(ApplicationDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }
      

       
        // ======================================================
        // GET ALL EMPLOYEES
        // ======================================================
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            return Ok(await _context.Employees.ToListAsync());
        }

        // ======================================================
        // GET EMPLOYEE BY ID
        // ======================================================
        [HttpGet("{id}")]
        public async Task<IActionResult> Get(int id)
        {
            var emp = await _context.Employees.FindAsync(id);
            if (emp == null) return NotFound();
            return Ok(emp);
        }

        // ======================================================
        // CREATE EMPLOYEE
        // ======================================================
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Employee model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (string.IsNullOrEmpty(model.EmployeeCode))
                model.EmployeeCode = GenerateNextEmployeeCode();

            model.Status = "Active";

            _context.Employees.Add(model);
            await _context.SaveChangesAsync();

            return Ok(model);
        }

        // ======================================================
        // UPDATE EMPLOYEE
        // ======================================================
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] EmployeeEditVm model)
        {
            var emp = await _context.Employees.FindAsync(id);
            if (emp == null) return NotFound();

            emp.Name = model.Name;
            emp.Email = model.Email;
            emp.MobileNumber = model.MobileNumber;
            emp.Department = model.Department;
            emp.Position = model.Position;
            emp.Role = model.Role;
            emp.Salary = model.Salary;

            await _context.SaveChangesAsync();
            return Ok(emp);
        }

        // ======================================================
        // DELETE EMPLOYEE
        // ======================================================
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var emp = await _context.Employees.FindAsync(id);
            if (emp == null) return NotFound();

            _context.Employees.Remove(emp);
            await _context.SaveChangesAsync();

            return Ok(new { success = true });
        } 
        [Authorize]
        [HttpGet("dashboard/{empId}")]
        public async Task<IActionResult> Dashboard(int empId, int? month, int? year)
        {
            var employee = await _context.Employees.FirstOrDefaultAsync(e => e.Id == empId);
            if (employee == null) return NotFound();

            int selectedMonth = month ?? DateTime.Today.Month;
            int selectedYear = year ?? DateTime.Today.Year;

            DateTime monthStart = new DateTime(selectedYear, selectedMonth, 1);
            DateTime monthEnd = monthStart.AddMonths(1).AddDays(-1);

            int workingDays = Enumerable.Range(0, (monthEnd - monthStart).Days + 1)
                .Select(d => monthStart.AddDays(d))
                .Count(d => d.DayOfWeek != DayOfWeek.Sunday);


            int presentDays = await _context.Attendances.CountAsync(a =>
    a.Emp_Code == employee.EmployeeCode &&
    a.InTime.HasValue &&
    a.Date.Month == selectedMonth &&
    a.Date.Year == selectedYear
);
            int leaveDays = (await _context.Leaves
                .Where(l =>
                    l.EmployeeId == empId &&
                    l.OverallStatus == "Approved" )
                .Select(l => l.TotalDays ?? 0)
                .ToListAsync())
                .Sum(d => (int)Math.Ceiling(d));
            int totalLeaves = (await _context.Leaves
                .Where(l =>
                    l.EmployeeId == empId )
                .Select(l => l.TotalDays ?? 0)
                .ToListAsync())
                .Sum(d => (int)Math.Ceiling(d));

            int holidayDays = await _context.Holidays.CountAsync(h =>
                h.HolidayDate.Month == selectedMonth &&
                h.HolidayDate.Year == selectedYear
            );

            int absentDays = Math.Max(0, workingDays - (presentDays + leaveDays + holidayDays));

            return Ok(new
            {
                employee,
                workingDays,
                presentDays,
                leaveDays,
                totalLeaves,
                holidayDays,
                absentDays,
                month = selectedMonth,
                year = selectedYear
            });
        }


        //// ======================================================
        //// DASHBOARD DATA (JSON)
        //// ======================================================
        //[Authorize]
        //[HttpGet("dashboard/{empId}")]
        // public async Task<IActionResult> Dashboard(int empId, int? month, int? year)
        //{
        //    var employee = await _context.Employees.FirstOrDefaultAsync(e => e.Id == empId);
        //    if (employee == null) return NotFound();

        //    string empCode = employee.EmployeeCode;

        //    int selectedMonth = month ?? DateTime.Today.Month;
        //    int selectedYear = year ?? DateTime.Today.Year;

        //    DateTime monthStart = new DateTime(selectedYear, selectedMonth, 1);
        //    DateTime monthEnd = monthStart.AddMonths(1).AddDays(-1);

        //    int workingDays = Enumerable.Range(0, (monthEnd - monthStart).Days + 1)
        //        .Select(d => monthStart.AddDays(d))
        //        .Count(d => d.DayOfWeek != DayOfWeek.Sunday);

        //    int presentDays = await _context.Attendances
        //        .CountAsync(a => a.Emp_Code == empCode && a.InTime.HasValue);

        //    int leaveDays = (await _context.Leaves
        //        .Where(l => l.EmployeeId == empId && l.OverallStatus == "Approved")
        //        .Select(l => l.TotalDays ?? 0)
        //        .ToListAsync())
        //        .Sum(d => (int)Math.Ceiling(d));

        //    int holidayDays = await _context.Holidays.CountAsync();

        //    int absentDays = Math.Max(0, workingDays - (presentDays + leaveDays + holidayDays));

        //    return Ok(new
        //    {
        //        employee,
        //        workingDays,
        //        presentDays,
        //        leaveDays,
        //        holidayDays,
        //        absentDays,
        //        month = selectedMonth,
        //        year = selectedYear
        //    });
        //}

        //// ======================================================
        private string GenerateNextEmployeeCode()
        {
            var last = _context.Employees
                .OrderByDescending(e => e.EmployeeCode)
                .Select(e => e.EmployeeCode)
                .FirstOrDefault();

            if (last == null)
                return "IA00001";

            int num = int.Parse(last.Substring(2)) + 1;
            return $"IA{num:00000}";
        }
        [AllowAnonymous]   // ✅ ADD THIS
        [HttpGet("celebrations")]
        public async Task<IActionResult> Celebrations()
        {
            var today = DateTime.Today;
            var tomorrow = today.AddDays(1);

            var todaysBirthdays = await _context.Employees
                .Where(e => e.DOB_Date.HasValue &&
                            e.DOB_Date.Value.Month == today.Month &&
                            e.DOB_Date.Value.Day == today.Day)
                .Select(e => new { e.Name, e.Department })
                .ToListAsync();

            var tomorrowsBirthdays = await _context.Employees
                .Where(e => e.DOB_Date.HasValue &&
                            e.DOB_Date.Value.Month == tomorrow.Month &&
                            e.DOB_Date.Value.Day == tomorrow.Day)
                .Select(e => new { e.Name, e.Department })
                .ToListAsync();

            return Ok(new
            {
                todaysBirthdays,
                tomorrowsBirthdays
            });
        }


        [HttpGet("my-profile")]
        public async Task<IActionResult> MyProfile()
        
        {
            // 1️⃣ Check Employee Session
            var empId = HttpContext.Session.GetInt32("EmployeeId");

            if (empId == null || empId == 0)
            {
                return Unauthorized(new
                {
                    message = "User not logged in"
                });
            }

            // 2️⃣ Fetch employee details
            var employee = await _context.Employees
                .FirstOrDefaultAsync(e => e.Id == empId);

            if (employee == null)
            {
                return NotFound(new
                {
                    message = "Employee not found"
                });
            }

            // 3️⃣ Return employee data as JSON
            return Ok(employee);
        }






        [HttpGet("ViewDocument")]
        public IActionResult ViewDocument(string empCode, string fileName)
        {
            if (string.IsNullOrEmpty(empCode) || string.IsNullOrEmpty(fileName))
                return BadRequest("Invalid parameters");

            // 🔐 Prevent directory traversal
            fileName = Path.GetFileName(fileName);

            // ✅ Adjust base path if needed
            var basePath = Path.Combine(_env.WebRootPath, "Uploads", "Employees", empCode);
            var filePath = Path.Combine(basePath, fileName);

            if (!System.IO.File.Exists(filePath))
                return NotFound("File not found");

            var contentType = GetContentType(filePath);
            var fileStream = new FileStream(filePath, FileMode.Open, FileAccess.Read);

            return File(fileStream, contentType);
        }

        private static string GetContentType(string path)
        {
            var ext = Path.GetExtension(path).ToLower();
            return ext switch
            {
                ".pdf" => "application/pdf",
                ".jpg" or ".jpeg" => "image/jpeg",
                ".png" => "image/png",
                ".doc" => "application/msword",
                ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                _ => "application/octet-stream"
            };
        }

        // =====================================================
        // ✅ GET ALL DEPARTMENTS
        // GET: /api/employees/departments
        // =====================================================
        [HttpGet("departments")]
        public async Task<IActionResult> GetDepartments()
        {
            var departments = await _context.Employees
                .Where(e => !string.IsNullOrWhiteSpace(e.Department))
                .Select(e => e.Department.Trim())
                .Distinct()
                .OrderBy(d => d)
                .ToListAsync();

            return Ok(departments);
        }

        // =====================================================
        // ✅ GET POSITIONS BY DEPARTMENT
        // GET: /api/employees/positions?department=IT
        // =====================================================
        [HttpGet("positions")]
        public async Task<IActionResult> GetPositions([FromQuery] string department)
        {
            if (string.IsNullOrWhiteSpace(department))
                return Ok(new List<string>());

            var positions = await _context.Employees
                .Where(e =>
                    !string.IsNullOrWhiteSpace(e.Department) &&
                    !string.IsNullOrWhiteSpace(e.Position) &&
                    e.Department.ToLower() == department.ToLower())
                .Select(e => e.Position.Trim())
                .Distinct()
                .OrderBy(p => p)
                .ToListAsync();

            return Ok(positions);
        }

        [HttpGet("generate-code")]
        public IActionResult GenerateEmployeeCode()
        {
            return Ok(new
            {
                employeeCode = GenerateNextEmployeeCode()
            });
        }
    }

}
