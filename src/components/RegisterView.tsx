/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Check, 
  Trash2, 
  Download,
  FileSpreadsheet,
  Zap,
  Info,
  Printer,
  Sparkles
} from 'lucide-react';
import { Register, Worker, AttendanceRecord, OvertimeRecord } from '../types';
import { getDaysInMonth, getMonthName, exportService } from '../utils/export';

interface RegisterViewProps {
  register: Register;
  workers: Worker[];
  attendance: AttendanceRecord[];
  overtime: OvertimeRecord[];
  onMarkAttendance: (workerId: string, date: string, status: AttendanceRecord['status']) => void;
  onBulkMarkPresent: (date: string, workerIds: string[]) => void;
  onSaveOvertime: (workerId: string, date: string, hours: number, reason?: string) => void;
  onBack: () => void;
}

// Separate highly optimized row component for Daily Attendance Board
interface WorkerRowDailyEditorProps {
  key?: string;
  worker: Worker;
  selectedDateStr: string;
  attendanceRecord: AttendanceRecord | undefined;
  overtimeRecord: OvertimeRecord | undefined;
  onMarkAttendance: (workerId: string, date: string, status: AttendanceRecord['status']) => void;
  onSaveOvertime: (workerId: string, date: string, hours: number, reason?: string) => void;
  totals: { present: number; absent: number; halfDay: number; leave: number; otHours: number };
  isReadOnly?: boolean;
}

