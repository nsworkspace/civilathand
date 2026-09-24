/**
 * PDF export helpers for Admin Panel
 * Uses jsPDF + jspdf-autotable (already in package.json)
 */

export interface MentorshipApp {
  id: string;
  name: string;
  email: string;
  phone?: string;
  academicLevel?: string;
  fieldOfStudy?: string;
  mentorName?: string;
  mentorshipAreas?: string[];
  proficiency?: number;
  goals?: string;
  timeZoneComfort?: string;
  availability?: Record<string, string[]>;
  status?: string;
  notes?: string;
  createdAt: string;
}

export interface CareerApp {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  experience?: string;
  qualification?: string;
  note?: string;
  resumeUrl?: string;
  resumeName?: string;
  status?: string;
  createdAt: string;
}

function getBrandColors() {
  return {
    orange: [234, 88, 12] as [number, number, number],
    dark: [15, 23, 42] as [number, number, number],
    white: [255, 255, 255] as [number, number, number],
    lightGray: [248, 250, 252] as [number, number, number],
    medGray: [100, 116, 139] as [number, number, number],
    black: [15, 23, 42] as [number, number, number],
  };
}

function addPageHeader(
  doc: any,
  title: string,
  subtitle: string,
  pageWidth: number
) {
  const colors = getBrandColors();
  // Top orange bar
  doc.setFillColor(...colors.orange);
  doc.rect(0, 0, pageWidth, 12, "F");

  // Dark header bg
  doc.setFillColor(...colors.dark);
  doc.rect(0, 12, pageWidth, 34, "F");

  // Company name
  doc.setFontSize(9);
  doc.setTextColor(...colors.orange);
  doc.setFont("helvetica", "bold");
  doc.text("CIVIL AT HAND", 15, 22);

  // Title
  doc.setFontSize(16);
  doc.setTextColor(...colors.white);
  doc.text(title, 15, 34);

  // Subtitle / date
  doc.setFontSize(8);
  doc.setTextColor(colors.medGray[0], colors.medGray[1], colors.medGray[2]);
  doc.setFont("helvetica", "normal");
  doc.text(subtitle, 15, 43);

  // Generated date on right
  const dateStr = `Generated: ${new Date().toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric",
  })}`;
  const dateWidth = doc.getTextWidth(dateStr);
  doc.text(dateStr, pageWidth - dateWidth - 15, 43);

  return 58; // y after header
}

function addPageFooter(doc: any, pageWidth: number, pageHeight: number, pageNum: number, totalPages: number) {
  const colors = getBrandColors();
  doc.setFillColor(...colors.dark);
  doc.rect(0, pageHeight - 14, pageWidth, 14, "F");
  doc.setFontSize(7);
  doc.setTextColor(...colors.orange);
  doc.setFont("helvetica", "bold");
  doc.text("CIVIL AT HAND — CONFIDENTIAL", 15, pageHeight - 5);
  doc.setTextColor(150, 163, 175);
  doc.setFont("helvetica", "normal");
  doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - 15, pageHeight - 5, { align: "right" });
}

/**
 * Download a single mentorship applicant as a well-formatted PDF
 */
