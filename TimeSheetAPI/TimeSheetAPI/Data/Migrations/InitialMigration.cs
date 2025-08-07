using Microsoft.EntityFrameworkCore.Migrations;
using System;

namespace TimeSheetAPI.Data.Migrations
{
    public partial class InitialMigration : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Users table
            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<Guid>(nullable: false),
                    Email = table.Column<string>(maxLength: 100, nullable: false),
                    PasswordHash = table.Column<string>(nullable: false),
                    FirstName = table.Column<string>(maxLength: 50, nullable: false),
                    LastName = table.Column<string>(maxLength: 50, nullable: false),
                    Role = table.Column<string>(maxLength: 20, nullable: false),
                    JobTitle = table.Column<string>(maxLength: 100, nullable: true),
                    BillableRate = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    AvailableHours = table.Column<int>(nullable: false),
                    CreatedAt = table.Column<DateTime>(nullable: false),
                    UpdatedAt = table.Column<DateTime>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            // Departments table
            migrationBuilder.CreateTable(
                name: "Departments",
                columns: table => new
                {
                    Id = table.Column<Guid>(nullable: false),
                    Name = table.Column<string>(maxLength: 100, nullable: false),
                    Description = table.Column<string>(maxLength: 500, nullable: true),
                    ManagerId = table.Column<Guid>(nullable: true),
                    CreatedAt = table.Column<DateTime>(nullable: false),
                    UpdatedAt = table.Column<DateTime>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Departments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Departments_Users_ManagerId",
                        column: x => x.ManagerId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            // Projects table
            migrationBuilder.CreateTable(
                name: "Projects",
                columns: table => new
                {
                    Id = table.Column<Guid>(nullable: false),
                    Name = table.Column<string>(maxLength: 100, nullable: false),
                    Description = table.Column<string>(maxLength: 500, nullable: true),
                    ClientName = table.Column<string>(maxLength: 100, nullable: true),
                    StartDate = table.Column<DateTime>(nullable: false),
                    EndDate = table.Column<DateTime>(nullable: true),
                    Status = table.Column<string>(maxLength: 20, nullable: false),
                    BudgetHours = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    BillableHours = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    ActualHours = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    BillingRate = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    IsActive = table.Column<bool>(nullable: false),
                    CreatedAt = table.Column<DateTime>(nullable: false),
                    UpdatedAt = table.Column<DateTime>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Projects", x => x.Id);
                });

            // Teams table
            migrationBuilder.CreateTable(
                name: "Teams",
                columns: table => new
                {
                    Id = table.Column<Guid>(nullable: false),
                    Name = table.Column<string>(maxLength: 100, nullable: false),
                    Description = table.Column<string>(maxLength: 500, nullable: true),
                    DepartmentId = table.Column<Guid>(nullable: false),
                    LeaderId = table.Column<Guid>(nullable: true),
                    CreatedAt = table.Column<DateTime>(nullable: false),
                    UpdatedAt = table.Column<DateTime>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Teams", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Teams_Departments_DepartmentId",
                        column: x => x.DepartmentId,
                        principalTable: "Departments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Teams_Users_LeaderId",
                        column: x => x.LeaderId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            // Notifications table
            migrationBuilder.CreateTable(
                name: "Notifications",
                columns: table => new
                {
                    Id = table.Column<Guid>(nullable: false),
                    UserId = table.Column<Guid>(nullable: false),
                    Title = table.Column<string>(maxLength: 100, nullable: false),
                    Message = table.Column<string>(maxLength: 500, nullable: false),
                    Type = table.Column<string>(maxLength: 20, nullable: false),
                    IsRead = table.Column<bool>(nullable: false),
                    RelatedEntityId = table.Column<Guid>(nullable: true),
                    CreatedAt = table.Column<DateTime>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Notifications", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Notifications_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            // ProjectLevels table
            migrationBuilder.CreateTable(
                name: "ProjectLevels",
                columns: table => new
                {
                    Id = table.Column<Guid>(nullable: false),
                    ProjectId = table.Column<Guid>(nullable: false),
                    Name = table.Column<string>(maxLength: 100, nullable: false),
                    Description = table.Column<string>(maxLength: 500, nullable: true),
                    IsActive = table.Column<bool>(nullable: false),
                    CreatedAt = table.Column<DateTime>(nullable: false),
                    UpdatedAt = table.Column<DateTime>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProjectLevels", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProjectLevels_Projects_ProjectId",
                        column: x => x.ProjectId,
                        principalTable: "Projects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            // TeamMembers table (many-to-many relationship between Teams and Users)
            migrationBuilder.CreateTable(
                name: "TeamMembers",
                columns: table => new
                {
                    TeamId = table.Column<Guid>(nullable: false),
                    UserId = table.Column<Guid>(nullable: false),
                    JoinedAt = table.Column<DateTime>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TeamMembers", x => new { x.TeamId, x.UserId });
                    table.ForeignKey(
                        name: "FK_TeamMembers_Teams_TeamId",
                        column: x => x.TeamId,
                        principalTable: "Teams",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TeamMembers_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            // TeamProjects table (many-to-many relationship between Teams and Projects)
            migrationBuilder.CreateTable(
                name: "TeamProjects",
                columns: table => new
                {
                    TeamId = table.Column<Guid>(nullable: false),
                    ProjectId = table.Column<Guid>(nullable: false),
                    AssignedAt = table.Column<DateTime>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TeamProjects", x => new { x.TeamId, x.ProjectId });
                    table.ForeignKey(
                        name: "FK_TeamProjects_Projects_ProjectId",
                        column: x => x.ProjectId,
                        principalTable: "Projects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TeamProjects_Teams_TeamId",
                        column: x => x.TeamId,
                        principalTable: "Teams",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            // ProjectTasks table
            migrationBuilder.CreateTable(
                name: "ProjectTasks",
                columns: table => new
                {
                    Id = table.Column<Guid>(nullable: false),
                    ProjectLevelId = table.Column<Guid>(nullable: false),
                    Name = table.Column<string>(maxLength: 100, nullable: false),
                    Description = table.Column<string>(maxLength: 500, nullable: true),
                    IsActive = table.Column<bool>(nullable: false),
                    CreatedAt = table.Column<DateTime>(nullable: false),
                    UpdatedAt = table.Column<DateTime>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProjectTasks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProjectTasks_ProjectLevels_ProjectLevelId",
                        column: x => x.ProjectLevelId,
                        principalTable: "ProjectLevels",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            // ProjectSubtasks table
            migrationBuilder.CreateTable(
                name: "ProjectSubtasks",
                columns: table => new
                {
                    Id = table.Column<Guid>(nullable: false),
                    ProjectTaskId = table.Column<Guid>(nullable: false),
                    Name = table.Column<string>(maxLength: 100, nullable: false),
                    Description = table.Column<string>(maxLength: 500, nullable: true),
                    IsActive = table.Column<bool>(nullable: false),
                    CreatedAt = table.Column<DateTime>(nullable: false),
                    UpdatedAt = table.Column<DateTime>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProjectSubtasks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProjectSubtasks_ProjectTasks_ProjectTaskId",
                        column: x => x.ProjectTaskId,
                        principalTable: "ProjectTasks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            // TimeEntries table
            migrationBuilder.CreateTable(
                name: "TimeEntries",
                columns: table => new
                {
                    Id = table.Column<Guid>(nullable: false),
                    UserId = table.Column<Guid>(nullable: false),
                    ProjectId = table.Column<Guid>(nullable: false),
                    Date = table.Column<DateTime>(nullable: false),
                    ClockIn = table.Column<DateTime>(nullable: true),
                    ClockOut = table.Column<DateTime>(nullable: true),
                    BreakTime = table.Column<int>(nullable: false),
                    ActualHours = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    BillableHours = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    TotalHours = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    AvailableHours = table.Column<int>(nullable: false),
                    Task = table.Column<string>(maxLength: 200, nullable: true),
                    Status = table.Column<string>(maxLength: 20, nullable: false),
                    IsBillable = table.Column<bool>(nullable: false),
                    CreatedAt = table.Column<DateTime>(nullable: false),
                    UpdatedAt = table.Column<DateTime>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TimeEntries", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TimeEntries_Projects_ProjectId",
                        column: x => x.ProjectId,
                        principalTable: "Projects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TimeEntries_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            // ApprovalActions table
            migrationBuilder.CreateTable(
                name: "ApprovalActions",
                columns: table => new
                {
                    Id = table.Column<Guid>(nullable: false),
                    TimeEntryId = table.Column<Guid>(nullable: false),
                    RequestedById = table.Column<Guid>(nullable: false),
                    ApprovedById = table.Column<Guid>(nullable: true),
                    Status = table.Column<string>(maxLength: 20, nullable: false),
                    RequestComments = table.Column<string>(maxLength: 500, nullable: true),
                    ApprovalComments = table.Column<string>(maxLength: 500, nullable: true),
                    RequestedAt = table.Column<DateTime>(nullable: false),
                    ActionAt = table.Column<DateTime>(nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ApprovalActions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ApprovalActions_Users_ApprovedById",
                        column: x => x.ApprovedById,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ApprovalActions_Users_RequestedById",
                        column: x => x.RequestedById,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ApprovalActions_TimeEntries_TimeEntryId",
                        column: x => x.TimeEntryId,
                        principalTable: "TimeEntries",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            // Create indexes
            migrationBuilder.CreateIndex(
                name: "IX_ApprovalActions_ApprovedById",
                table: "ApprovalActions",
                column: "ApprovedById");

            migrationBuilder.CreateIndex(
                name: "IX_ApprovalActions_RequestedById",
                table: "ApprovalActions",
                column: "RequestedById");

            migrationBuilder.CreateIndex(
                name: "IX_ApprovalActions_TimeEntryId",
                table: "ApprovalActions",
                column: "TimeEntryId");

            migrationBuilder.CreateIndex(
                name: "IX_Departments_ManagerId",
                table: "Departments",
                column: "ManagerId");

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_UserId",
                table: "Notifications",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_ProjectLevels_ProjectId",
                table: "ProjectLevels",
                column: "ProjectId");

            migrationBuilder.CreateIndex(
                name: "IX_ProjectSubtasks_ProjectTaskId",
                table: "ProjectSubtasks",
                column: "ProjectTaskId");

            migrationBuilder.CreateIndex(
                name: "IX_ProjectTasks_ProjectLevelId",
                table: "ProjectTasks",
                column: "ProjectLevelId");

            migrationBuilder.CreateIndex(
                name: "IX_TeamMembers_UserId",
                table: "TeamMembers",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_TeamProjects_ProjectId",
                table: "TeamProjects",
                column: "ProjectId");

            migrationBuilder.CreateIndex(
                name: "IX_Teams_DepartmentId",
                table: "Teams",
                column: "DepartmentId");

            migrationBuilder.CreateIndex(
                name: "IX_Teams_LeaderId",
                table: "Teams",
                column: "LeaderId");

            migrationBuilder.CreateIndex(
                name: "IX_TimeEntries_ProjectId",
                table: "TimeEntries",
                column: "ProjectId");

            migrationBuilder.CreateIndex(
                name: "IX_TimeEntries_UserId",
                table: "TimeEntries",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Users_Email",
                table: "Users",
                column: "Email",
                unique: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ApprovalActions");

            migrationBuilder.DropTable(
                name: "Notifications");

            migrationBuilder.DropTable(
                name: "ProjectSubtasks");

            migrationBuilder.DropTable(
                name: "TeamMembers");

            migrationBuilder.DropTable(
                name: "TeamProjects");

            migrationBuilder.DropTable(
                name: "TimeEntries");

            migrationBuilder.DropTable(
                name: "ProjectTasks");

            migrationBuilder.DropTable(
                name: "Teams");

            migrationBuilder.DropTable(
                name: "Projects");

            migrationBuilder.DropTable(
                name: "ProjectLevels");

            migrationBuilder.DropTable(
                name: "Departments");

            migrationBuilder.DropTable(
                name: "Users");
        }
    }
}