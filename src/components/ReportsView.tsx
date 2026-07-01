/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  ChevronLeft, 
  TrendingUp, 
  Clock, 
  Calendar, 
  UserCheck, 
  Award,
  BookOpen,
  PieChart as PieChartIcon,
  FileSpreadsheet,
  ArrowRight
} from 'lucide-react';
import { Register, Worker, AttendanceRecord, OvertimeRecord } from '../types';
import { getDaysInMonth, getMonthName, exportService } from '../utils/export';

interface ReportsViewProps {
  registers: Register[];
  workers: Worker[];
  attendance: AttendanceRecord[];
  overtime: OvertimeRecord[];
  onBack: () => void;
  onSelectSalarySheet: (registerId: string) => void;
}

export default function ReportsView({
  registers,
  workers,
  attendance,
  overtime,
  onBack,
  onSelectSalarySheet
}: ReportsViewProps) {
  // Active register state for calculations
  const [selectedRegisterId, setSelectedRegisterId] = useState<string>(
    registers[0]?.id || ''
  );

  const activeRegister = useMemo(() => {
    return registers.find(r => r.id === selectedRegisterId) || null;
  }, [registers, selectedRegisterId]);

  // Calculations for selected register
  const stats = useMemo(() => {
    if (!activeRegister) return null;

    const regId = activeRegister.id;
    const regAttendance = attendance.filter(a => a.registerId === regId);
    const regOvertime = overtime.filter(o => o.registerId === regId);

    let totalP = 0;
    let totalA = 0;
    let totalH = 0;
    let totalL = 0;
    let totalOT = 0;

    regAttendance.forEach(a => {
      if (a.status === 'P') totalP++;
      else if (a.status === 'A') totalA++;
      else if (a.status === 'H') totalH++;
      else if (a.status === 'L') totalL++;
    });

    regOvertime.forEach(o => {
      if (o.hours > 0) totalOT += o.hours;
    });

    // Total worker records
    const workerStats = workers.map(w => {
      const totals = exportService.getWorkerTotals(w.id, activeRegister, attendance, overtime);
      return {
        worker: w,
        ...totals
      };
    }).filter(ws => ws.worker.isActive || (ws.present + ws.absent + ws.halfDay + ws.leave > 0));

    // Top OT workers
    const topOTWorkers = [...workerStats]
      .filter(w => w.otHours > 0)
      .sort((a, b) => b.otHours - a.otHours)
      .slice(0, 5);

    // Designation-wise analysis
    const designationStats: { [key: string]: { present: number; total: number; ot: number } } = {};
    workerStats.forEach(ws => {
      const des = ws.worker.designation;
      if (!designationStats[des]) {
        designationStats[des] = { present: 0, total: 0, ot: 0 };
      }
      designationStats[des].present += ws.present + (ws.halfDay * 0.5);
      designationStats[des].total += ws.present + ws.absent + ws.halfDay + ws.leave;
      designationStats[des].ot += ws.otHours;
    });

    const designationList = Object.keys(designationStats).map(name => {
      const stats = designationStats[name];
      const rate = stats.total > 0 ? (stats.present / stats.total) * 100 : 0;
      return {
        name,
        rate,
        ot: stats.ot
      };
    }).sort((a, b) => b.rate - a.rate);

    return {
      totalP,
      totalA,
      totalH,
      totalL,
      totalOT,
      totalMandays: totalP + totalA + totalH + totalL,
      workerStats,
      topOTWorkers,
      designationList
    };
  }, [activeRegister, workers, attendance, overtime]);

  const monthName = activeRegister ? getMonthName(activeRegister.month) : '';

  return (
    <div className="space-y-4">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-3xl border border-slate-150 shadow-sm">
        <div className="flex items-center space-x-3">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-slate-100 active:bg-slate-200 rounded-2xl transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Analytics</span>
            <h2 className="font-bold text-slate-800 text-base leading-tight">Reports & Statistics</h2>
            <p className="text-xs text-slate-500">Attendance summary and overtime registers</p>
          </div>
        </div>

        {/* Register Select */}
        {registers.length > 0 && (
          <select
            value={selectedRegisterId}
            onChange={(e) => setSelectedRegisterId(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl text-xs py-2 px-3 outline-none focus:border-indigo-500 focus:bg-white text-slate-700 cursor-pointer"
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
        <div className="text-center py-16 bg-white border border-slate-150 rounded-3xl shadow-sm space-y-2">
          <BarChart3 className="w-10 h-10 mx-auto text-slate-300" />
          <p className="text-sm font-semibold">No registers available</p>
          <p className="text-xs">Create or select a register first to generate insights.</p>
        </div>
      ) : !stats ? (
        <div className="text-center py-16 bg-white border border-slate-150 rounded-3xl shadow-sm">
          <p className="text-xs text-slate-400">Loading register statistics...</p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Monthly Salary Attendance Sheet Call to Action banner */}
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-3xl p-6 shadow-sm border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[9px] uppercase font-extrabold tracking-widest text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">Finance Department</span>
              <h3 className="font-bold text-sm md:text-base tracking-tight text-white mt-1">Monthly Salary Attendance Sheet</h3>
              <p className="text-xs text-slate-300">
                Generate a clean portrait A4 report containing only employee names, designations, present days, and OT hours.
              </p>
            </div>
            <button
              onClick={() => onSelectSalarySheet(selectedRegisterId)}
              className="bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 text-xs font-black py-2.5 px-5 rounded-2xl transition-all shadow-md flex items-center gap-2 cursor-pointer shrink-0"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Generate Sheet</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Key Metric cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Present Ratio */}
            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-3xl">
              <div className="flex items-center justify-between mb-2">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                <span className="text-[8px] uppercase font-bold tracking-wider text-emerald-600">Attendance</span>
              </div>
              <h3 className="text-xl font-bold text-emerald-900">
                {stats.totalMandays > 0 
                  ? `${((stats.totalP + stats.totalH * 0.5) / stats.totalMandays * 100).toFixed(0)}%` 
                  : '0%'}
              </h3>
              <p className="text-[10px] text-emerald-700 mt-1">Average Present Rate</p>
            </div>

            {/* Overtime hours */}
            <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-3xl">
              <div className="flex items-center justify-between mb-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                <span className="text-[8px] uppercase font-bold tracking-wider text-indigo-600">Overtime</span>
              </div>
              <h3 className="text-xl font-bold text-indigo-900">
                {stats.totalOT.toFixed(1)} Hrs
              </h3>
              <p className="text-[10px] text-indigo-700 mt-1">Total OT hours recorded</p>
            </div>

            {/* Active Workers count */}
            <div className="bg-amber-50 border border-amber-100 p-4 rounded-3xl">
              <div className="flex items-center justify-between mb-2">
                <Calendar className="w-4 h-4 text-amber-600" />
                <span className="text-[8px] uppercase font-bold tracking-wider text-amber-600">Mandays</span>
              </div>
              <h3 className="text-xl font-bold text-amber-900">
                {stats.totalP + stats.totalH} Days
              </h3>
              <p className="text-[10px] text-amber-700 mt-1">Sum of present + half days</p>
            </div>

            {/* Total Absent days */}
            <div className="bg-rose-50 border border-rose-100 p-4 rounded-3xl">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-4 h-4 text-rose-600" />
                <span className="text-[8px] uppercase font-bold tracking-wider text-rose-600">Absence</span>
              </div>
              <h3 className="text-xl font-bold text-rose-900">
                {stats.totalA} Days
              </h3>
              <p className="text-[10px] text-rose-700 mt-1">Total unpaid absences</p>
            </div>
          </div>

          {/* SVG Pie Chart / Visual breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Status Breakdown (Custom SVG Pie Chart) */}
            <div className="bg-white rounded-3xl border border-slate-150 p-5 shadow-sm space-y-4">
              <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                <PieChartIcon className="w-4 h-4 text-indigo-500" />
                <h4 className="font-bold text-slate-800 text-xs">Attendance State Distribution</h4>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-2">
                {/* Visual Circle (Donut-like SVG) */}
                <div className="relative w-32 h-32 flex items-center justify-center">
                  {stats.totalMandays === 0 ? (
                    <div className="text-center text-[10px] text-slate-400">No records</div>
                  ) : (
                    <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                      {/* Circle 1: Present (Emerald) */}
                      {(() => {
                        const pPct = (stats.totalP / stats.totalMandays) * 100;
                        const aPct = (stats.totalA / stats.totalMandays) * 100;
                        const hPct = (stats.totalH / stats.totalMandays) * 100;
                        const lPct = (stats.totalL / stats.totalMandays) * 100;

                        let accum = 0;
                        
                        const strokeP = `${pPct} ${100 - pPct}`;
                        const offsetP = 0;
                        accum += pPct;

                        const strokeA = `${aPct} ${100 - aPct}`;
                        const offsetA = -accum;
                        accum += aPct;

                        const strokeH = `${hPct} ${100 - hPct}`;
                        const offsetH = -accum;
                        accum += hPct;

                        const strokeL = `${lPct} ${100 - lPct}`;
                        const offsetL = -accum;

                        return (
                          <>
                            {pPct > 0 && <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#10b981" strokeWidth="3" strokeDasharray={strokeP} strokeDashoffset={offsetP} />}
                            {aPct > 0 && <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#ef4444" strokeWidth="3" strokeDasharray={strokeA} strokeDashoffset={offsetA} />}
                            {hPct > 0 && <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#f59e0b" strokeWidth="3" strokeDasharray={strokeH} strokeDashoffset={offsetH} />}
                            {lPct > 0 && <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#3b82f6" strokeWidth="3" strokeDasharray={strokeL} strokeDashoffset={offsetL} />}
                          </>
                        );
                      })()}
                    </svg>
                  )}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-xs font-black text-slate-800">{stats.totalMandays}</span>
                    <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Entries</span>
                  </div>
                </div>

                {/* Legend list */}
                <div className="space-y-2.5 flex-1 w-full text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-2.5 h-2.5 rounded bg-emerald-500" />
                      <span className="text-slate-600 font-medium">Present (P)</span>
                    </div>
                    <span className="font-bold text-slate-800">{stats.totalP} days ({stats.totalMandays > 0 ? (stats.totalP / stats.totalMandays * 100).toFixed(0) : 0}%)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-2.5 h-2.5 rounded bg-rose-500" />
                      <span className="text-slate-600 font-medium">Absent (A)</span>
                    </div>
                    <span className="font-bold text-slate-800">{stats.totalA} days ({stats.totalMandays > 0 ? (stats.totalA / stats.totalMandays * 100).toFixed(0) : 0}%)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-2.5 h-2.5 rounded bg-amber-500" />
                      <span className="text-slate-600 font-medium">Half-Day (H)</span>
                    </div>
                    <span className="font-bold text-slate-800">{stats.totalH} days ({stats.totalMandays > 0 ? (stats.totalH / stats.totalMandays * 100).toFixed(0) : 0}%)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-2.5 h-2.5 rounded bg-sky-500" />
                      <span className="text-slate-600 font-medium">Leave (L)</span>
                    </div>
                    <span className="font-bold text-slate-800">{stats.totalL} days ({stats.totalMandays > 0 ? (stats.totalL / stats.totalMandays * 100).toFixed(0) : 0}%)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Overtime Performers */}
            <div className="bg-white rounded-3xl border border-slate-150 p-5 shadow-sm space-y-4">
              <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                <Award className="w-4 h-4 text-indigo-500" />
                <h4 className="font-bold text-slate-800 text-xs">Top Overtime Performers</h4>
              </div>

              {stats.topOTWorkers.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  No overtime hours logged for this register yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {stats.topOTWorkers.map((w, index) => (
                    <div key={w.worker.id} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-2xl">
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <span className="text-xs font-bold text-indigo-600 w-4">#{index + 1}</span>
                        <div className="min-w-0">
                          <h5 className="font-bold text-slate-800 text-xs truncate">{w.worker.name}</h5>
                          <span className="text-[9px] bg-slate-200 py-0.5 px-1.5 rounded-full font-medium text-slate-600">
                            {w.worker.designation}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 shrink-0 bg-indigo-50 border border-indigo-200 text-indigo-700 py-1 px-2.5 rounded-xl text-xs font-bold font-mono">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{w.otHours.toFixed(1)} hrs</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Designation Performance analysis */}
          <div className="bg-white rounded-3xl border border-slate-150 p-5 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <TrendingUp className="w-4 h-4 text-indigo-500" />
              <h4 className="font-bold text-slate-800 text-xs">Designation Attendance Rate & Overtime</h4>
            </div>

            {stats.designationList.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">No designation metrics available.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {stats.designationList.map((des) => (
                  <div key={des.name} className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 text-xs">{des.name}</span>
                      <span className="text-xs font-bold text-indigo-600">{des.rate.toFixed(0)}% Attendance</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${des.rate}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium">
                      <span>Mandays calculated</span>
                      <span className="font-mono text-slate-600">{des.ot.toFixed(1)} OT hrs total</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