export async function downloadMentorshipApplicantPDF(app: MentorshipApp): Promise<void> {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const colors = getBrandColors();

  const submittedDate = new Date(app.createdAt).toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric",
  });

  let y = addPageHeader(doc, "Mentorship Application", `Applicant: ${app.name} · Submitted: ${submittedDate}`, pageWidth);

  // Status badge
  const statusColor: [number, number, number] =
    app.status === "Approved" || app.status === "Enrolled" ? [16, 185, 129] :
    app.status === "Contacted" ? [59, 130, 246] :
    app.status === "Rejected" ? [239, 68, 68] :
    [245, 158, 11];
  doc.setFillColor(...statusColor);
  doc.roundedRect(15, y, 40, 8, 2, 2, "F");
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text((app.status || "PENDING").toUpperCase(), 35, y + 5.5, { align: "center" });

  // Application ID
  doc.setFontSize(7);
  doc.setTextColor(...colors.medGray);
  doc.setFont("helvetica", "normal");
  doc.text(`Application ID: ${app.id}`, pageWidth - 15, y + 5.5, { align: "right" });

  y += 16;

  // ── Section 1: Contact Info ──────────────────────────
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colors.orange);
  doc.text("CONTACT INFORMATION", 15, y);
  y += 4;
  doc.setFillColor(234, 88, 12, 0.15);
  doc.setDrawColor(...colors.orange);
  doc.setLineWidth(0.3);
  doc.line(15, y, pageWidth - 15, y);
  y += 5;

  autoTable(doc, {
    startY: y,
    margin: { left: 15, right: 15 },
    theme: "plain",
    styles: { fontSize: 9, cellPadding: 2.5, lineColor: [226, 232, 240], lineWidth: 0.2 },
    headStyles: { fillColor: colors.dark, textColor: colors.white, fontStyle: "bold", fontSize: 7.5 },
    alternateRowStyles: { fillColor: colors.lightGray },
    body: [
      ["Full Name", app.name],
      ["Email Address", app.email],
      ["Phone / WhatsApp", app.phone || "—"],
    ],
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 55, textColor: colors.medGray, fontSize: 8 }, 1: { fontStyle: "normal", textColor: colors.black } },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // ── Section 2: Exam & Prep ───────────────────────────
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colors.orange);
  doc.text("EXAM & PREPARATION DETAILS", 15, y);
  y += 4;
  doc.setLineWidth(0.3);
  doc.line(15, y, pageWidth - 15, y);
  y += 5;

  autoTable(doc, {
    startY: y,
    margin: { left: 15, right: 15 },
    theme: "plain",
    styles: { fontSize: 9, cellPadding: 2.5, lineColor: [226, 232, 240], lineWidth: 0.2 },
    alternateRowStyles: { fillColor: colors.lightGray },
    body: [
      ["Target Exam", app.fieldOfStudy || "—"],
      ["Preparation Level / Academic Level", app.academicLevel || "—"],
      ["Proficiency Rating", app.proficiency ? `${app.proficiency} / 5` : "—"],
      ["Timezone Comfort", app.timeZoneComfort || "—"],
    ],
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 75, textColor: colors.medGray, fontSize: 8 }, 1: { fontStyle: "normal", textColor: colors.black } },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // ── Section 3: Areas / Subjects ──────────────────────
  if (app.mentorshipAreas && app.mentorshipAreas.length > 0) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...colors.orange);
    doc.text("AREAS SEEKING HELP / STRUGGLING TOPICS", 15, y);
    y += 4;
    doc.line(15, y, pageWidth - 15, y);
    y += 6;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...colors.black);

    const areasPerRow = 2;
    const colWidth = (pageWidth - 30) / areasPerRow;
    app.mentorshipAreas.forEach((area, idx) => {
      const col = idx % areasPerRow;
      const row = Math.floor(idx / areasPerRow);
      const x = 15 + col * colWidth;
      const areaY = y + row * 7;

      doc.setFillColor(...colors.orange);
      doc.circle(x + 2, areaY - 1.5, 1.5, "F");
      doc.setTextColor(...colors.black);
      doc.text(area, x + 6, areaY);
    });

    y += Math.ceil(app.mentorshipAreas.length / areasPerRow) * 7 + 6;
  }

  // ── Section 4: Goals ─────────────────────────────────
  if (app.goals) {
    if (y > pageHeight - 60) {
      doc.addPage();
      y = addPageHeader(doc, "Mentorship Application (cont.)", `Applicant: ${app.name}`, pageWidth);
    }

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...colors.orange);
    doc.text("GOALS & MESSAGE FROM APPLICANT", 15, y);
    y += 4;
    doc.line(15, y, pageWidth - 15, y);
    y += 5;

    doc.setFillColor(...colors.lightGray);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);

    const goalLines = doc.splitTextToSize(app.goals, pageWidth - 38);
    const boxH = goalLines.length * 5 + 8;
    doc.roundedRect(15, y, pageWidth - 30, boxH, 2, 2, "FD");

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...colors.black);
    doc.text(goalLines, 20, y + 6);

    y += boxH + 10;
  }

  // ── Section 5: Availability ───────────────────────────
  if (app.availability) {
    const hasAny = Object.values(app.availability).some((arr) => arr.length > 0);
    if (hasAny) {
      if (y > pageHeight - 60) {
        doc.addPage();
        y = addPageHeader(doc, "Mentorship Application (cont.)", `Applicant: ${app.name}`, pageWidth);
      }

      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...colors.orange);
      doc.text("AVAILABILITY", 15, y);
      y += 4;
      doc.line(15, y, pageWidth - 15, y);
      y += 5;

      const availBody = ["Morning", "Afternoon", "Evening"].map((slot) => {
        const days = (app.availability?.[slot] || []).map((d: string) => d.substring(0, 3)).join(", ");
        return [slot, days || "—"];
      });

      autoTable(doc, {
        startY: y,
        margin: { left: 15, right: 15 },
        theme: "plain",
        styles: { fontSize: 9, cellPadding: 2.5, lineColor: [226, 232, 240], lineWidth: 0.2 },
        alternateRowStyles: { fillColor: colors.lightGray },
        head: [["Time Slot", "Available Days"]],
        headStyles: { fillColor: colors.dark, textColor: colors.white, fontStyle: "bold", fontSize: 8 },
        body: availBody,
        columnStyles: { 0: { fontStyle: "bold", cellWidth: 45, textColor: colors.medGray } },
      });

      y = (doc as any).lastAutoTable.finalY + 10;
    }
  }

  // ── Section 6: Admin Notes ────────────────────────────
  if (app.notes) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...colors.orange);
    doc.text("ADMIN NOTES", 15, y);
    y += 4;
    doc.line(15, y, pageWidth - 15, y);
    y += 5;

    doc.setFillColor(255, 251, 235);
    doc.setDrawColor(245, 158, 11);
    doc.setLineWidth(0.3);
    const noteLines = doc.splitTextToSize(app.notes, pageWidth - 38);
    const noteBoxH = noteLines.length * 5 + 8;
    doc.roundedRect(15, y, pageWidth - 30, noteBoxH, 2, 2, "FD");
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(120, 80, 0);
    doc.text(noteLines, 20, y + 6);
  }

  // Add footers
  const totalPages = doc.getNumberOfPages();  // FIXED
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addPageFooter(doc, pageWidth, pageHeight, i, totalPages);
  }

  doc.save(`mentorship-app-${app.name.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().slice(0, 10)}.pdf`);
}