function WorkerRowDailyEditor({
  worker,
  selectedDateStr,
  attendanceRecord,
  overtimeRecord,
  onMarkAttendance,
  onSaveOvertime,
  totals,
  isReadOnly = false,
}: WorkerRowDailyEditorProps) {
  const [localHours, setLocalHours] = useState(overtimeRecord ? String(overtimeRecord.hours) : '');
  const [localReason, setLocalReason] = useState(overtimeRecord?.reason || '');

  // Synchronize local states when active day or record changes
  useEffect(() => {
    setLocalHours(overtimeRecord && overtimeRecord.hours > 0 ? String(overtimeRecord.hours) : '');
    setLocalReason(overtimeRecord?.reason || '');
  }, [selectedDateStr, overtimeRecord]);

  const handleStatusChange = (status: AttendanceRecord['status']) => {
    if (isReadOnly) return;
    onMarkAttendance(worker.id, selectedDateStr, status);
  };

  const handleBlur = () => {
    if (isReadOnly) return;
    const hoursNum = parseFloat(localHours);
    const finalHours = isNaN(hoursNum) || hoursNum < 0 ? 0 : hoursNum;
    onSaveOvertime(worker.id, selectedDateStr, finalHours, localReason);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      (e.target as HTMLElement).blur();
    }
  };

  const currentStatus = attendanceRecord?.status || '';

  return (
    <tr className={`border-b border-[#C4C7C8] hover:bg-slate-50 transition-colors ${!worker.isActive ? 'opacity-40' : ''}`}>
      {/* Worker Details Column */}
      <td className="sticky left-0 bg-white hover:bg-slate-50 z-10 px-3 py-2 border-r border-[#C4C7C8] text-xs font-sans shadow-[2px_0_0_rgba(0,0,0,0.02)]">
        <div className="font-bold text-[#1A1C1E]">{worker.name}</div>
        <div className="text-[10px] text-slate-500 font-medium">{worker.designation}</div>
        {!worker.isActive && (
          <span className="inline-block text-[8px] bg-red-50 text-[#D32F2F] font-bold px-1 rounded uppercase mt-0.5">Inactive</span>
        )}
      </td>

      {/* Attendance Status Buttons (P, A, H, L) */}
      <td className="px-3 py-2 border-r border-[#C4C7C8] text-center">
        <div className="inline-flex rounded-xl p-1 bg-slate-100 gap-1 select-none">
          <button
            onClick={() => handleStatusChange('P')}
            disabled={isReadOnly}
            className={`w-9 h-9 text-xs font-black rounded-lg transition-all ${isReadOnly ? 'cursor-not-allowed' : 'cursor-pointer'} ${
              currentStatus === 'P'
                ? 'bg-[#2E7D32] text-white shadow-md'
                : 'text-[#2E7D32] hover:bg-[#2E7D32]/10 hover:scale-105'
            }`}
            title="Mark Present"
          >
            P
          </button>
          <button
            onClick={() => handleStatusChange('A')}
            disabled={isReadOnly}
            className={`w-9 h-9 text-xs font-black rounded-lg transition-all ${isReadOnly ? 'cursor-not-allowed' : 'cursor-pointer'} ${
              currentStatus === 'A'
                ? 'bg-[#D32F2F] text-white shadow-md'
                : 'text-[#D32F2F] hover:bg-[#D32F2F]/10 hover:scale-105'
            }`}
            title="Mark Absent"
          >
            A
          </button>
          <button
            onClick={() => handleStatusChange('H')}
            disabled={isReadOnly}
            className={`w-9 h-9 text-xs font-black rounded-lg transition-all ${isReadOnly ? 'cursor-not-allowed' : 'cursor-pointer'} ${
              currentStatus === 'H'
                ? 'bg-[#F57C00] text-white shadow-md'
                : 'text-[#F57C00] hover:bg-[#F57C00]/10 hover:scale-105'
            }`}
            title="Mark Half Day"
          >
            H
          </button>
          <button
            onClick={() => handleStatusChange('L')}
            disabled={isReadOnly}
            className={`w-9 h-9 text-xs font-black rounded-lg transition-all ${isReadOnly ? 'cursor-not-allowed' : 'cursor-pointer'} ${
              currentStatus === 'L'
                ? 'bg-[#0288D1] text-white shadow-md'
                : 'text-[#0288D1] hover:bg-[#0288D1]/10 hover:scale-105'
            }`}
            title="Mark Leave"
          >
            L
          </button>
          {currentStatus !== '' && !isReadOnly && (
            <button
              onClick={() => handleStatusChange('')}
              className="px-2 h-9 text-[10px] font-bold rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-all cursor-pointer"
              title="Clear Attendance"
            >
              Clear
            </button>
          )}
        </div>
      </td>

      {/* Overtime (Hours & Reason) */}
      <td className="px-3 py-2 border-r border-[#C4C7C8] text-center">
        <div className="flex items-center space-x-2">
          {/* OT Hours field */}
          <div className="relative">
            <input
              type="number"
              step="0.5"
              min="0"
              max="24"
              placeholder="0.0"
              value={localHours}
              onChange={(e) => setLocalHours(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              disabled={isReadOnly}
              className={`w-16 p-2 bg-slate-50 border border-slate-300 rounded-xl text-center text-xs font-mono font-bold outline-none focus:bg-white focus:border-[#7B1FA2] focus:ring-1 focus:ring-[#7B1FA2]/30 ${isReadOnly ? 'cursor-not-allowed opacity-60' : ''}`}
            />
            <span className="absolute -top-3.5 left-1 text-[8px] font-semibold text-slate-400 uppercase tracking-wide">OT Hours</span>
          </div>
          
          {/* OT Reason / Job field */}
          <div className="flex-1 min-w-[120px] relative">
            <input
              type="text"
              placeholder={isReadOnly ? '-' : "e.g. Concrete Pouring, Late Shift"}
              value={localReason}
              onChange={(e) => setLocalReason(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              disabled={isReadOnly}
              className={`w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none focus:bg-white focus:border-[#7B1FA2] focus:ring-1 focus:ring-[#7B1FA2]/30 ${isReadOnly ? 'cursor-not-allowed opacity-60' : ''}`}
            />
            <span className="absolute -top-3.5 left-1 text-[8px] font-semibold text-slate-400 uppercase tracking-wide">Work Details / Reason</span>
          </div>
        </div>
      </td>

      {/* Live Calculated Month Totals */}
      <td className="px-2 py-2 border-r border-[#C4C7C8] text-center font-bold text-xs text-[#2E7D32] bg-emerald-50/10">
        {totals.present || '-'}
      </td>
      <td className="px-2 py-2 border-r border-[#C4C7C8] text-center font-bold text-xs text-[#D32F2F] bg-rose-50/10">
        {totals.absent || '-'}
      </td>
      <td className="px-2 py-2 border-r border-[#C4C7C8] text-center font-bold text-xs text-[#F57C00] bg-amber-50/10">
        {totals.halfDay || '-'}
      </td>
      <td className="px-2 py-2 border-r border-[#C4C7C8] text-center font-bold text-xs text-[#0288D1] bg-sky-50/10">
        {totals.leave || '-'}
      </td>
      <td className="px-2 py-2 text-center font-mono font-bold text-xs text-slate-700 bg-slate-50">
        {totals.otHours > 0 ? totals.otHours.toFixed(1) : '-'}
      </td>
    </tr>
  );
}

export default function RegisterView({
  register,
  workers,
  attendance,
  overtime,
  onMarkAttendance,
  onBulkMarkPresent,
  onSaveOvertime,
  onBack
}: RegisterViewProps) {
  const daysInMonth = getDaysInMonth(register.month, register.year);
  const monthName = getMonthName(register.month);

  // Filter and search states
  const [searchQuery, setSearchQuery] = useState('');
  const [designationFilter, setDesignationFilter] = useState('All');

  // Screen View Mode ('daily' = Direct Day Marking Board, 'monthly' = 1-31 Paper Ledger Table)
  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily');

  // Active selected day for the daily direct editor
  const today = new Date();
  const initialDay = today.getMonth() + 1 === register.month && today.getFullYear() === register.year
    ? today.getDate()
    : 1;
  const [selectedDay, setSelectedDay] = useState<number>(initialDay);

  // Extract unique designations for filters
  const designations = useMemo(() => {
    const list = new Set(workers.map(w => w.designation));
    return ['All', ...Array.from(list)];
  }, [workers]);

  // Filtered workers list
  const filteredWorkers = useMemo(() => {
    return workers.filter(w => {
      const matchesSearch = w.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = designationFilter === 'All' || w.designation === designationFilter;
      return matchesSearch && matchesFilter;
    });
  }, [workers, searchQuery, designationFilter]);

  const selectedDateStr = useMemo(() => {
    return `${register.year}-${String(register.month).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
  }, [register, selectedDay]);

  // Apply Bulk Mark Present for selected date
  const handleBulkMarkPresent = () => {
    const activeWorkerIds = filteredWorkers.filter(w => w.isActive).map(w => w.id);
    onBulkMarkPresent(selectedDateStr, activeWorkerIds);
  };

  // Triggers pdf download
  const handleDownloadPDF = () => {
    exportService.exportToPDF(register, workers, attendance, overtime);
  };

  // Triggers excel download
  const handleDownloadExcel = () => {
    exportService.exportToExcel(register, workers, attendance, overtime);
  };

  // Helper to render cell display class inside 1-31 table
  const getCellClass = (status: string, isSelectedColumn: boolean) => {
    const base = "w-10 h-10 border-r border-b border-[#C4C7C8] text-center text-xs font-bold transition-all flex items-center justify-center cursor-pointer select-none ";
    const selectedBg = isSelectedColumn ? "bg-[#2196F3]/5" : "hover:bg-slate-100";

    if (status === 'P') return base + "status-p font-bold hover:opacity-90";
    if (status === 'A') return base + "status-a font-bold hover:opacity-90";
    if (status === 'H') return base + "status-h font-bold hover:opacity-90";
    if (status === 'L') return base + "status-l font-bold hover:opacity-90";
    return base + selectedBg;
  };

  // Array of days for table rendering
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Navigate to daily direct marker when a cell is clicked in the monthly view
  const handleMonthlyCellClick = (workerId: string, day: number) => {
    setSelectedDay(day);
    setViewMode('daily');
  };

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-xl border border-[#C4C7C8] shadow-xs no-print">
        <div className="flex items-center space-x-3">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-[#F5F7FA] active:bg-slate-200 rounded-lg transition-colors border border-[#C4C7C8] cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 text-slate-600" />
          </button>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#44474E] flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#2196F3]" />
              Attendance Control Center
            </span>
            <h2 className="font-bold text-[#1A1C1E] text-base leading-tight">{register.projectName}</h2>
            <p className="text-xs text-[#44474E]">{register.companyName} • {monthName} {register.year}</p>
          </div>
        </div>

        {/* Export and Print Action Buttons */}
        <div className="flex items-center space-x-2 flex-wrap gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 active:scale-95 text-xs font-bold rounded-lg transition-all border border-slate-300 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Register</span>
          </button>
          <button
            onClick={handleDownloadPDF}
            className="flex items-center space-x-1.5 px-3 py-2 bg-rose-50 text-[#D32F2F] hover:bg-rose-100 active:scale-95 text-xs font-bold rounded-lg transition-all border border-[#D32F2F]/20 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>PDF Register</span>
          </button>
          <button
            onClick={handleDownloadExcel}
            className="flex items-center space-x-1.5 px-3 py-2 bg-[#E8F5E9] text-[#2E7D32] hover:bg-[#C8E6C9] active:scale-95 text-xs font-bold rounded-lg transition-all border border-[#2E7D32]/20 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel Export</span>
          </button>
        </div>
      </div>

      {register.isArchived && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-4 flex items-start space-x-3 no-print animate-fade-in shadow-xs">
          <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold text-amber-950">Read-Only Archived Register</p>
            <p className="text-amber-900">
              This register has been archived for historical record-keeping. You can search, browse dates, print, and export reports, but modifications are disabled. To resume editing, restore this register from the Registers page.
            </p>
          </div>
        </div>
      )}

      {/* Primary Navigation & Mode Switch Tabs */}
      <div className="flex bg-slate-200/80 p-1 rounded-2xl max-w-md no-print shadow-inner">
        <button
          onClick={() => setViewMode('daily')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
            viewMode === 'daily'
              ? 'bg-white text-[#2196F3] shadow-md scale-100'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/30'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          <span>Daily Marker (Instant Entry)</span>
        </button>
        <button
          onClick={() => setViewMode('monthly')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
            viewMode === 'monthly'
              ? 'bg-white text-[#2196F3] shadow-md scale-100'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/30'
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-indigo-500" />
          <span>Monthly Ledger (1-31 Sheet)</span>
        </button>
      </div>

      {/* Direct Daily Marker Sub-Panel */}
      {viewMode === 'daily' && (
        <div className="bg-[#1A1C1E] text-white rounded-xl p-4 shadow-sm border border-[#C4C7C8] no-print space-y-4 animate-fade-in">
          {/* Active Date Navigation Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-white/10 pb-3">
            <div className="space-y-1">
              <div className="flex items-center space-x-1.5 text-[#2196F3] text-[10px] font-black tracking-wider uppercase">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>ACTIVE DAY TO MARK</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setSelectedDay(Math.max(1, selectedDay - 1))}
                  disabled={selectedDay === 1}
                  className="p-1 hover:bg-[#44474E] disabled:opacity-20 rounded-lg transition-colors border border-white/10 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <h3 className="text-lg font-black font-mono tracking-tight">
                  {String(selectedDay).padStart(2, '0')} {monthName} {register.year}
                </h3>
                <button
                  onClick={() => setSelectedDay(Math.min(daysInMonth, selectedDay + 1))}
                  disabled={selectedDay === daysInMonth}
                  className="p-1 hover:bg-[#44474E] disabled:opacity-20 rounded-lg transition-colors border border-white/10 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleBulkMarkPresent}
                disabled={register.isArchived}
                className={`w-full sm:w-auto flex items-center justify-center space-x-1.5 px-4 py-2.5 text-xs font-bold rounded-lg transition-all border text-white ${
                  register.isArchived
                    ? 'bg-slate-500/50 border-slate-500/30 cursor-not-allowed opacity-55'
                    : 'bg-[#2196F3] hover:bg-[#1976D2] active:scale-[0.98] border-[#2196F3]/30 cursor-pointer'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>Mark All Active Workers Present</span>
              </button>
            </div>
          </div>

          {/* Touch-Friendly Horizontal Day Slider Ribbon */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Click any day to jump date:</span>
            <div className="flex items-center space-x-1 overflow-x-auto pb-2 scrollbar-none max-w-full">
              {daysArray.map((day) => {
                const isSelected = day === selectedDay;
                const dateStr = `${register.year}-${String(register.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const markedCount = attendance.filter(a => a.registerId === register.id && a.date === dateStr && a.status !== '').length;

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`flex-shrink-0 flex flex-col items-center justify-center w-11 h-14 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#2196F3] text-white border-[#2196F3] shadow-md scale-95'
                        : 'bg-white/5 text-slate-200 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <span className="text-[8px] uppercase font-bold tracking-wider opacity-60 leading-none">Day</span>
                    <span className="text-sm font-black font-mono leading-none mt-1">{String(day).padStart(2, '0')}</span>
                    <span className={`text-[7px] px-1 rounded-full mt-2 font-black ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : markedCount > 0
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-white/10 text-slate-400'
                    }`}>
                      {markedCount}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters Bar (Always visible on screen, hidden on print) */}
      <div className="flex flex-col sm:flex-row gap-2 bg-white p-3 rounded-xl border border-[#C4C7C8] shadow-xs no-print">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search worker by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-[#C4C7C8] rounded-lg text-xs focus:bg-white focus:border-[#2196F3] focus:ring-1 focus:ring-[#2196F3]/20 outline-none transition-all"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={designationFilter}
            onChange={(e) => setDesignationFilter(e.target.value)}
            className="bg-slate-50 border border-[#C4C7C8] rounded-lg text-xs py-2 pl-2 pr-6 outline-none focus:border-[#2196F3] focus:bg-white text-slate-600 cursor-pointer"
          >
            {designations.map(des => (
              <option key={des} value={des}>{des}</option>
            ))}
          </select>
        </div>
      </div>

      {/* VIEW 1: Direct Entry Daily Attendance Board Table */}
      {viewMode === 'daily' && (
        <div className="bg-white rounded-xl border border-[#C4C7C8] shadow-sm overflow-auto max-h-[65vh] max-w-full relative no-print animate-fade-in">
          <table className="border-collapse table-fixed w-full text-left font-mono">
            <thead>
              <tr className="bg-[#F0F4F8] border-b border-[#C4C7C8]">
                {/* Headers */}
                <th className="sticky left-0 top-0 bg-[#F0F4F8] z-30 w-36 md:w-44 px-3 py-3 text-xs font-bold text-[#44474E] border-r border-b border-[#C4C7C8] font-sans shadow-[2px_0_0_rgba(0,0,0,0.08)]">
                  Worker Name
                </th>
                <th className="sticky top-0 bg-[#F0F4F8] z-20 w-[240px] px-3 py-3 text-xs font-bold text-center text-[#44474E] border-r border-b border-[#C4C7C8] font-sans">
                  Daily Status (Click to Set)
                </th>
                <th className="sticky top-0 bg-[#F0F4F8] z-20 w-[280px] px-3 py-3 text-xs font-bold text-center text-[#44474E] border-r border-b border-[#C4C7C8] font-sans">
                  Daily Overtime & Details
                </th>
                <th colSpan={5} className="sticky top-0 bg-slate-100 z-20 text-center text-[10px] uppercase font-bold text-[#44474E] border-b border-[#C4C7C8] font-sans py-1">
                  Monthly Cumulative Totals
                </th>
              </tr>
              <tr className="bg-[#F0F4F8] border-b border-[#C4C7C8] text-[9px]">
                <th className="sticky left-0 bg-[#F0F4F8] border-r border-[#C4C7C8] h-6 shadow-[2px_0_0_rgba(0,0,0,0.08)]" />
                <th className="border-r border-[#C4C7C8]" />
                <th className="border-r border-[#C4C7C8]" />
                <th className="w-11 text-center text-[#2E7D32] border-r border-b border-[#C4C7C8] bg-emerald-50 py-1.5 font-sans">Present</th>
                <th className="w-11 text-center text-[#D32F2F] border-r border-b border-[#C4C7C8] bg-rose-50 py-1.5 font-sans">Absent</th>
                <th className="w-12 text-center text-[#F57C00] border-r border-b border-[#C4C7C8] bg-amber-50 py-1.5 font-sans">Half-Day</th>
                <th className="w-11 text-center text-[#0288D1] border-r border-b border-[#C4C7C8] bg-sky-50 py-1.5 font-sans">Leave</th>
                <th className="w-14 text-center text-slate-700 bg-slate-100 py-1.5 font-sans">Total OT</th>
              </tr>
            </thead>
            <tbody>
              {filteredWorkers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400 text-xs font-sans">
                    No active workers found matching the filters.
                  </td>
                </tr>
              ) : (
                filteredWorkers.map((worker) => {
                  const totals = exportService.getWorkerTotals(worker.id, register, attendance, overtime);
                  const attRecord = attendance.find(a => a.registerId === register.id && a.workerId === worker.id && a.date === selectedDateStr);
                  const otRecord = overtime.find(o => o.registerId === register.id && o.workerId === worker.id && o.date === selectedDateStr);

                  return (
                    <WorkerRowDailyEditor
                      key={`${worker.id}-${selectedDateStr}`}
                      worker={worker}
                      selectedDateStr={selectedDateStr}
                      attendanceRecord={attRecord}
                      overtimeRecord={otRecord}
                      onMarkAttendance={onMarkAttendance}
                      onSaveOvertime={onSaveOvertime}
                      totals={totals}
                      isReadOnly={register.isArchived}
                    />
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* VIEW 2: Traditional 1-31 Paper Ledger Table Grid (Shows on Screen for mode 2, and ALWAYS on print) */}
      <div className={`bg-white rounded-xl border border-[#C4C7C8] shadow-sm overflow-auto max-h-[65vh] max-w-full relative ${
        viewMode === 'monthly' ? "block animate-fade-in" : "hidden print:block"
      }`}>
        <table className="border-collapse table-fixed w-full text-left font-mono">
          <thead>
            <tr className="bg-[#F0F4F8] border-b border-[#C4C7C8]">
              {/* Frozen columns for print & screen */}
              <th className="sticky left-0 top-0 bg-[#F0F4F8] z-30 w-32 md:w-40 px-3 py-3 text-xs font-bold text-[#44474E] border-r border-b border-[#C4C7C8] font-sans shadow-[2px_0_0_rgba(0,0,0,0.08)]">
                Worker Name
              </th>
              <th className="sticky left-32 md:left-40 top-0 bg-[#F0F4F8] z-30 w-24 md:w-28 px-2 py-3 text-xs font-bold text-[#44474E] border-r border-b border-[#C4C7C8] font-sans shadow-[2px_0_0_rgba(0,0,0,0.08)]">
                Designation
              </th>

              {/* Day Headers */}
              {daysArray.map((day) => {
                const isSelected = day === selectedDay && viewMode === 'monthly';
                return (
                  <th 
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`sticky top-0 z-20 w-10 text-center text-xs font-bold py-3 border-r border-b border-[#C4C7C8] cursor-pointer transition-colors ${
                      isSelected 
                        ? 'bg-[#2196F3] text-white shadow-inner' 
                        : 'bg-[#F0F4F8] text-[#44474E] hover:bg-slate-200'
                    }`}
                  >
                    {String(day).padStart(2, '0')}
                  </th>
                );
              })}

              {/* Summary Headers */}
              <th className="sticky top-0 z-20 w-16 text-center text-xs font-bold text-[#2E7D32] py-3 border-r border-b border-[#C4C7C8] bg-emerald-50 font-sans">Present</th>
              <th className="sticky top-0 z-20 w-16 text-center text-xs font-bold text-[#D32F2F] py-3 border-r border-b border-[#C4C7C8] bg-rose-50 font-sans">Absent</th>
              <th className="sticky top-0 z-20 w-20 text-center text-xs font-bold text-[#F57C00] py-3 border-r border-b border-[#C4C7C8] bg-amber-50 font-sans">Half Day</th>
              <th className="sticky top-0 z-20 w-16 text-center text-xs font-bold text-[#0288D1] py-3 border-r border-b border-[#C4C7C8] bg-sky-50 font-sans">Leave</th>
              <th className="sticky top-0 z-20 w-20 text-center text-xs font-bold text-[#44474E] py-3 border-b border-[#C4C7C8] bg-[#F5F7FA] font-sans">Total OT</th>
            </tr>
          </thead>
          <tbody>
            {filteredWorkers.length === 0 ? (
              <tr>
                <td colSpan={daysInMonth + 7} className="text-center py-12 text-slate-400 text-xs font-sans">
                  No active workers found matching the filters.
                </td>
              </tr>
            ) : (
              filteredWorkers.map((worker) => {
                const totals = exportService.getWorkerTotals(worker.id, register, attendance, overtime);

                return (
                  <tr 
                    key={worker.id} 
                    className={`transition-colors row ${!worker.isActive ? 'opacity-45' : ''}`}
                  >
                    {/* Frozen Cells */}
                    <td className="sticky left-0 bg-white z-10 font-bold text-[#1A1C1E] text-xs px-3 py-2 border-r border-b border-[#C4C7C8] truncate max-w-32 md:max-w-40 font-sans shadow-[2px_0_0_rgba(0,0,0,0.04)]">
                      {worker.name}
                      {!worker.isActive && (
                        <span className="block text-[8px] text-[#D32F2F] font-bold tracking-wider uppercase mt-0.5">Inactive</span>
                      )}
                    </td>
                    <td className="sticky left-32 md:left-40 bg-white z-10 text-[#44474E] text-[10px] px-2 py-2 border-r border-b border-[#C4C7C8] truncate max-w-24 md:max-w-28 font-sans shadow-[2px_0_0_rgba(0,0,0,0.04)]">
                      {worker.designation}
                    </td>

                    {/* Compact Day Cells (Clicking focus the day & jumps to Daily marker view) */}
                    {daysArray.map((day) => {
                      const dateStr = `${register.year}-${String(register.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                      const record = attendance.find(a => a.registerId === register.id && a.workerId === worker.id && a.date === dateStr);
                      const otRecord = overtime.find(o => o.registerId === register.id && o.workerId === worker.id && o.date === dateStr);
                      
                      const status = record?.status || '';
                      const otHoursVal = otRecord?.hours || 0;

                      return (
                        <td 
                          key={day}
                          onClick={() => handleMonthlyCellClick(worker.id, day)}
                          className={`${getCellClass(status, day === selectedDay && viewMode === 'monthly')} relative select-none font-sans font-bold`}
                        >
                          <div className="relative w-full h-full flex items-center justify-center">
                            <span>{status || '-'}</span>
                            {otHoursVal > 0 && (
                              <div 
                                title={`OT: ${otHoursVal} hrs${otRecord?.reason ? ` (${otRecord.reason})` : ''}`}
                                className="absolute right-1 top-1 w-1.5 h-1.5 rounded-full bg-[#7B1FA2] border border-white shadow-[0_0_2px_rgba(0,0,0,0.3)]" 
                              />
                            )}
                          </div>
                        </td>
                      );
                    })}

                    {/* Totals Summary */}
                    <td className="text-center text-xs font-bold text-[#2E7D32] bg-emerald-50/5 border-r border-b border-[#C4C7C8] py-2">
                      {totals.present || '-'}
                    </td>
                    <td className="text-center text-xs font-bold text-[#D32F2F] bg-rose-50/5 border-r border-b border-[#C4C7C8] py-2">
                      {totals.absent || '-'}
                    </td>
                    <td className="text-center text-xs font-bold text-[#F57C00] bg-amber-50/5 border-r border-b border-[#C4C7C8] py-2">
                      {totals.halfDay || '-'}
                    </td>
                    <td className="text-center text-xs font-bold text-[#0288D1] bg-sky-50/5 border-r border-b border-[#C4C7C8] py-2">
                      {totals.leave || '-'}
                    </td>
                    <td className="text-center text-xs font-mono font-bold text-[#1A1C1E] bg-[#F5F7FA] border-b border-[#C4C7C8] py-2">
                      {totals.otHours > 0 ? totals.otHours.toFixed(1) : '-'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Guide Banner */}
      <div className="flex items-start space-x-2.5 p-4 bg-[#F0F4F8] border border-[#C4C7C8] rounded-2xl no-print">
        <Info className="w-5 h-5 text-[#2196F3] shrink-0 mt-0.5" />
        <div className="text-slate-700 text-xs space-y-1">
          <p className="font-bold text-[#1A1C1E]">Construction / Industrial Attendance Guide:</p>
          <p>
            You are using the **Direct Marking Mode**. Every worker row now shows visible tactile buttons to instantly mark attendance status (P, A, H, L) and direct text fields to record Overtime hours and job descriptions. All changes save instantly on blur and update monthly cumulative metrics.
          </p>
          <p className="text-[10px] text-slate-500">
            * To view the complete 31-day paper-style overview sheet or print/export the monthly ledger, click the **Monthly Ledger** tab above.
          </p>
        </div>
      </div>
    </div>
  );
}
