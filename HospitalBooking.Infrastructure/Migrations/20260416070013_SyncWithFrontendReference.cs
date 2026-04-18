using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HospitalBooking.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class SyncWithFrontendReference : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "BookingMode",
                table: "Doctors",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "DefaultSlotDurationMinutes",
                table: "Doctors",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "MaxTokensPerDay",
                table: "Doctors",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "DoctorAvailabilitySlots",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DoctorId = table.Column<int>(type: "int", nullable: false),
                    Date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    TimeSlot = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsBooked = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DoctorAvailabilitySlots", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DoctorAvailabilitySlots_Doctors_DoctorId",
                        column: x => x.DoctorId,
                        principalTable: "Doctors",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_DoctorAvailabilitySlots_DoctorId",
                table: "DoctorAvailabilitySlots",
                column: "DoctorId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DoctorAvailabilitySlots");

            migrationBuilder.DropColumn(
                name: "BookingMode",
                table: "Doctors");

            migrationBuilder.DropColumn(
                name: "DefaultSlotDurationMinutes",
                table: "Doctors");

            migrationBuilder.DropColumn(
                name: "MaxTokensPerDay",
                table: "Doctors");
        }
    }
}
