/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  FolderOpen, 
  Trash2, 
  Calendar, 
  CheckCircle2, 
  User, 
  Building, 
  MoreVertical, 
  Archive, 
  Copy, 
  Edit2, 
  Search, 
  Info, 
  X, 
  AlertTriangle 
} from 'lucide-react';
import { Register } from '../types';
import { getMonthName } from '../utils/export';

interface OpenRegisterViewProps {
  registers: Register[];
  activeRegister: Register | null;
  onOpenRegister: (register: Register) => void;
  onDeleteRegister: (id: string) => void;
  onArchiveRegister: (id: string, archive: boolean) => void;
  onRenameRegister: (id: string, newProjectName: string, newCompanyName: string) => void;
  onDuplicateRegister: (id: string, newProjectName: string, newCompanyName: string) => void;
  onBack: () => void;
}

export default function OpenRegisterView({
  registers,
  activeRegister,
  onOpenRegister,
  onDeleteRegister,
  onArchiveRegister,
  onRenameRegister,
  onDuplicateRegister,
  onBack
}: OpenRegisterViewProps) {
  const [subView, setSubView] = useState<'active' | 'archived'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  
  // States for modals
  const [activeMenuRegisterId, setActiveMenuRegisterId] = useState<string | null>(null);
  const [registerToRename, setRegisterToRename] = useState<Register | null>(null);
  const [renameProjectName, setRenameProjectName] = useState('');
  const [renameCompanyName, setRenameCompanyName] = useState('');

  const [registerToDuplicate, setRegisterToDuplicate] = useState<Register | null>(null);
  const [duplicateProjectName, setDuplicateProjectName] = useState('');
  const [duplicateCompanyName, setDuplicateCompanyName] = useState('');

  const [registerToDelete, setRegisterToDelete] = useState<Register | null>(null);

  // Separate active and archived registers
  const activeCount = useMemo(() => registers.filter(r => !r.isArchived).length, [registers]);
  const archivedCount = useMemo(() => registers.filter(r => !!r.isArchived).length, [registers]);

  // Filtered registers by active tab and search query
  const filteredRegisters = useMemo(() => {
    return registers.filter(reg => {
      // Archive filter
      const matchesArchive = subView === 'archived' ? !!reg.isArchived : !reg.isArchived;
      if (!matchesArchive) return false;

      if (!searchQuery) return true;

      const query = searchQuery.toLowerCase();
      const matchesProject = reg.projectName.toLowerCase().includes(query);
      const matchesCompany = reg.companyName.toLowerCase().includes(query);
      const matchesMonth = getMonthName(reg.month).toLowerCase().includes(query);
      const matchesYear = String(reg.year).includes(query);

      return matchesProject || matchesCompany || matchesMonth || matchesYear;
    });
  }, [registers, subView, searchQuery]);

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerToRename || !renameProjectName.trim() || !renameCompanyName.trim()) return;
    onRenameRegister(registerToRename.id, renameProjectName.trim(), renameCompanyName.trim());
    setRegisterToRename(null);
  };

  const handleDuplicateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerToDuplicate || !duplicateProjectName.trim() || !duplicateCompanyName.trim()) return;
    onDuplicateRegister(registerToDuplicate.id, duplicateProjectName.trim(), duplicateCompanyName.trim());
    setRegisterToDuplicate(null);
  };

  const handleDeleteConfirm = () => {
    if (!registerToDelete) return;
    onDeleteRegister(registerToDelete.id);
    setRegisterToDelete(null);
  };

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-3xl border border-slate-150 shadow-xs">
        <div className="flex items-center space-x-3">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-slate-100 active:bg-slate-200 rounded-2xl transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Database & Register Control</span>
            <h2 className="font-bold text-slate-800 text-base leading-tight">Registers Registry</h2>
            <p className="text-xs text-slate-500">Access, duplicate, rename, archive, or delete site registers</p>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs and Search */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex bg-slate-100 p-1 rounded-2xl w-full md:w-auto shadow-inner">
          <button
            onClick={() => { setSubView('active'); setSearchQuery(''); }}
            className={`flex-1 md:flex-none px-6 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              subView === 'active'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Active Registers ({activeCount})
          </button>
          <button
            onClick={() => { setSubView('archived'); setSearchQuery(''); }}
            className={`flex-1 md:flex-none px-6 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              subView === 'archived'
                ? 'bg-white text-amber-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Archived Registers ({archivedCount})
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Company, Site, Month, Year..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-2xl text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 transition-all shadow-xs"
          />
        </div>
      </div>

      {/* Register List Grid */}
      {filteredRegisters.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-150 rounded-3xl shadow-sm space-y-2">
          <FolderOpen className="w-10 h-10 mx-auto text-slate-300 animate-pulse" />
          <p className="text-sm font-bold text-slate-800">No registers found</p>
          <p className="text-xs text-slate-400">
            {searchQuery 
              ? `No ${subView} registers match the search "${searchQuery}".` 
              : subView === 'archived' 
                ? 'No archived registers. You can archive any active register from its dropdown menu.' 
                : 'Start by creating a new register from the Home Screen menu.'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRegisters.map((reg) => {
            const isActive = activeRegister?.id === reg.id;
            return (
              <div
                key={reg.id}
                onClick={() => onOpenRegister(reg)}
                className={`flex flex-col justify-between p-5 rounded-3xl border cursor-pointer transition-all hover:shadow-md active:scale-[0.99] bg-white relative ${
                  isActive 
                    ? 'border-indigo-500 ring-1 ring-indigo-500/25 shadow-xs' 
                    : reg.isArchived 
                      ? 'border-amber-200 hover:border-amber-300 bg-amber-50/5'
                      : 'border-slate-150 hover:border-slate-300'
                }`}
              >
                <div className="space-y-3">
                  {/* Header and Three-Dot Option Menu */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 min-w-0 pr-6">
                      <h3 className="font-bold text-slate-800 text-sm md:text-base leading-tight truncate">
                        {reg.projectName}
                      </h3>
                      <p className="text-[10px] uppercase font-bold text-slate-400 flex items-center tracking-wide">
                        <Calendar className="w-3.5 h-3.5 mr-1 text-indigo-500" />
                        {getMonthName(reg.month)} {reg.year}
                      </p>
                    </div>

                    <div className="flex items-center space-x-1 shrink-0">
                      {isActive && (
                        <span className="flex items-center space-x-1 px-2 py-0.5 bg-[#E8F5E9] text-[#2E7D32] border border-[#C8E6C9] text-[9px] font-bold rounded-full mr-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Active</span>
                        </span>
                      )}
                      {reg.isArchived && (
                        <span className="flex items-center space-x-1 px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 text-[9px] font-bold rounded-full mr-1">
                          <Archive className="w-3 h-3" />
                          <span>Archived</span>
                        </span>
                      )}

                      {/* Dropdown Action Trigger */}
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuRegisterId(activeMenuRegisterId === reg.id ? null : reg.id);
                          }}
                          className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-700 cursor-pointer"
                          title="Register Options"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        
                        {activeMenuRegisterId === reg.id && (
                          <>
                            {/* Tap backdrop to dismiss menu */}
                            <div 
                              className="fixed inset-0 z-25" 
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuRegisterId(null);
                              }}
                            />
                            <div 
                              className="absolute right-0 mt-1 w-48 bg-white border border-slate-200 rounded-2xl shadow-lg py-1 z-30 animate-fade-in"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={() => {
                                  setActiveMenuRegisterId(null);
                                  onOpenRegister(reg);
                                }}
                                className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center space-x-2 cursor-pointer"
                              >
                                <FolderOpen className="w-3.5 h-3.5 text-slate-400" />
                                <span>{reg.isArchived ? 'View Register' : 'Open Register'}</span>
                              </button>
                              
                              <button
                                onClick={() => {
                                  setActiveMenuRegisterId(null);
                                  setRegisterToRename(reg);
                                  setRenameProjectName(reg.projectName);
                                  setRenameCompanyName(reg.companyName);
                                }}
                                className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center space-x-2 cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                                <span>Rename Register</span>
                              </button>
                              
                              <button
                                onClick={() => {
                                  setActiveMenuRegisterId(null);
                                  setRegisterToDuplicate(reg);
                                  setDuplicateProjectName(`${reg.projectName} (Copy)`);
                                  setDuplicateCompanyName(reg.companyName);
                                }}
                                className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center space-x-2 cursor-pointer"
                              >
                                <Copy className="w-3.5 h-3.5 text-slate-400" />
                                <span>Duplicate Register</span>
                              </button>
                              
                              <button
                                onClick={() => {
                                  setActiveMenuRegisterId(null);
                                  onArchiveRegister(reg.id, !reg.isArchived);
                                }}
                                className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center space-x-2 cursor-pointer"
                              >
                                <Archive className="w-3.5 h-3.5 text-slate-400" />
                                <span>{reg.isArchived ? 'Restore Archive' : 'Archive Register'}</span>
                              </button>
                              
                              <div className="border-t border-slate-100 my-1" />
                              
                              <button
                                onClick={() => {
                                  setActiveMenuRegisterId(null);
                                  setRegisterToDelete(reg);
                                }}
                                className="w-full text-left px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center space-x-2 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                <span>Delete Register</span>
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Details Block */}
                  <div className="space-y-1.5 text-xs text-slate-500">
                    <div className="flex items-center space-x-1.5">
                      <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{reg.companyName}</span>
                    </div>
                    {reg.supervisorName && (
                      <div className="flex items-center space-x-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">Supervisor: {reg.supervisorName}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom interactive link */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-3.5 mt-4">
                  <span className="text-[10px] font-bold text-indigo-600 group-hover:underline">
                    {isActive 
                      ? 'Active: Currently editing in Ledger →' 
                      : reg.isArchived 
                        ? 'Archived: Click to open (Read-only) →' 
                        : 'Click to select and open ledger →'
                    }
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* RENAME REGISTER DIALOG MODAL */}
      {registerToRename && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-150 shadow-2xl p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-base">Rename Register</h3>
              <button 
                onClick={() => setRegisterToRename(null)}
                className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleRenameSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wide">Company Name</label>
                <input
                  type="text"
                  required
                  value={renameCompanyName}
                  onChange={(e) => setRenameCompanyName(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500 focus:bg-white transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wide">Project / Site Name</label>
                <input
                  type="text"
                  required
                  value={renameProjectName}
                  onChange={(e) => setRenameProjectName(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500 focus:bg-white transition-all"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2 justify-end">
                <button
                  type="button"
                  onClick={() => setRegisterToRename(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DUPLICATE REGISTER DIALOG MODAL */}
      {registerToDuplicate && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-150 shadow-2xl p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="space-y-0.5">
                <h3 className="font-bold text-slate-800 text-base">Duplicate Register</h3>
                <p className="text-[10px] text-slate-400 font-medium">Source: {getMonthName(registerToDuplicate.month)} {registerToDuplicate.year}</p>
              </div>
              <button 
                onClick={() => setRegisterToDuplicate(null)}
                className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-blue-50/70 border border-blue-100 text-blue-900 rounded-xl p-3 flex items-start space-x-2 text-xs">
              <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-blue-800 leading-normal">
                This will create a new register copying all <strong>worker rosters and active settings</strong>. Individual attendance logs and overtime records will start empty.
              </p>
            </div>
            
            <form onSubmit={handleDuplicateSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wide">New Company Name</label>
                <input
                  type="text"
                  required
                  value={duplicateCompanyName}
                  onChange={(e) => setDuplicateCompanyName(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500 focus:bg-white transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wide">New Project / Site Name</label>
                <input
                  type="text"
                  required
                  value={duplicateProjectName}
                  onChange={(e) => setDuplicateProjectName(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500 focus:bg-white transition-all"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2 justify-end">
                <button
                  type="button"
                  onClick={() => setRegisterToDuplicate(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs cursor-pointer"
                >
                  Duplicate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PERMANENT DELETE CONFIRMATION MODAL */}
      {registerToDelete && (
        <div className="fixed inset-0 bg-rose-950/20 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl border border-rose-100 shadow-2xl p-6 w-full max-w-md space-y-4">
            <div className="flex items-start space-x-3 text-rose-600">
              <div className="p-2 bg-rose-50 rounded-2xl shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-800 text-base leading-tight">Delete Register permanently?</h3>
                <p className="text-xs text-slate-500">This action cannot be undone.</p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-3.5 space-y-1 text-xs text-slate-600">
              <p className="font-bold text-slate-800">You are deleting:</p>
              <p className="font-medium text-slate-700">{registerToDelete.projectName}</p>
              <p className="text-[11px] text-slate-500">{registerToDelete.companyName} &bull; {getMonthName(registerToDelete.month)} {registerToDelete.year}</p>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Permanently deleting this register will erase all of its worker rosters, attendance logs, overtime hours, and reason summaries. This data will be unrecoverable.
            </p>

            <div className="flex items-center space-x-2 pt-2 justify-end">
              <button
                onClick={() => setRegisterToDelete(null)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
