/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  Check, 
  X, 
  Edit2, 
  Plus, 
  CheckCircle,
  ToggleLeft,
  ToggleRight,
  ChevronLeft
} from 'lucide-react';
import { Worker, AppSettings } from '../types';

interface WorkerManagementProps {
  workers: Worker[];
  settings: AppSettings;
  onAddWorker: (worker: Omit<Worker, 'id' | 'createdAt'>) => void;
  onUpdateWorker: (id: string, updatedFields: Partial<Omit<Worker, 'id' | 'createdAt'>>) => void;
  onBack: () => void;
}

export default function WorkerManagement({
  workers,
  settings,
  onAddWorker,
  onUpdateWorker,
  onBack
}: WorkerManagementProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [designationFilter, setDesignationFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All'); // All, Active, Inactive

  // Worker Creation / Editing Form Modal State
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingWorkerId, setEditingWorkerId] = useState<string | null>(null);
  
  // Form input fields
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [designation, setDesignation] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [customDesignation, setCustomDesignation] = useState('');
  const [showCustomDesField, setShowCustomDesField] = useState(false);

  // Available designations
  const availableDesignations = settings.designations;

  // Filtered workers list
  const filteredWorkers = useMemo(() => {
    return workers.filter(w => {
      const matchesSearch = w.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (w.mobile && w.mobile.includes(searchQuery));
      const matchesDesignation = designationFilter === 'All' || w.designation === designationFilter;
      const matchesStatus = statusFilter === 'All' || 
                            (statusFilter === 'Active' && w.isActive) || 
                            (statusFilter === 'Inactive' && !w.isActive);
      return matchesSearch && matchesDesignation && matchesStatus;
    });
  }, [workers, searchQuery, designationFilter, statusFilter]);

  const openAddModal = () => {
    setEditingWorkerId(null);
    setName('');
    setMobile('');
    setDesignation(availableDesignations[0] || '');
    setIsActive(true);
    setCustomDesignation('');
    setShowCustomDesField(false);
    setShowFormModal(true);
  };

  const openEditModal = (worker: Worker) => {
    setEditingWorkerId(worker.id);
    setName(worker.name);
    setMobile(worker.mobile || '');
    setDesignation(worker.designation);
    setIsActive(worker.isActive);
    setCustomDesignation('');
    setShowCustomDesField(false);
    setShowFormModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const finalDesignation = showCustomDesField && customDesignation.trim() 
      ? customDesignation.trim() 
      : designation;

    if (editingWorkerId) {
      onUpdateWorker(editingWorkerId, {
        name: name.trim(),
        mobile: mobile.trim() || undefined,
        designation: finalDesignation,
        isActive
      });
    } else {
      onAddWorker({
        name: name.trim(),
        mobile: mobile.trim() || undefined,
        designation: finalDesignation,
        isActive
      });
    }

    setShowFormModal(false);
  };

  const toggleWorkerStatus = (worker: Worker) => {
    onUpdateWorker(worker.id, { isActive: !worker.isActive });
  };

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
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Database</span>
            <h2 className="font-bold text-slate-800 text-base leading-tight">Worker Directory</h2>
            <p className="text-xs text-slate-500">Manage site personnel ({workers.length} registered)</p>
          </div>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center justify-center space-x-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-xs font-bold text-white rounded-xl transition-all shadow-sm"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Worker</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 bg-white p-3 rounded-2xl border border-slate-150 shadow-xs">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by worker name or mobile..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-indigo-500 outline-none transition-all"
          />
        </div>

        {/* Designation Filter */}
        <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-xl px-2">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={designationFilter}
            onChange={(e) => setDesignationFilter(e.target.value)}
            className="w-full bg-transparent border-none text-xs py-2 outline-none text-slate-600 cursor-pointer"
          >
            <option value="All">All Designations</option>
            {availableDesignations.map(des => (
              <option key={des} value={des}>{des}</option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-xl px-2">
          <CheckCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-transparent border-none text-xs py-2 outline-none text-slate-600 cursor-pointer"
          >
            <option value="All">All Workers</option>
            <option value="Active">Active Only</option>
            <option value="Inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Workers Cards / Table */}
      <div className="bg-white rounded-3xl border border-slate-150 shadow-md overflow-hidden">
        {filteredWorkers.length === 0 ? (
          <div className="text-center py-16 text-slate-400 space-y-2">
            <Users className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-sm font-semibold">No workers found</p>
            <p className="text-xs">Adjust your search or filter to view results, or add a new worker.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredWorkers.map((worker) => (
              <div 
                key={worker.id}
                className={`flex items-center justify-between p-4 transition-colors hover:bg-slate-50/40 ${!worker.isActive ? 'bg-slate-50/50' : ''}`}
              >
                <div className="flex items-center space-x-3.5 min-w-0">
                  {/* Initials Avatar */}
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs shrink-0 select-none ${
                    worker.isActive 
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' 
                      : 'bg-slate-200 text-slate-500 border border-slate-300'
                  }`}>
                    {worker.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() || 'W'}
                  </div>

                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <h4 className={`font-bold text-sm truncate ${worker.isActive ? 'text-slate-800' : 'text-slate-400 line-through'}`}>
                        {worker.name}
                      </h4>
                      {!worker.isActive && (
                        <span className="px-2 py-0.5 bg-rose-50 text-rose-600 border border-rose-100 text-[8px] font-bold rounded-full uppercase tracking-wider">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 flex items-center">
                      <span className="font-semibold text-slate-600 bg-slate-100 py-0.5 px-2 rounded-full text-[10px] mr-2">
                        {worker.designation}
                      </span>
                      {worker.mobile || 'No Mobile Number'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  {/* Active Toggle Switch */}
                  <button
                    onClick={() => toggleWorkerStatus(worker)}
                    className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors"
                    title={worker.isActive ? 'Deactivate Worker' : 'Activate Worker'}
                  >
                    {worker.isActive ? (
                      <ToggleRight className="w-6 h-6 text-indigo-600" />
                    ) : (
                      <ToggleLeft className="w-6 h-6 text-slate-400" />
                    )}
                  </button>

                  {/* Edit button */}
                  <button
                    onClick={() => openEditModal(worker)}
                    className="p-2 hover:bg-slate-100 text-slate-500 rounded-xl transition-colors"
                    title="Edit Worker"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form Dialog Modal */}
      {showFormModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form 
            onSubmit={handleSubmit}
            className="bg-white rounded-3xl w-full max-w-sm border border-slate-150 shadow-xl overflow-hidden animate-scale-in"
          >
            {/* Modal Header */}
            <div className="bg-slate-50 border-b border-slate-150 p-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">
                  {editingWorkerId ? 'Edit Worker Profile' : 'Add New Worker'}
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Maintain records of active supervisors and general site workers.
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setShowFormModal(false)}
                className="text-xs font-bold text-slate-400 hover:text-slate-600 py-1 px-3 bg-slate-200/50 hover:bg-slate-200/80 rounded-full transition-colors"
              >
                Cancel
              </button>
            </div>

            {/* Modal Form Fields */}
            <div className="p-5 space-y-4">
              {/* Worker Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Enter worker's full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-indigo-500 transition-all"
                />
              </div>

              {/* Mobile Number */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Mobile Number (Optional)</label>
                <input
                  type="tel"
                  placeholder="e.g. +91 98765 43210"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-indigo-500 transition-all font-mono"
                />
              </div>

              {/* Designation Selector */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-500">Designation</label>
                  <button
                    type="button"
                    onClick={() => setShowCustomDesField(!showCustomDesField)}
                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800"
                  >
                    {showCustomDesField ? 'Choose Standard' : '+ Add Custom'}
                  </button>
                </div>

                {!showCustomDesField ? (
                  <select
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-indigo-500 transition-all text-slate-700 cursor-pointer"
                  >
                    {availableDesignations.map(des => (
                      <option key={des} value={des}>{des}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    placeholder="Enter custom designation (e.g. Supervisor)"
                    value={customDesignation}
                    onChange={(e) => setCustomDesignation(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-indigo-500 transition-all"
                  />
                )}
              </div>

              {/* Is Active Toggle */}
              {editingWorkerId && (
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-150">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-700">Active Status</span>
                    <p className="text-[10px] text-slate-400">Inactive workers won't appear in bulk operations.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsActive(!isActive)}
                    className="p-1 rounded-lg hover:bg-slate-200"
                  >
                    {isActive ? (
                      <ToggleRight className="w-8 h-8 text-indigo-600" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-slate-400" />
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-150 flex space-x-2">
              <button
                type="submit"
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center space-x-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{editingWorkerId ? 'Save Changes' : 'Register Worker'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
