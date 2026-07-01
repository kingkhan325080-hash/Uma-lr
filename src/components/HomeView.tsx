/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  PlusCircle, 
  FolderOpen, 
  Users, 
  BarChart3, 
  CloudLightning, 
  Settings as SettingsIcon, 
  BookOpen,
  CheckCircle2,
  Calendar,
  Layers,
  Archive,
  FileSpreadsheet,
  Smartphone,
  Download,
  WifiOff
} from 'lucide-react';
import { Register, Worker } from '../types';
import { getMonthName } from '../utils/export';

interface HomeViewProps {
  registers: Register[];
  workers: Worker[];
  activeRegister: Register | null;
  onSelectView: (view: string) => void;
  onOpenRegister: (register: Register) => void;
  onCreateDemo: () => void;
  isAppInstallable?: boolean;
  onInstallApp?: () => void;
  isOnline?: boolean;
}

export default function HomeView({
  registers,
  workers,
  activeRegister,
  onSelectView,
  onOpenRegister,
  onCreateDemo,
  isAppInstallable = false,
  onInstallApp,
  isOnline = true
}: HomeViewProps) {
  const activeWorkersCount = workers.filter(w => w.isActive).length;
  const activeRegisters = registers.filter(r => !r.isArchived);
  const recentRegisters = activeRegisters.slice(0, 3);
  const archivedRegisters = registers.filter(r => !!r.isArchived);

  return (
    <div className="space-y-6">
      {/* Offline Alert if offline */}
      {!isOnline && (
        <div className="bg-amber-500 text-slate-950 p-4 rounded-xl flex items-center justify-between border border-amber-600/20 shadow-xs">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-amber-600 rounded-lg text-white">
              <WifiOff className="w-4.5 h-4.5 animate-pulse" />
            </div>
            <div className="text-xs">
              <span className="font-bold">Offline Mode Active</span>
              <p className="opacity-90 mt-0.5">All updates are stored safely in device sandbox and will sync once internet is restored.</p>
            </div>
          </div>
        </div>
      )}

      {/* PWA Install Promo Banner */}
      {isAppInstallable && (
        <div className="bg-gradient-to-r from-indigo-900 to-indigo-950 text-white p-5 rounded-xl border border-indigo-950 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[9px] uppercase font-extrabold tracking-widest text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">Install App</span>
            <h3 className="font-bold text-sm leading-tight text-white mt-1">Get the Desktop & Mobile App</h3>
            <p className="text-xs text-indigo-200">
              Install the register to your Home Screen for faster launching, offline use, and zero browser border clutter.
            </p>
          </div>
          <button
            onClick={onInstallApp}
            className="bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 text-xs font-black py-2.5 px-5 rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>Install Now</span>
          </button>
        </div>
      )}

      {/* Banner / Header */}
      <div className="bg-white border border-[#C4C7C8] border-l-4 border-l-[#2196F3] rounded-xl p-6 shadow-xs relative overflow-hidden">
        <div className="absolute right-[-20px] top-[-20px] opacity-5 text-[#2196F3] select-none pointer-events-none">
          <BookOpen className="w-40 h-40" />
        </div>
        
        <div className="relative z-10 space-y-4">
          <div className="space-y-1">
            <h2 className="text-xl font-bold tracking-tight text-[#1A1C1E]">Labour Attendance & Overtime Register</h2>
            <p className="text-[#44474E] text-xs font-mono uppercase tracking-wider">Industrial Field Ledger System</p>
          </div>

          {activeRegister ? (
            <div className="bg-[#F5F7FA] border border-[#C4C7C8] rounded-lg p-4 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[9px] uppercase font-bold tracking-widest text-[#2196F3] bg-[#2196F3]/10 px-2 py-0.5 rounded">Active Register</span>
                <h3 className="font-bold text-sm text-[#1A1C1E] mt-1">{activeRegister.projectName}</h3>
                <p className="text-xs text-[#44474E] flex items-center">
                  <Calendar className="w-3.5 h-3.5 mr-1 text-[#2196F3]" />
                  {getMonthName(activeRegister.month)} {activeRegister.year} &bull; {activeRegister.companyName}
                </p>
              </div>
              <button 
                onClick={() => onSelectView('register')}
                className="bg-[#2196F3] text-white hover:bg-[#1976D2] active:scale-95 text-xs font-bold py-2 px-4 rounded-lg transition-all shadow-xs cursor-pointer"
              >
                Open Ledger Grid
              </button>
            </div>
          ) : (
            <div className="bg-[#F5F7FA] border border-[#C4C7C8] rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-[#1A1C1E]">No active register is currently selected</p>
                <p className="text-xs text-[#44474E]">Create a new ledger register or populate with system demo data.</p>
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => onSelectView('create_register')}
                  className="bg-[#2196F3] text-white hover:bg-[#1976D2] active:scale-95 text-xs font-bold py-2 px-4 rounded-lg transition-all shadow-xs cursor-pointer"
                >
                  Create Register
                </button>
                {registers.length === 0 && (
                  <button 
                    onClick={onCreateDemo}
                    className="bg-white border border-[#C4C7C8] hover:bg-slate-100 text-[#1A1C1E] text-xs font-bold py-2 px-4 rounded-lg transition-all cursor-pointer"
                  >
                    Load Demo Data
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grid Menu */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-[#44474E] uppercase tracking-wider px-1 font-mono">System Directory</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5">
          {/* Create Register */}
          <button
            onClick={() => onSelectView('create_register')}
            className="flex flex-col items-start p-5 bg-white border border-[#C4C7C8] rounded-xl hover:border-[#2196F3] hover:shadow-xs active:scale-[0.98] transition-all text-left group cursor-pointer"
          >
            <div className="p-3 bg-emerald-50 text-[#2E7D32] rounded-lg mb-4 group-hover:bg-[#E8F5E9] transition-colors">
              <PlusCircle className="w-5 h-5" />
            </div>
            <span className="font-bold text-[#1A1C1E] text-sm block">Create Register</span>
            <span className="text-[11px] text-[#44474E] block mt-1">Start new site ledger</span>
          </button>

          {/* Open Register */}
          <button
            onClick={() => onSelectView('open_register')}
            className="flex flex-col items-start p-5 bg-white border border-[#C4C7C8] rounded-xl hover:border-[#2196F3] hover:shadow-xs active:scale-[0.98] transition-all text-left group cursor-pointer"
          >
            <div className="p-3 bg-sky-50 text-[#0288D1] rounded-lg mb-4 group-hover:bg-[#E1F5FE] transition-colors">
              <FolderOpen className="w-5 h-5" />
            </div>
            <span className="font-bold text-[#1A1C1E] text-sm block">Open Previous</span>
            <span className="text-[11px] text-[#44474E] block mt-1">
              {registers.length} saved registers
            </span>
          </button>

          {/* Workers */}
          <button
            onClick={() => onSelectView('workers')}
            className="flex flex-col items-start p-5 bg-white border border-[#C4C7C8] rounded-xl hover:border-[#2196F3] hover:shadow-xs active:scale-[0.98] transition-all text-left group cursor-pointer"
          >
            <div className="p-3 bg-blue-50 text-[#2196F3] rounded-lg mb-4 group-hover:bg-blue-100 transition-colors">
              <Users className="w-5 h-5" />
            </div>
            <span className="font-bold text-[#1A1C1E] text-sm block">Workers List</span>
            <span className="text-[11px] text-[#44474E] block mt-1">
              {activeWorkersCount} active / {workers.length} total
            </span>
          </button>

          {/* Reports */}
          <button
            onClick={() => onSelectView('reports')}
            className="flex flex-col items-start p-5 bg-white border border-[#C4C7C8] rounded-xl hover:border-[#2196F3] hover:shadow-xs active:scale-[0.98] transition-all text-left group cursor-pointer"
          >
            <div className="p-3 bg-amber-50 text-[#F57C00] rounded-lg mb-4 group-hover:bg-[#FFF3E0] transition-colors">
              <BarChart3 className="w-5 h-5" />
            </div>
            <span className="font-bold text-[#1A1C1E] text-sm block">Reports Summary</span>
            <span className="text-[11px] text-[#44474E] block mt-1">Attendance & OT stats</span>
          </button>

          {/* Monthly Salary Attendance Sheet */}
          <button
            onClick={() => onSelectView('salary_sheet')}
            className="flex flex-col items-start p-5 bg-white border border-[#C4C7C8] rounded-xl hover:border-[#2196F3] hover:shadow-xs active:scale-[0.98] transition-all text-left group cursor-pointer border-l-4 border-l-emerald-500"
          >
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg mb-4 group-hover:bg-emerald-100 transition-colors">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <span className="font-bold text-[#1A1C1E] text-sm block">Salary Attendance Sheet</span>
            <span className="text-[11px] text-[#44474E] block mt-1">Finance & audit summary</span>
          </button>

          {/* Backup */}
          <button
            onClick={() => onSelectView('backup')}
            className="flex flex-col items-start p-5 bg-white border border-[#C4C7C8] rounded-xl hover:border-[#2196F3] hover:shadow-xs active:scale-[0.98] transition-all text-left group cursor-pointer"
          >
            <div className="p-3 bg-violet-50 text-violet-600 rounded-lg mb-4 group-hover:bg-violet-100/50 transition-colors">
              <CloudLightning className="w-5 h-5" />
            </div>
            <span className="font-bold text-[#1A1C1E] text-sm block">Sync & Cloud</span>
            <span className="text-[11px] text-[#44474E] block mt-1">Backup and restore data</span>
          </button>

          {/* Settings */}
          <button
            onClick={() => onSelectView('settings')}
            className="flex flex-col items-start p-5 bg-white border border-[#C4C7C8] rounded-xl hover:border-[#2196F3] hover:shadow-xs active:scale-[0.98] transition-all text-left group cursor-pointer"
          >
            <div className="p-3 bg-slate-100 text-slate-700 rounded-lg mb-4 group-hover:bg-slate-200 transition-colors">
              <SettingsIcon className="w-5 h-5" />
            </div>
            <span className="font-bold text-[#1A1C1E] text-sm block">App Settings</span>
            <span className="text-[11px] text-[#44474E] block mt-1">Designations & PIN lock</span>
          </button>
        </div>
      </div>

      {/* Recent Registers List */}
      {recentRegisters.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold text-[#44474E] uppercase tracking-wider font-mono">Recent Registers</h3>
            <button 
              onClick={() => onSelectView('open_register')}
              className="text-xs text-[#2196F3] hover:text-[#1976D2] font-semibold cursor-pointer"
            >
              See All Registers
            </button>
          </div>
          <div className="space-y-2">
            {recentRegisters.map((reg) => (
              <div 
                key={reg.id}
                onClick={() => onOpenRegister(reg)}
                className="flex items-center justify-between p-4 bg-white border border-[#C4C7C8] rounded-xl cursor-pointer hover:bg-[#F5F7FA] transition-all shadow-xs"
              >
                <div className="space-y-1">
                  <h4 className="font-bold text-[#1A1C1E] text-sm leading-tight">{reg.projectName}</h4>
                  <p className="text-xs text-[#44474E]">
                    {getMonthName(reg.month)} {reg.year} &bull; {reg.companyName}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {activeRegister?.id === reg.id && (
                    <span className="flex items-center space-x-1 px-2 py-0.5 bg-[#E8F5E9] text-[#2E7D32] border border-[#C8E6C9] text-[10px] font-bold rounded-full">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Active</span>
                    </span>
                  )}
                  <FolderOpen className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Archived Registers List */}
      {archivedRegisters.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold text-[#44474E] uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Archive className="w-3.5 h-3.5 text-amber-500" />
              <span>Archived Registers ({archivedRegisters.length})</span>
            </h3>
            <button 
              onClick={() => onSelectView('open_register')}
              className="text-xs text-amber-600 hover:text-amber-800 font-semibold cursor-pointer"
            >
              Manage Archives
            </button>
          </div>
          <div className="space-y-2">
            {archivedRegisters.slice(0, 3).map((reg) => (
              <div 
                key={reg.id}
                onClick={() => onOpenRegister(reg)}
                className="flex items-center justify-between p-4 bg-amber-50/5 border border-amber-200/60 rounded-xl cursor-pointer hover:bg-amber-50/15 hover:border-amber-300 transition-all shadow-xs"
              >
                <div className="space-y-1">
                  <h4 className="font-bold text-[#1A1C1E] text-sm leading-tight">{reg.projectName}</h4>
                  <p className="text-xs text-[#44474E]">
                    {getMonthName(reg.month)} {reg.year} &bull; {reg.companyName}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="flex items-center space-x-0.5 px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 text-[9px] font-bold rounded-full">
                    <span>Archived</span>
                  </span>
                  <FolderOpen className="w-4 h-4 text-amber-500/60" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
