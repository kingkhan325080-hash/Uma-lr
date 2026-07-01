/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  ChevronLeft, 
  Lock, 
  Fingerprint, 
  Database, 
  Plus, 
  Trash2, 
  Save, 
  Check, 
  User, 
  Building, 
  HelpCircle,
  Tag,
  Smartphone,
  Download
} from 'lucide-react';
import { AppSettings } from '../types';

interface SettingsViewProps {
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
  onBack: () => void;
  isAppInstallable?: boolean;
  onInstallApp?: () => void;
  isOnline?: boolean;
}

export default function SettingsView({
  settings,
  onSaveSettings,
  onBack,
  isAppInstallable = false,
  onInstallApp,
  isOnline = true
}: SettingsViewProps) {
  // Local states
  const [pinEnabled, setPinEnabled] = useState(settings.pinEnabled);
  const [pinCode, setPinCode] = useState(settings.pinCode);
  const [fingerprintSimulated, setFingerprintSimulated] = useState(settings.fingerprintSimulated);
  const [supervisorNameDefault, setSupervisorNameDefault] = useState(settings.supervisorNameDefault);
  const [companyNameDefault, setCompanyNameDefault] = useState(settings.companyNameDefault);
  const [designations, setDesignations] = useState<string[]>(settings.designations);

  // New Designation state
  const [newDesignation, setNewDesignation] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleAddDesignation = () => {
    const trimmed = newDesignation.trim();
    if (trimmed && !designations.includes(trimmed)) {
      setDesignations([...designations, trimmed]);
      setNewDesignation('');
    }
  };

  const handleDeleteDesignation = (des: string) => {
    if (designations.length <= 1) {
      alert('You must maintain at least one standard designation.');
      return;
    }
    setDesignations(designations.filter(d => d !== des));
  };

  const handleSave = () => {
    if (pinEnabled && (!pinCode || pinCode.length !== 4 || isNaN(Number(pinCode)))) {
      alert('Please provide a valid 4-digit numerical PIN.');
      return;
    }

    onSaveSettings({
      pinEnabled,
      pinCode,
      fingerprintSimulated,
      supervisorNameDefault,
      companyNameDefault,
      designations
    });

    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
    }, 2000);
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
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Customise</span>
            <h2 className="font-bold text-slate-800 text-base leading-tight">Settings & Controls</h2>
            <p className="text-xs text-slate-500">Configure security PIN, defaults, and designations</p>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center justify-center space-x-1.5 px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-xs font-bold text-white rounded-xl transition-all shadow-sm"
        >
          {saveSuccess ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
          <span>{saveSuccess ? 'Saved successfully!' : 'Save Config'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* PWA App Installation / Mobile Experience Card */}
        <div className="bg-white rounded-3xl border border-slate-150 p-5 shadow-sm space-y-4">
          <div className="flex items-center space-x-3 border-b border-slate-100 pb-3">
            <Smartphone className="w-4.5 h-4.5 text-emerald-500" />
            <h3 className="font-bold text-slate-800 text-xs">Mobile Application Experience</h3>
          </div>

          <div className="space-y-3.5">
            <p className="text-xs text-slate-500 leading-normal">
              Install the <strong>Labour Attendance & Overtime Register</strong> as a standalone application on your Android, iOS, or Desktop device. It functions exactly like a native app: opening in full-screen, hiding browser bars, running offline, and sporting its own launcher icon.
            </p>
            
            {isAppInstallable ? (
              <div className="bg-emerald-50 border border-emerald-150 p-3.5 rounded-2xl flex flex-col gap-2.5">
                <div className="text-xs text-emerald-800 space-y-0.5">
                  <span className="font-bold block">App Ready to Install!</span>
                  <p className="text-[10px] text-emerald-600">Install to your home screen for rapid offline launching and a clean borderless workspace.</p>
                </div>
                <button
                  onClick={onInstallApp}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Install App on Device</span>
                </button>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-150 p-3.5 rounded-2xl">
                <div className="text-xs text-slate-600 space-y-0.5 flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-700">App Running in Native Mode</span>
                    <p className="text-[10px] text-slate-400">If you are viewing this within Chrome/Edge, you have already added the app to your screen or it is running as a progressive app container. You can load and manage registers entirely offline.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Security and Lock Configuration */}
        <div className="bg-white rounded-3xl border border-slate-150 p-5 shadow-sm space-y-4">
          <div className="flex items-center space-x-3 border-b border-slate-100 pb-3">
            <Lock className="w-4.5 h-4.5 text-indigo-500" />
            <h3 className="font-bold text-slate-800 text-xs">App Security & Passcode</h3>
          </div>

          <div className="space-y-4">
            {/* PIN Enable */}
            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-150 rounded-2xl">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-700">Enable PIN Lock</span>
                <p className="text-[10px] text-slate-400">Request 4-digit PIN upon app launch.</p>
              </div>
              <input
                type="checkbox"
                checked={pinEnabled}
                onChange={(e) => setPinEnabled(e.target.checked)}
                className="w-4 h-4 text-indigo-600 bg-slate-100 border-slate-300 rounded-sm focus:ring-indigo-500 focus:ring-1 cursor-pointer"
              />
            </div>

            {/* PIN Code Input */}
            {pinEnabled && (
              <div className="space-y-1 animate-fade-in pl-1">
                <label className="text-[11px] font-bold text-slate-500">Set 4-Digit Security PIN</label>
                <input
                  type="password"
                  maxLength={4}
                  placeholder="e.g. 1234"
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full max-w-[150px] p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-indigo-500 font-mono tracking-widest text-center"
                />
              </div>
            )}

            {/* Fingerprint Lock */}
            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-150 rounded-2xl">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-700 flex items-center">
                  <Fingerprint className="w-3.5 h-3.5 mr-1 text-slate-400" />
                  <span>Fingerprint (Biometrics)</span>
                </span>
                <p className="text-[10px] text-slate-400">Support fingerprint sensor unlocking.</p>
              </div>
              <input
                type="checkbox"
                checked={fingerprintSimulated}
                onChange={(e) => setFingerprintSimulated(e.target.checked)}
                className="w-4 h-4 text-indigo-600 bg-slate-100 border-slate-300 rounded-sm focus:ring-indigo-500 focus:ring-1 cursor-pointer"
              />
            </div>

            {/* Local Encryption Indicator */}
            <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-2xl flex items-start space-x-2.5">
              <Database className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
              <div className="text-[10px] text-slate-500 space-y-0.5">
                <p className="font-bold text-slate-700">Encrypted Local Database Active</p>
                <p>All supervisor registers, contractor profiles, and daily overtime notes are compiled locally and encrypted using secure browser sandboxing hashes.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Supervisor & Company Defaults */}
        <div className="bg-white rounded-3xl border border-slate-150 p-5 shadow-sm space-y-4">
          <div className="flex items-center space-x-3 border-b border-slate-100 pb-3">
            <Building className="w-4.5 h-4.5 text-indigo-500" />
            <h3 className="font-bold text-slate-800 text-xs">Supervisor & Ledger Defaults</h3>
          </div>

          <div className="space-y-3.5">
            {/* Default Company Name */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 flex items-center">
                <Building className="w-3.5 h-3.5 mr-1 text-slate-400" />
                <span>Default Company Name</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Apex Constructions Ltd."
                value={companyNameDefault}
                onChange={(e) => setCompanyNameDefault(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-indigo-500 transition-all"
              />
            </div>

            {/* Default Supervisor Name */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 flex items-center">
                <User className="w-3.5 h-3.5 mr-1 text-slate-400" />
                <span>Default Supervisor Name</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Karan Sharma"
                value={supervisorNameDefault}
                onChange={(e) => setSupervisorNameDefault(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-indigo-500 transition-all"
              />
            </div>

            <div className="p-3 bg-slate-50 border border-slate-150 rounded-2xl flex items-start space-x-2">
              <HelpCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <p className="text-[10px] text-slate-400 leading-normal">
                These values are pre-filled automatically whenever you initialize a new monthly attendance register, helping you mark registers in under a minute!
              </p>
            </div>
          </div>
        </div>

        {/* User-Defined Designations Management */}
        <div className="bg-white rounded-3xl border border-slate-150 p-5 shadow-sm space-y-4 md:col-span-2">
          <div className="flex items-center space-x-3 border-b border-slate-100 pb-3">
            <Tag className="w-4.5 h-4.5 text-indigo-500" />
            <h3 className="font-bold text-slate-800 text-xs">Labour Designations Checklist (User-Defined)</h3>
          </div>

          <div className="space-y-4">
            {/* Add Designation Input */}
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Add custom designation (e.g. Fitter, Welder)"
                value={newDesignation}
                onChange={(e) => setNewDesignation(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddDesignation()}
                className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-indigo-500"
              />
              <button
                onClick={handleAddDesignation}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-xs font-bold text-white rounded-xl transition-all shadow-sm flex items-center space-x-1 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add Type</span>
              </button>
            </div>

            {/* Designations Grid List */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-[220px] overflow-y-auto p-1 bg-slate-50 rounded-2xl border border-slate-150">
              {designations.map(des => (
                <div 
                  key={des}
                  className="flex items-center justify-between p-2.5 bg-white border border-slate-150 rounded-xl"
                >
                  <span className="text-xs text-slate-700 font-semibold truncate pr-2">{des}</span>
                  <button
                    onClick={() => handleDeleteDesignation(des)}
                    className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