/**
 * Download ALL mentorship applications as one bulk PDF
 */
export async function downloadAllMentorshipPDF(apps: MentorshipApp[]): Promise<void> {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const colors = getBrandColors();

  const y = addPageHeader(
    doc,
    "All Mentorship Applications",
    `Total: ${apps.length} applicants · Exported: ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}`,
    pageWidth
  );

  autoTable(doc, {
    startY: y,
    margin: { left: 10, right: 10 },
    theme: "striped",
    styles: { fontSize: 7.5, cellPadding: 3, overflow: "linebreak", lineColor: [226, 232, 240], lineWidth: 0.2 },
    headStyles: { fillColor: colors.dark, textColor: colors.white, fontStyle: "bold", fontSize: 8, halign: "left" },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    head: [["#", "Name", "Email", "Phone", "Target Exam / Field", "Prep Level", "Proficiency", "Status", "Applied On"]],
    body: apps.map((app, i) => [
      i + 1,
      app.name,
      app.email,
      app.phone || "—",
      app.fieldOfStudy || "—",
      app.academicLevel || "—",
      app.proficiency ? `${app.proficiency}/5` : "—",
      app.status || "Pending",
      new Date(app.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
    ]),
    columnStyles: {
      0: { cellWidth: 8, halign: "center" },
      1: { cellWidth: 35, fontStyle: "bold" },
      2: { cellWidth: 45 },
      3: { cellWidth: 28 },
      4: { cellWidth: 40 },
      5: { cellWidth: 30 },
      6: { cellWidth: 18, halign: "center" },
      7: { cellWidth: 22 },
      8: { cellWidth: 25 },
    },
    didDrawCell: (data: any) => {
      // Color status column
      if (data.column.index === 7 && data.section === "body") {
        const status = String(data.cell.raw || "");
        const colors2: [number, number, number] =
          status === "Approved" || status === "Enrolled" ? [16, 185, 129] :
          status === "Contacted" ? [59, 130, 246] :
          status === "Rejected" ? [239, 68, 68] :
          [245, 158, 11];
        doc.setTextColor(...colors2);
        doc.setFont("helvetica", "bold");
        doc.text(status.toUpperCase(), data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2 + 1, { align: "center" });
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "normal");
        return false;
      }
    },
  });

  const totalPages = doc.getNumberOfPages();  // FIXED
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addPageFooter(doc, pageWidth, pageHeight, i, totalPages);
  }

  doc.save(`all-mentorship-applications-${new Date().toISOString().slice(0, 10)}.pdf`);
}

/**
 * Download a single career applicant as a well-formatted PDF
 */
