using HospitalBooking.Domain.Entities;
using HospitalBooking.Application.DTOs;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using System.Text.Json;

namespace HospitalBooking.Infrastructure.Services
{
    public interface IPrescriptionPdfService
    {
        byte[] GeneratePrescription(Prescription presc, Doctor doctor, Patient patient);
    }

    public class PrescriptionPdfService : IPrescriptionPdfService
    {
        public byte[] GeneratePrescription(Prescription presc, Doctor doctor, Patient patient)
        {
            var medicines = JsonSerializer.Deserialize<List<MedicineItem>>(presc.MedicinesJson ?? "[]");

            var document = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(2, Unit.Centimetre);
                    page.PageColor(Colors.White);
                    page.DefaultTextStyle(x => x.FontSize(10).FontFamily(Fonts.Verdana));

                    page.Header().Row(row =>
                    {
                        row.RelativeItem().Column(col =>
                        {
                            col.Item().Text(doctor.Name).FontSize(20).SemiBold().FontColor(Colors.Blue.Medium);
                            col.Item().Text($"{doctor.Designation} - {doctor.Department?.Name ?? "" }").FontSize(12).FontColor(Colors.Grey.Medium);
                            col.Item().Text("Hospital Booking System").FontSize(10);
                        });

                        row.ConstantItem(100).AlignRight().Column(col =>
                        {
                            col.Item().Text($"Date: {presc.CreatedAt:MMM dd, yyyy}");
                            col.Item().Text($"Token: #{presc.AppointmentId}");
                        });
                    });

                    page.Content().PaddingVertical(20).Column(col =>
                    {
                        // Patient Info
                        col.Item().BorderBottom(1).BorderColor(Colors.Grey.Lighten3).PaddingBottom(5).Row(row =>
                        {
                            row.RelativeItem().Text(x => {
                                x.Span("Patient: ").SemiBold();
                                x.Span(patient.FullName);
                            });
                            row.RelativeItem().AlignRight().Text(x => {
                                x.Span("Email: ").SemiBold();
                                x.Span(patient.Email);
                            });
                        });

                        col.Item().PaddingTop(20).Column(innerCol =>
                        {
                            innerCol.Item().Text("DIAGNOSIS").FontSize(12).SemiBold().FontColor(Colors.Blue.Medium);
                            innerCol.Item().PaddingVertical(5).Text(presc.Diagnosis);
                        });

                        col.Item().PaddingTop(20).Column(innerCol =>
                        {
                            innerCol.Item().Text("PRESCRIPTION (Rx)").FontSize(12).SemiBold().FontColor(Colors.Blue.Medium);
                            innerCol.Item().PaddingTop(10).Table(table =>
                            {
                                table.ColumnsDefinition(columns =>
                                {
                                    columns.RelativeColumn(3);
                                    columns.RelativeColumn(1);
                                    columns.RelativeColumn(1);
                                    columns.RelativeColumn(2);
                                });

                                table.Header(header =>
                                {
                                    header.Cell().Element(HeaderStyle).Text("Medicine");
                                    header.Cell().Element(HeaderStyle).Text("Dosage");
                                    header.Cell().Element(HeaderStyle).Text("Duration");
                                    header.Cell().Element(HeaderStyle).Text("Instructions");

                                    static IContainer HeaderStyle(IContainer container) => container.DefaultTextStyle(x => x.SemiBold()).PaddingVertical(5).BorderBottom(1).BorderColor(Colors.Black);
                                });

                                foreach (var med in medicines!)
                                {
                                    table.Cell().Element(CellStyle).Text(med.Name);
                                    table.Cell().Element(CellStyle).Text(med.Dosage);
                                    table.Cell().Element(CellStyle).Text(med.Duration);
                                    table.Cell().Element(CellStyle).Text(med.Instructions);

                                    static IContainer CellStyle(IContainer container) => container.PaddingVertical(5).BorderBottom(1).BorderColor(Colors.Grey.Lighten4);
                                }
                            });
                        });

                        if (!string.IsNullOrEmpty(presc.TestsAdvised))
                        {
                            col.Item().PaddingTop(20).Column(innerCol =>
                            {
                                innerCol.Item().Text("TESTS ADVISED").FontSize(10).SemiBold();
                                innerCol.Item().Text(presc.TestsAdvised);
                            });
                        }

                        if (presc.FollowUpDate.HasValue)
                        {
                            col.Item().PaddingTop(20).Text(x => {
                                x.Span("Follow-up Date: ").SemiBold();
                                x.Span(presc.FollowUpDate.Value.ToString("MMM dd, yyyy"));
                            });
                        }
                    });

                    page.Footer().AlignCenter().Text(x =>
                    {
                        x.Span("Page ");
                        x.CurrentPageNumber();
                    });
                });
            });

            return document.GeneratePdf();
        }

    }
}
