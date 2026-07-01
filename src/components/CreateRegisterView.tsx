/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ChevronLeft, PlusCircle, Calendar, Building, User, LayoutGrid } from 'lucide-react';
import { Register, AppSettings } from '../types';

interface CreateRegisterViewProps {
  settings: AppSettings;
  onAddRegister: (register: Omit<Register, 'id' | 'createdAt'>) => void;
  onBack: () => void;
}

export default function CreateRegisterView({
  settings,
  onAddRegister,
  onBack
}: CreateRegisterViewProps) {
  // Input states prefilled with defaults
  const [companyName, setCompanyName] = useState(settings.companyNameDefault || '');
  const [projectName, setProjectName] = useState('');
  const [supervisorName, setSupervisorName] = useState(settings.supervisorNameDefault || '');
  
  const today = new Date();
  const [month, setMonth] = useState<number>(today.getMonth() + 1);
  const [year, setYear] = useState<number>(today.getFullYear());

  const monthsList = [
    { value: 1, name: 'January' },
    { value: 2, name: 'February' },
    { value: 3, name: 'March' },
    { value: 4, name: 'April' },
    { value: 5, name: 'May' },
    { value: 6, name: 'June' },
    { value: 7, name: 'July' },
    { value: 8, name: 'August' },
    { value: 9, name: 'September' },
    { value: 10, name: 'October' },
    { value: 11, name: 'November' },
    { value: 12, name: 'December' }
  ];

  const yearsList = [
    today.getFullYear() - 1,
    today.getFullYear(),
    today.getFullYear() + 1,
    today.getFullYear() + 2
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !projectName.trim()) {
      alert('Company Name and Site/Project Name are required.');
      return;
    }

    onAddRegister({
      companyName: companyName.trim(),
      projectName: projectName.trim(),
      month,
      year,
      supervisorName: supervisorName.trim() || undefined
    });
  };

  return (
    <div className="space-y-4">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-xl border border-[#C4C7C8] shadow-xs">
        <div className="flex items-center space-x-3">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-[#F5F7FA] active:bg-slate-200 rounded-lg transition-colors border border-[#C4C7C8]"
          >
            <ChevronLeft className="w-4 h-4 text-slate-600" />
          </button>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#44474E]">Ledger Ledger Archive</span>
            <h2 className="font-bold text-[#1A1C1E] text-base leading-tight">Create New Register</h2>
            <p className="text-xs text-[#44474E]">Initialize a new monthly labour attendance register</p>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto bg-white border border-[#C4C7C8] rounded-xl p-6 shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Company Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#44474E] flex items-center">
              <Building className="w-3.5 h-3.5 mr-1 text-[#2196F3]" />
              <span>Company Name *</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Landmark Builders Ltd."
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-[#C4C7C8] rounded-lg text-xs outline-none focus:bg-white focus:border-[#2196F3] transition-all"
            />
          </div>

          {/* Project / Site Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#44474E] flex items-center">
              <LayoutGrid className="w-3.5 h-3.5 mr-1 text-[#2196F3]" />
              <span>Project / Site Name *</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Flyover Project - Section 3"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-[#C4C7C8] rounded-lg text-xs outline-none focus:bg-white focus:border-[#2196F3] transition-all"
            />
          </div>

          {/* Month & Year Selection Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Month Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#44474E] flex items-center">
                <Calendar className="w-3.5 h-3.5 mr-1 text-[#2196F3]" />
                <span>Select Month</span>
              </label>
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-[#C4C7C8] rounded-lg text-xs outline-none focus:bg-white focus:border-[#2196F3] text-slate-700 cursor-pointer"
              >
                {monthsList.map(m => (
                  <option key={m.value} value={m.value}>{m.name}</option>
                ))}
              </select>
            </div>

            {/* Year Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#44474E] flex items-center">
                <Calendar className="w-3.5 h-3.5 mr-1 text-[#2196F3]" />
                <span>Select Year</span>
              </label>
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-[#C4C7C8] rounded-lg text-xs outline-none focus:bg-white focus:border-[#2196F3] text-slate-700 cursor-pointer"
              >
                {yearsList.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Supervisor Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#44474E] flex items-center">
              <User className="w-3.5 h-3.5 mr-1 text-[#2196F3]" />
              <span>Supervisor Name (Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Karan Sharma"
              value={supervisorName}
              onChange={(e) => setSupervisorName(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-[#C4C7C8] rounded-lg text-xs outline-none focus:bg-white focus:border-[#2196F3] transition-all"
            />
          </div>

          <p className="text-[10px] text-slate-400 leading-normal pl-0.5 font-mono">
            * Note: Selecting a unique site name and month/year automatically initializes a custom sheet. Current active workers will automatically appear together in this new register.
          </p>

          <button
            type="submit"
            className="w-full flex items-center justify-center space-x-1.5 py-3 bg-[#2196F3] hover:bg-[#1976D2] active:scale-[0.99] text-white text-xs font-bold rounded-lg transition-all shadow-xs cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Generate Register Sheet</span>
          </button>
        </form>
      </div>
    </div>
  );
}
