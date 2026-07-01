/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  Printer, 
  FileSpreadsheet, 
  FileText, 
  Share2, 
  Eye, 
  Settings as SettingsIcon,
  Info,
  Calendar,
  Building,
  User,
  CheckCircle2,
  Clock,
  UserCheck
} from 'lucide-react';
import { Register, Worker, AttendanceRecord, OvertimeRecord } from '../types';
import { getDaysInMonth, getMonthName } from '../utils/export';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface SalaryAttendanceSheetViewProps {
  registers: Register[];
  workers: Worker[];
  attendance: AttendanceRecord[];
  overtime: OvertimeRecord[];
  onBack: () => void;
  initialRegisterId?: string;
}

export default function SalaryAttendanceSheetView({
  registers,
  workers,
  attendance,
  overtime,
  onBack,
  initialRegisterId
}: SalaryAttendanceSheetViewProps) {
  // State for the selected register
  const [selectedRegisterId, setSelectedRegisterId] = useState<string>(
    initialRegisterId || registers[0]?.id || ''
  );

  // Setting for how half-days are counted
  const [halfDayValue, setHalfDayValue] = useState<'0.5' | '1.0' | '0.0'>('0.5');

  // Selected register object
  const activeRegister = useMemo(() => {
    return registers.find(r => r.id === selectedRegisterId) || null;
  }, [registers, selectedRegisterId]);

  // Current Date for Report
  const generatedDateStr = useMemo(() => {
    const today = new Date();
    return today.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }, []);

  // Filter workers who have records in this register OR are active
  const sheetData = useMemo(() => {
    if (!activeRegister) return [];

    const regId = activeRegister.id;
    const daysInMonth = getDaysInMonth(activeRegister.month, activeRegister.year);

    // Get attendance & overtime specifically for this register
    const regAttendance = attendance.filter(a => a.registerId === regId);
    const regOvertime = overtime.filter(o => o.registerId === regId);

    // We list active workers, or inactive workers who actually have logs for this register
    const relevantWorkers = workers.filter(w => {
      if (w.isActive) return true;
      const hasAtt = regAttendance.some(a => a.workerId === w.id);
      const hasOt = regOvertime.some(o => o.workerId === w.id);
      return hasAtt || hasOt;
    });

    // Sort alphabetically by name
    const sortedWorkers = [...relevantWorkers].sort((a, b) => a.name.localeCompare(b.name));

    const factor = parseFloat(halfDayValue);

    return sortedWorkers.map((worker, index) => {
      let presentDays = 0;
      let otHours = 0;

      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${activeRegister.year}-${String(activeRegister.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        // Find attendance
        const att = regAttendance.find(a => a.workerId === worker.id && a.date === dateStr);
        if (att) {
          if (att.status === 'P') {
            presentDays += 1;
          } else if (att.status === 'H') {
            presentDays += factor;
          }
        }

        // Find overtime
        const ot = regOvertime.find(o => o.workerId === worker.id && o.date === dateStr);
        if (ot && ot.hours > 0) {
          otHours += ot.hours;
        }
      }

      return {
        serialNo: index + 1,
        employeeName: worker.name,
        designation: worker.designation,
        totalPresentDays: presentDays,
        totalOvertimeHours: otHours
      };
    });
  }, [activeRegister, workers, attendance, overtime, halfDayValue]);

  // Total sums
  const totals = useMemo(() => {
    return sheetData.reduce((acc, curr) => {
      return {
        presentDays: acc.presentDays + curr.totalPresentDays,
        otHours: acc.otHours + curr.totalOvertimeHours
      };
    }, { presentDays: 0, otHours: 0 });
  }, [sheetData]);

  // 1. PRINT ACTION
  const handlePrint = () => {
    window.print();
  };

  // 2. EXPORT TO EXCEL
  const handleExportExcel = () => {
    if (!activeRegister) return;

    const monthName = getMonthName(activeRegister.month);
    const data: any[][] = [];

    // Header Metadata
    data.push(['MONTHLY SALARY ATTENDANCE SHEET']);
    data.push([]);
    data.push(['Company Name:', activeRegister.companyName]);
    data.push(['Project / Site Name:', activeRegister.projectName]);
    data.push(['Month:', `${monthName} ${activeRegister.year}`]);
    data.push(['Supervisor Name:', activeRegister.supervisorName || 'N/A']);
    data.push(['Generated Date:', generatedDateStr]);
    data.push([]);

    // Table Column Headers
    data.push(['Serial No.', 'Employee Name', 'Designation', 'Total Present Days', 'Total Overtime Hours']);

    // Data rows
    sheetData.forEach(row => {
      data.push([
        row.serialNo,
        row.employeeName,
        row.designation,
        row.totalPresentDays,
        row.totalOvertimeHours
      ]);
    });

    // Summary Totals row
    data.push([]);
    data.push(['', 'TOTAL SUMS', '', totals.presentDays, totals.otHours]);
    data.push([]);

    // Signatures Section
    data.push([]);
    data.push(['Prepared By: ______________________', '', 'Checked By: ______________________']);
    data.push([]);
    data.push(['Approved By: ______________________', '', 'Finance Office: ______________________']);

    const ws = XLSX.utils.aoa_to_sheet(data);

    // Auto-adjust column widths
    ws['!cols'] = [
      { wch: 10 }, // Serial No
      { wch: 25 }, // Employee Name
      { wch: 20 }, // Designation
      { wch: 20 }, // Total Present Days
      { wch: 22 }  // Total Overtime Hours
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Salary Attendance Summary');

    const fileName = `Monthly_Salary_Attendance_Sheet_${activeRegister.projectName.replace(/\s+/g, '_')}_${monthName}_${activeRegister.year}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  // Helper to generate jsPDF document instance
  const generatePDFDoc = () => {
    if (!activeRegister) return null;

    const monthName = getMonthName(activeRegister.month);
    
    // Create portrait PDF (A4 size: 210mm x 297mm)
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // 1. Draw Title & Meta Header
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('MONTHLY SALARY ATTENDANCE SHEET', 14, 15);
    
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(14, 18, 196, 18); // Horizontal Rule

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Company Name: ${activeRegister.companyName}`, 14, 24);
    doc.text(`Project / Site Name: ${activeRegister.projectName}`, 14, 29);
    doc.text(`Month & Year: ${monthName} ${activeRegister.year}`, 14, 34);

    doc.text(`Supervisor Name: ${activeRegister.supervisorName || 'N/A'}`, 120, 24);
    doc.text(`Generated Date: ${generatedDateStr}`, 120, 29);
    doc.text(`Half-Day Setting: Counted as ${halfDayValue} Day`, 120, 34);

    // 2. Prepare Table Columns
    const tableHeaders = [
      ['Serial No.', 'Employee Name', 'Designation', 'Total Present Days', 'Total Overtime Hours']
    ];

    const tableRows = sheetData.map(row => [
      row.serialNo,
      row.employeeName,
      row.designation,
      row.totalPresentDays.toFixed(1),
      row.totalOvertimeHours.toFixed(1)
    ]);

    // Append total sum row
    tableRows.push([
      '',
      'TOTAL SUMS',
      '',
      totals.presentDays.toFixed(1),
      totals.otHours.toFixed(1)
    ]);

    // 3. Render AutoTable
    (doc as any).autoTable({
      head: tableHeaders,
      body: tableRows,
      startY: 40,
      theme: 'grid',
      styles: {
        fontSize: 8.5,
        cellPadding: 2.5,
        halign: 'left',
        valign: 'middle',
        lineColor: [200, 200, 200],
        lineWidth: 0.1
      },
      headStyles: {
        fillColor: [30, 41, 59], // Slate 800
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'left'
      },
      columnStyles: {
        0: { cellWidth: 20, halign: 'center' }, // Serial No
        1: { cellWidth: 50, fontStyle: 'bold' }, // Employee Name
        2: { cellWidth: 45 },                    // Designation
        3: { cellWidth: 35, halign: 'center' }, // Present Days
        4: { cellWidth: 32, halign: 'center' }  // Overtime Hours
      },
      // Make the totals row bold
      didParseCell: function(data: any) {
        if (data.row.index === tableRows.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [245, 247, 250];
        }
      },
      margin: { left: 14, right: 14, bottom: 45 }
    });

    // 4. Draw Signature Section at the bottom of the last page
    const finalY = (doc as any).lastAutoTable.finalY || 100;
    const pageHeight = doc.internal.pageSize.height;
    
    // If the signature block doesn't fit on the page, add a new page
    let sigY = finalY + 15;
    if (sigY + 25 > pageHeight) {
      doc.addPage();
      sigY = 20;
    }

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8.5);

    // Row 1 Signatures
    doc.text('Prepared By: ______________________', 14, sigY);
    doc.text('Checked By: ______________________', 110, sigY);

    // Row 2 Signatures
    doc.text('Approved By: ______________________', 14, sigY + 15);
    doc.text('Finance Office: ______________________', 110, sigY + 15);

    // Footer
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(7.5);
      doc.text(`Monthly Salary Attendance Summary Sheet | Generated Date: ${generatedDateStr} | Page ${i} of ${totalPages}`, 14, pageHeight - 10);
    }

    return doc;
  };

  // 3. EXPORT TO PDF
  const handleExportPDF = () => {
    const doc = generatePDFDoc();
    if (!doc || !activeRegister) return;
    const monthName = getMonthName(activeRegister.month);
    const fileName = `Salary_Attendance_Sheet_${activeRegister.projectName.replace(/\s+/g, '_')}_${monthName}_${activeRegister.year}.pdf`;
    doc.save(fileName);
  };

  // 4. SHARE PDF
  const handleSharePDF = async () => {
    const doc = generatePDFDoc();
    if (!doc || !activeRegister) return;
    const monthName = getMonthName(activeRegister.month);
    const fileName = `Salary_Attendance_Sheet_${activeRegister.projectName.replace(/\s+/g, '_')}_${monthName}_${activeRegister.year}.pdf`;

    try {
      const pdfBlob = doc.output('blob');
      const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        await navigator.share({
          files: [pdfFile],
          title: 'Monthly Salary Attendance Sheet',
          text: `Here is the Finance Summary Attendance Sheet for project "${activeRegister.projectName}" - ${monthName} ${activeRegister.year}.`
        });
      } else {
        // Fallback
        doc.save(fileName);
        alert("Sharing files is not supported in this browser or environment. The PDF has been downloaded to your device instead.");
      }
    } catch (err) {
      console.error('Error sharing file:', err);
      doc.save(fileName);
    }
  };

  const monthName = activeRegister ? getMonthName(activeRegister.month) : '';

  return (
    <div className="space-y-4">
      {/* Injected Print styling block */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body {
            background: white !important;
            color: black !important;
            font-size: 10pt !important;
          }
          .no-print {
            display: none !important;
          }
          .print-container {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: white !important;
          }
          .print-table {
            border-collapse: collapse !important;
            width: 100% !important;
          }
          .print-table th, .print-table td {
            border: 1px solid #000000 !important;
            padding: 6px 8px !important;
            color: black !important;
          }
          @page {
            size: A4 portrait;
            margin: 15mm 10mm 15mm 10mm;
          }
        }
      ` }} />

      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-3xl border border-slate-150 shadow-xs no-print">
        <div className="flex items-center space-x-3">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-slate-100 active:bg-slate-200 rounded-2xl transition-colors cursor-pointer"
            title="Go Back"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-500">Finance & Payroll Summary</span>
            <h2 className="font-bold text-slate-800 text-base leading-tight">Monthly Salary Attendance Sheet</h2>
            <p className="text-xs text-slate-500">A clean attendance summary tailored for the Finance Office</p>
          </div>
        </div>

        {/* Register Selector */}
        {registers.length > 0 && (
          <select
            value={selectedRegisterId}
            onChange={(e) => setSelectedRegisterId(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl text-xs py-2 px-3 outline-none focus:border-indigo-500 focus:bg-white text-slate-700 font-medium cursor-pointer"
          >
            {registers.map(r => (
              <option key={r.id} value={r.id}>
                {r.projectName} ({getMonthName(r.month)} {r.year})
              </option>
            ))}
          </select>
        )}
      </div>

      {registers.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-150 rounded-3xl shadow-sm space-y-2 no-print">
          <FileText className="w-10 h-10 mx-auto text-slate-300 animate-pulse" />
          <p className="text-sm font-semibold">No registers available</p>
          <p className="text-xs">Create a register with worker logs first to generate a salary attendance sheet.</p>
        </div>
      ) : !activeRegister ? (
        <div className="text-center py-16 bg-white border border-slate-150 rounded-3xl shadow-sm no-print">
          <p className="text-xs text-slate-400">Loading register information...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
          
          {/* Settings / Actions Panel (Left-side on desktop) */}
          <div className="lg:col-span-1 space-y-4 no-print">
            {/* Calculation Controls Card */}
            <div className="bg-white rounded-3xl border border-slate-150 p-5 shadow-xs space-y-4">
              <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                <SettingsIcon className="w-4 h-4 text-indigo-500" />
                <h4 className="font-bold text-slate-800 text-xs">Report Parameters</h4>
              </div>

              {/* Half-Day setting toggle */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wide block">Half-Day Weight Option</label>
                <div className="grid grid-cols-3 bg-slate-100 p-1 rounded-xl gap-1">
                  <button
                    onClick={() => setHalfDayValue('0.5')}
                    className={`py-1.5 text-[10px] font-bold rounded-lg transition-all ${halfDayValue === '0.5' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    0.5 Day
                  </button>
                  <button
                    onClick={() => setHalfDayValue('1.0')}
                    className={`py-1.5 text-[10px] font-bold rounded-lg transition-all ${halfDayValue === '1.0' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    1.0 Day
                  </button>
                  <button
                    onClick={() => setHalfDayValue('0.0')}
                    className={`py-1.5 text-[10px] font-bold rounded-lg transition-all ${halfDayValue === '0.0' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    0.0 Day
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 leading-normal pt-1">
                  Choose how half-days (H) are aggregated into the Total Present Days column. Standard is 0.5.
                </p>
              </div>

              {/* Data Status Summary info */}
              <div className="bg-slate-50 border border-slate-150 rounded-2xl p-3.5 space-y-3">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div className="text-xs">
                    <p className="font-bold text-slate-800">Latest Live Sync</p>
                    <p className="text-[10px] text-slate-500">Data automatically synced</p>
                  </div>
                </div>

                <div className="border-t border-slate-200/60 pt-2.5 grid grid-cols-2 gap-2 text-center">
                  <div className="bg-white p-2 rounded-xl border border-slate-100">
                    <span className="text-xs font-black text-slate-800 block">{totals.presentDays.toFixed(1)}</span>
                    <span className="text-[8px] uppercase font-bold text-slate-400">Total Days</span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-100">
                    <span className="text-xs font-black text-slate-800 block">{totals.otHours.toFixed(1)}</span>
                    <span className="text-[8px] uppercase font-bold text-slate-400">Total OT</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Print & Export Actions Card */}
            <div className="bg-white rounded-3xl border border-slate-150 p-5 shadow-xs space-y-3">
              <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                <Eye className="w-4 h-4 text-indigo-500" />
                <h4 className="font-bold text-slate-800 text-xs">Publish & Export</h4>
              </div>

              <button
                onClick={handlePrint}
                className="w-full flex items-center justify-between px-4 py-3 bg-indigo-50 border border-indigo-100 text-indigo-700 hover:bg-indigo-100/60 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Printer className="w-4 h-4" />
                  <span>Print Sheet</span>
                </span>
                <span className="text-[10px] uppercase font-mono bg-indigo-200/50 py-0.5 px-1.5 rounded">Ctrl+P</span>
              </button>

              <button
                onClick={handleExportPDF}
                className="w-full flex items-center gap-2 px-4 py-3 bg-slate-800 text-white hover:bg-slate-900 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                <FileText className="w-4 h-4 text-rose-400" />
                <span>Export to PDF</span>
              </button>

              <button
                onClick={handleExportExcel}
                className="w-full flex items-center gap-2 px-4 py-3 bg-emerald-600 text-white hover:bg-emerald-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Export to Excel</span>
              </button>

              <button
                onClick={handleSharePDF}
                className="w-full flex items-center gap-2 px-4 py-3 bg-sky-500 text-white hover:bg-sky-600 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>Share PDF</span>
              </button>

              <div className="bg-amber-50 border border-amber-200/60 rounded-xl p-3 flex items-start space-x-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-800 leading-normal">
                  <strong>Finance Ready:</strong> This report is structured for quick auditing, excluding administrative detail codes. It is pre-adjusted for physical A4 Portrait printouts.
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Document Preview (Right-side 3 columns) */}
          <div className="lg:col-span-3 space-y-4">
            
            {/* Live Data Badge Alert */}
            <div className="bg-slate-800 text-slate-100 px-4 py-3 rounded-2xl flex items-center justify-between shadow-sm no-print">
              <div className="flex items-center space-x-2.5">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-semibold">Live Preview: always reflecting latest ledger logs</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">{monthName} {activeRegister.year} Ledger</span>
            </div>

            {/* A4 Sheet Container */}
            <div className="bg-white border border-slate-200 shadow-xl rounded-3xl p-6 md:p-10 space-y-6 mx-auto print-container max-w-[800px]">
              
              {/* Document Header Section */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-slate-200 pb-4">
                  <div>
                    <span className="text-[9px] uppercase font-extrabold tracking-widest text-slate-400 font-mono block">Official Financial Attendance Certificate</span>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight leading-none uppercase mt-1">
                      Monthly Salary Attendance Sheet
                    </h3>
                  </div>
                  <div className="text-left sm:text-right text-xs text-slate-500 space-y-0.5 font-mono">
                    <p><strong>Generated:</strong> {generatedDateStr}</p>
                    <p><strong>Status:</strong> Draft Summary</p>
                  </div>
                </div>

                {/* Metadata Fields Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-slate-700">
                      <Building className="w-4 h-4 text-slate-400" />
                      <span><strong>Company Name:</strong> {activeRegister.companyName}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-slate-700">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span><strong>Month / Year:</strong> {monthName} {activeRegister.year}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-slate-700">
                      <UserCheck className="w-4 h-4 text-slate-400" />
                      <span><strong>Project / Site:</strong> {activeRegister.projectName}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-slate-700">
                      <User className="w-4 h-4 text-slate-400" />
                      <span><strong>Supervisor:</strong> {activeRegister.supervisorName || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Table Body Section */}
              {sheetData.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs">
                  No worker records logged in this register.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700 print-table border border-slate-200">
                    <thead className="bg-slate-800 text-slate-100 text-[10px] font-bold uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3 border-b border-slate-200 text-center w-16">Serial No.</th>
                        <th className="px-4 py-3 border-b border-slate-200 text-left">Employee Name</th>
                        <th className="px-4 py-3 border-b border-slate-200 text-left">Designation</th>
                        <th className="px-4 py-3 border-b border-slate-200 text-center w-36">Total Present Days</th>
                        <th className="px-4 py-3 border-b border-slate-200 text-center w-36">Total Overtime Hours</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {sheetData.map((row) => (
                        <tr key={row.serialNo} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3 text-center font-mono font-medium text-slate-400 bg-slate-50/40">{row.serialNo}</td>
                          <td className="px-4 py-3 font-bold text-slate-800">{row.employeeName}</td>
                          <td className="px-4 py-3 text-slate-600">{row.designation}</td>
                          <td className="px-4 py-3 text-center font-bold text-slate-800 font-mono">{row.totalPresentDays.toFixed(1)}</td>
                          <td className="px-4 py-3 text-center font-bold text-slate-800 font-mono">{row.totalOvertimeHours > 0 ? row.totalOvertimeHours.toFixed(1) : '-'}</td>
                        </tr>
                      ))}
                      
                      {/* Subtotal Row */}
                      <tr className="bg-slate-100/70 font-bold border-t-2 border-slate-300">
                        <td className="px-4 py-3 text-center"></td>
                        <td className="px-4 py-3 text-slate-800">TOTAL SUMS</td>
                        <td className="px-4 py-3"></td>
                        <td className="px-4 py-3 text-center font-mono font-black text-slate-900 bg-slate-100">{totals.presentDays.toFixed(1)}</td>
                        <td className="px-4 py-3 text-center font-mono font-black text-slate-900 bg-slate-100">{totals.otHours.toFixed(1)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* Signature Section at bottom */}
              <div className="pt-10 grid grid-cols-2 gap-y-10 gap-x-12 text-xs">
                <div className="space-y-6">
                  <div className="border-b border-slate-400 pb-1 text-slate-600">
                    Prepared By: ______________________
                  </div>
                  <div className="border-b border-slate-400 pb-1 text-slate-600">
                    Approved By: ______________________
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="border-b border-slate-400 pb-1 text-slate-600">
                    Checked By: ______________________
                  </div>
                  <div className="border-b border-slate-400 pb-1 text-slate-600">
                    Finance Office: ______________________
                  </div>
                </div>
              </div>

              {/* Document footer note */}
              <div className="pt-6 border-t border-slate-100 text-[10px] text-slate-400 text-center font-medium font-mono">
                System generated summary &bull; Requires no handwritten calculations &bull; Verified Offline Site Ledger
              </div>

            </div>
          </div>
          
        </div>
      )}
    </div>
  );
}
