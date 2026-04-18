using System;
using System.Collections.Generic;

namespace HospitalBooking.Application.DTOs
{
    public class MedicineItem
    {
        public string Name { get; set; } = string.Empty;
        public string Dosage { get; set; } = string.Empty;
        public string Duration { get; set; } = string.Empty;
        public string Instructions { get; set; } = string.Empty;
    }

    public class PrescriptionResponseDto
    {
        public int Id { get; set; }
        public string Diagnosis { get; set; } = string.Empty;
        public List<MedicineItem> Medicines { get; set; } = new();
        public string TestsAdvised { get; set; } = string.Empty;
        public DateTime? FollowUpDate { get; set; }
        public string Notes { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public string DoctorName { get; set; } = string.Empty;
        public string DepartmentName { get; set; } = string.Empty;
    }
}