export async function downloadCareerApplicantPDF(app: CareerApp): Promise<void> {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const colors = getBrandColors();

  const submittedDate = new Date(app.createdAt).toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric",
  });

  let y = addPageHeader(doc, "Career Application", `Candidate: ${app.name} · Applied: ${submittedDate}`, pageWidth);

  // Position badge
  doc.setFillColor(...colors.orange);
  doc.roundedRect(15, y, pageWidth - 30, 10, 2, 2, "F");
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  const posText = `Applied For: ${app.role || "General Position"}`;
  doc.text(posText, pageWidth / 2, y + 6.5, { align: "center" });
  y += 18;

  // Contact details
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colors.orange);
  doc.text("CANDIDATE CONTACT", 15, y);
  y += 4;
  doc.line(15, y, pageWidth - 15, y);
  y += 5;

  autoTable(doc, {
    startY: y,
    margin: { left: 15, right: 15 },
    theme: "plain",
    styles: { fontSize: 9, cellPadding: 2.5, lineColor: [226, 232, 240], lineWidth: 0.2 },
    alternateRowStyles: { fillColor: colors.lightGray },
    body: [
      ["Full Name", app.name],
      ["Email", app.email],
      ["Phone", app.phone || "—"],
    ],
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 50, textColor: colors.medGray, fontSize: 8 }, 1: { fontStyle: "normal" } },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // Professional details
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colors.orange);
  doc.text("PROFESSIONAL DETAILS", 15, y);
  y += 4;
  doc.line(15, y, pageWidth - 15, y);
  y += 5;

  autoTable(doc, {
    startY: y,
    margin: { left: 15, right: 15 },
    theme: "plain",
    styles: { fontSize: 9, cellPadding: 2.5, lineColor: [226, 232, 240], lineWidth: 0.2 },
    alternateRowStyles: { fillColor: colors.lightGray },
    body: [
      ["Applied Role", app.role || "—"],
      ["Experience", app.experience || "—"],
      ["Qualification", app.qualification || "—"],
    ],
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 50, textColor: colors.medGray, fontSize: 8 }, 1: { fontStyle: "normal" } },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  if (app.note) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...colors.orange);
    doc.text("COVER NOTE / ADDITIONAL DETAILS", 15, y);
    y += 4;
    doc.line(15, y, pageWidth - 15, y);
    y += 5;

    doc.setFillColor(...colors.lightGray);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    const noteLines = doc.splitTextToSize(app.note, pageWidth - 38);
    const noteBoxH = noteLines.length * 5 + 8;
    doc.roundedRect(15, y, pageWidth - 30, noteBoxH, 2, 2, "FD");
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...colors.black);
    doc.text(noteLines, 20, y + 6);
    y += noteBoxH + 10;
  }

  if (app.resumeUrl) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...colors.orange);
    doc.text("RESUME / CV LINK", 15, y);
    y += 4;
    doc.line(15, y, pageWidth - 15, y);
    y += 5;

    doc.setFillColor(239, 246, 255);
    doc.setDrawColor(147, 197, 253);
    doc.setLineWidth(0.2);
    doc.roundedRect(15, y, pageWidth - 30, 12, 2, 2, "FD");
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(37, 99, 235);
    doc.text(app.resumeUrl, 20, y + 7);
  }

  const totalPages = doc.getNumberOfPages();  // FIXED
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addPageFooter(doc, pageWidth, pageHeight, i, totalPages);
  }

  doc.save(`career-app-${app.name.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().slice(0, 10)}.pdf`);
}

/**
 * Download ALL career applications as one bulk PDF
 */
export async function downloadAllCareersPDF(apps: CareerApp[]): Promise<void> {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const colors = getBrandColors();

  const y = addPageHeader(
    doc,
    "All Career Applications",
    `Total: ${apps.length} candidates · Exported: ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}`,
    pageWidth
  );

  autoTable(doc, {
    startY: y,
    margin: { left: 10, right: 10 },
    theme: "striped",
    styles: { fontSize: 8, cellPadding: 3, overflow: "linebreak", lineColor: [226, 232, 240], lineWidth: 0.2 },
    headStyles: { fillColor: colors.dark, textColor: colors.white, fontStyle: "bold", fontSize: 8.5, halign: "left" },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    head: [["#", "Candidate Name", "Email", "Phone", "Applied Role", "Experience", "Qualification", "Applied On", "Resume"]],
    body: apps.map((app, i) => [
      i + 1,
      app.name,
      app.email,
      app.phone || "—",
      app.role || "General Position",
      app.experience || "—",
      app.qualification || "—",
      new Date(app.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
      app.resumeUrl ? "Yes (link)" : "No",
    ]),
    columnStyles: {
      0: { cellWidth: 8, halign: "center" },
      1: { cellWidth: 40, fontStyle: "bold" },
      2: { cellWidth: 52 },
      3: { cellWidth: 30 },
      4: { cellWidth: 38 },
      5: { cellWidth: 22 },
      6: { cellWidth: 35 },
      7: { cellWidth: 25 },
      8: { cellWidth: 20, halign: "center" },
    },
  });

  const totalPages = doc.getNumberOfPages();  // FIXED
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addPageFooter(doc, pageWidth, pageHeight, i, totalPages);
  }

  doc.save(`all-career-applications-${new Date().toISOString().slice(0, 10)}.pdf`);
}
