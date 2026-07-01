/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Register, Worker, AttendanceRecord, OvertimeRecord } from '../types';

// Helper to get number of days in a month
export const getDaysInMonth = (month: number, year: number): number => {
  return new Date(year, month, 0).getDate();
};

// Helper to get month name
export const getMonthName = (monthNum: number): string => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[monthNum - 1] || '';
};

// Interface for calculating individual row totals
interface WorkerTotals {
  present: number;
  absent: number;
  halfDay: number;
  leave: number;
  otHours: number;
}

export const exportService = {
  // Calculate totals for a worker in a specific register
  getWorkerTotals(
    workerId: string,
    register: Register,
    attendance: AttendanceRecord[],
    overtime: OvertimeRecord[]
  ): WorkerTotals {
    const daysInMonth = getDaysInMonth(register.month, register.year);
    let present = 0;
    let absent = 0;
    let halfDay = 0;
    let leave = 0;
    let otHours = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${register.year}-${String(register.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      const att = attendance.find(a => a.registerId === register.id && a.workerId === workerId && a.date === dateStr);
      if (att) {
        if (att.status === 'P') present++;
        else if (att.status === 'A') absent++;
        else if (att.status === 'H') halfDay++;
        else if (att.status === 'L') leave++;
      }

      const ot = overtime.find(o => o.registerId === register.id && o.workerId === workerId && o.date === dateStr);
      if (ot && ot.hours > 0) {
        otHours += ot.hours;
      }
    }

    return { present, absent, halfDay, leave, otHours };
  },

  // --- EXCEL EXPORT ---
  exportToExcel(
    register: Register,
    workers: Worker[],
    attendance: AttendanceRecord[],
    overtime: OvertimeRecord[]
  ): void {
    const daysInMonth = getDaysInMonth(register.month, register.year);
    const monthName = getMonthName(register.month);

    // 1. Prepare worksheet structures
    const data: any[][] = [];

    // Metadata lines
    data.push(['LABOUR ATTENDANCE & OVERTIME REGISTER']);
    data.push(['Company Name:', register.companyName]);
    data.push(['Site / Project Name:', register.projectName]);
    data.push(['Month:', `${monthName} ${register.year}`, '', 'Supervisor:', register.supervisorName || 'N/A']);
    data.push([]); // blank row

    // Headers row
    const headers = ['Sr. No.', 'Worker Name', 'Designation'];
    for (let i = 1; i <= daysInMonth; i++) {
      headers.push(String(i));
    }
    headers.push('P (Present)', 'A (Absent)', 'H (Half Day)', 'L (Leave)', 'Total OT Hours');
    data.push(headers);

    // Worker records
    const activeWorkers = workers.filter(w => w.isActive);
    activeWorkers.forEach((worker, idx) => {
      const row: any[] = [idx + 1, worker.name, worker.designation];
      
      const totals = this.getWorkerTotals(worker.id, register, attendance, overtime);

      // Daily records
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${register.year}-${String(register.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const att = attendance.find(a => a.registerId === register.id && a.workerId === worker.id && a.date === dateStr);
        const ot = overtime.find(o => o.registerId === register.id && o.workerId === worker.id && o.date === dateStr);

        let cellVal = '';
        if (att && att.status) {
          cellVal = att.status;
        }
        if (ot && ot.hours > 0) {
          cellVal += ` [OT:${ot.hours}]`;
        }
        row.push(cellVal || '-');
      }

      // Add totals
      row.push(totals.present, totals.absent, totals.halfDay, totals.leave, totals.otHours);
      data.push(row);
    });

    // 2. Create Sheet & Workbook
    const ws = XLSX.utils.aoa_to_sheet(data);

    // Merge titles
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: daysInMonth + 7 } }, // Main title
      { s: { r: 1, c: 1 }, e: { r: 1, c: 4 } }, // Company
      { s: { r: 2, c: 1 }, e: { r: 2, c: 4 } }, // Project
      { s: { r: 3, c: 1 }, e: { r: 3, c: 2 } }, // Month
      { s: { r: 3, c: 4 }, e: { r: 3, c: 6 } }  // Supervisor
    ];

    // Column widths
    const colWidths = [
      { wch: 6 },  // Sr No
      { wch: 22 }, // Name
      { wch: 16 }  // Designation
    ];
    for (let i = 1; i <= daysInMonth; i++) {
      colWidths.push({ wch: 7 }); // Days columns
    }
    colWidths.push({ wch: 11 }, { wch: 11 }, { wch: 12 }, { wch: 11 }, { wch: 14 }); // Totals
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance Register');

    // Generate and download
    const fileName = `Register_${register.projectName.replace(/\s+/g, '_')}_${monthName}_${register.year}.xlsx`;
    XLSX.writeFile(wb, fileName);
  },

  // --- PDF EXPORT ---
  exportToPDF(
    register: Register,
    workers: Worker[],
    attendance: AttendanceRecord[],
    overtime: OvertimeRecord[]
  ): void {
    const daysInMonth = getDaysInMonth(register.month, register.year);
    const monthName = getMonthName(register.month);

    // 1. Initialize jsPDF in landscape mode (A4)
    // A4 is 297mm x 210mm
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // 2. Draw Header
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('LABOUR ATTENDANCE & OVERTIME REGISTER', 14, 12);
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(`Company Name: ${register.companyName}`, 14, 18);
    doc.text(`Project/Site: ${register.projectName}`, 14, 23);
    doc.text(`Month & Year: ${monthName} ${register.year}`, 150, 18);
    doc.text(`Supervisor: ${register.supervisorName || 'N/A'}`, 150, 23);

    // 3. Prepare Table Headers
    const headers = ['No.', 'Worker Name', 'Designation'];
    for (let d = 1; d <= daysInMonth; d++) {
      headers.push(String(d));
    }
    headers.push('P', 'A', 'H', 'L', 'OT');

    // 4. Prepare Table Rows
    const rows: any[][] = [];
    const activeWorkers = workers.filter(w => w.isActive);
    activeWorkers.forEach((worker, idx) => {
      const row: any[] = [idx + 1, worker.name, worker.designation];
      
      const totals = this.getWorkerTotals(worker.id, register, attendance, overtime);

      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${register.year}-${String(register.month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const att = attendance.find(a => a.registerId === register.id && a.workerId === worker.id && a.date === dateStr);
        const ot = overtime.find(o => o.registerId === register.id && o.workerId === worker.id && o.date === dateStr);

        let cell = '';
        if (att && att.status) {
          cell = att.status;
        }
        if (ot && ot.hours > 0) {
          cell += `+${ot.hours}`; // Short OT note, e.g. "P+2"
        }
        row.push(cell || ' ');
      }

      row.push(
        totals.present,
        totals.absent,
        totals.halfDay,
        totals.leave,
        totals.otHours.toFixed(1)
      );
      rows.push(row);
    });

    // 5. Use jsPDF Autotable
    // Dynamic styling to make sure it fits perfectly on A4 Landscape
    // A4 Landscape available width is roughly 270mm (297 - 28 margins)
    const styles: any = {
      fontSize: 5.5, // Small font to fit 37 columns
      cellPadding: 0.6,
      halign: 'center',
      valign: 'middle',
      lineWidth: 0.1,
      lineColor: [200, 200, 200]
    };

    const columnStyles: any = {
      0: { halign: 'center', cellWidth: 7 },  // No.
      1: { halign: 'left', cellWidth: 26, fontSize: 6, fontStyle: 'bold' },  // Worker Name
      2: { halign: 'left', cellWidth: 16, fontSize: 5.5 } // Designation
    };

    // Give remaining columns thin even distribution
    const countLeftover = 3 + daysInMonth + 5;
    for (let c = 3; c < countLeftover; c++) {
      columnStyles[c] = { halign: 'center' };
    }

    // Generate table
    (doc as any).autoTable({
      head: [headers],
      body: rows,
      startY: 28,
      styles: styles,
      columnStyles: columnStyles,
      headStyles: {
        fillColor: [63, 81, 181], // Material Indigo
        textColor: [255, 255, 255],
        fontSize: 5.5,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250]
      },
      margin: { left: 10, right: 10, bottom: 15 },
      didDrawPage: function(data: any) {
        // Footer signature line
        const pageCount = doc.getNumberOfPages();
        doc.setFontSize(7.5);
        doc.setFont('Helvetica', 'normal');
        
        // Add footer text
        const footerY = doc.internal.pageSize.height - 10;
        doc.text(`Page ${data.pageNumber} of ${pageCount}`, 14, footerY);
        doc.text('Labour Attendance & Overtime Register | Generated Offline', 100, footerY);
        doc.text('Supervisor Signature: _______________________', 210, footerY);
      }
    });

    const fileName = `Attendance_Register_${register.projectName.replace(/\s+/g, '_')}_${monthName}_${register.year}.pdf`;
    doc.save(fileName);
  }
};
