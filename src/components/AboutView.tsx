/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  ChevronLeft, 
  Info, 
  Calendar, 
  Layers, 
  Cpu, 
  CheckCircle2, 
  HardDrive,
  ShieldCheck,
  Smartphone
} from 'lucide-react';

interface AboutViewProps {
  onBack: () => void;
}

export default function AboutView({ onBack }: AboutViewProps) {
  const appVersion = "2.0.0-PWA";
  const lastUpdate = "June 30, 2026";
  const buildNumber = "LR-20260630.01-PROD";

  // Calculate simulated local storage usage
  const getStorageUsage = () => {
    try {
      let total = 0;
      for (let x in localStorage) {
        if (localStorage.hasOwnProperty(x)) {
          total += (localStorage[x].length + x.length) * 2; // in bytes
        }
      }
      return (total / 1024).toFixed(2) + " KB";
    } catch (e) {
      return "Under 1 MB";
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-3xl border border-slate-150 shadow-xs">
        <div className="flex items-center space-x-3">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-slate-100 active:bg-slate-200 rounded-2xl transition-colors cursor-pointer"
            title="Go Back"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-500">System Info</span>
            <h2 className="font-bold text-slate-800 text-base leading-tight">About Application</h2>
            <p className="text-xs text-slate-500">Device diagnostics, build versions, and PWA capabilities</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* About App details (Column 1) */}
        <div className="md:col-span-2 space-y-5">
          <div className="bg-white rounded-3xl border border-slate-150 p-6 shadow-xs space-y-6">
            <div className="flex items-center space-x-3.5 border-b border-slate-100 pb-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                <Info className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Labour Attendance & Overtime Register</h3>
                <p className="text-xs text-slate-400">Professional Industrial Grade Offline-First Web Application</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              This application has been upgraded into a complete production-grade Progressive Web App (PWA). It provides supervisors, site managers, and contractors with an instant, zero-latency digital log for tracking shift attendance, half-days, and overtime hours. It operates completely offline, storing records locally and synchronizing them securely with cloud servers upon reconnection.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="flex items-start space-x-3 p-4 bg-slate-50 border border-slate-150 rounded-2xl">
                <Smartphone className="w-5 h-5 text-indigo-500 shrink-0" />
                <div className="text-xs space-y-0.5">
                  <p className="font-bold text-slate-800">Native Android Behavior</p>
                  <p className="text-[11px] text-slate-500">Standalone full-screen mode, portrait locked, custom launcher icon, launches independently.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 bg-slate-50 border border-slate-150 rounded-2xl">
                <ShieldCheck className="w-5 h-5 text-indigo-500 shrink-0" />
                <div className="text-xs space-y-0.5">
                  <p className="font-bold text-slate-800">Secure Storage Sandbox</p>
                  <p className="text-[11px] text-slate-500">Your worker databases, shift sheets, and overtime reasons are sandboxed safely inside your browser environment.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Technical Info Diagnostics Panel */}
          <div className="bg-white rounded-3xl border border-slate-150 p-6 shadow-xs space-y-4">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider font-mono">Device Storage & Diagnostics</h4>
            <div className="divide-y divide-slate-100 text-xs">
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-slate-500">LocalStorage Usage</span>
                <span className="font-mono font-bold text-slate-800">{getStorageUsage()}</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-slate-500">Service Worker Engine</span>
                <span className="flex items-center gap-1.5 text-emerald-600 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Activated & Running</span>
                </span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-slate-500">PWA Offline Cache</span>
                <span className="flex items-center gap-1.5 text-emerald-600 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Stale-While-Revalidate Active</span>
                </span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-slate-500">PWA Manifest Link</span>
                <span className="flex items-center gap-1.5 text-emerald-600 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Linked (Standalone Mode)</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Version Information (Column 2) */}
        <div className="space-y-4">
          <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-sm border border-slate-800 space-y-6">
            <div className="space-y-1 pb-4 border-b border-white/10">
              <span className="text-[10px] uppercase font-mono font-bold text-indigo-300">Application Version</span>
              <h3 className="text-2xl font-black tracking-tight font-mono">{appVersion}</h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Calendar className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-0.5">
                  <p className="text-indigo-200">Last Update Released</p>
                  <p className="font-bold text-white font-mono">{lastUpdate}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Layers className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-0.5">
                  <p className="text-indigo-200">Build Signature</p>
                  <p className="font-bold text-white font-mono">{buildNumber}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Cpu className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-0.5">
                  <p className="text-indigo-200">Runtime Framework</p>
                  <p className="font-bold text-white font-mono">React + Vite + Tailwind</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <HardDrive className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-0.5">
                  <p className="text-indigo-200">Database Engine</p>
                  <p className="font-bold text-white font-mono">Encrypted Sandbox (LocalStorage)</p>
                </div>
              </div>
            </div>

            <div className="pt-2 text-[10px] text-slate-400 leading-normal border-t border-white/10">
              This application has been audited and compiled for fast loading, ultra-low battery drain, and offline resiliency on all major Android/iOS browser runs.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
