/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  CloudLightning, 
  ChevronLeft, 
  Download, 
  Upload, 
  RefreshCw, 
  User, 
  LogOut, 
  CheckCircle, 
  AlertTriangle,
  Lock,
  Wifi,
  CloudCheck
} from 'lucide-react';
import { dbService } from '../utils/db';
import { auth, cloudService } from '../utils/firebase';
import { BackupData } from '../types';

interface BackupRestoreViewProps {
  onBack: () => void;
  onDataRestored: () => void;
}

export default function BackupRestoreView({ onBack, onDataRestored }: BackupRestoreViewProps) {
  // Authentication states
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Backup sync states
  const [syncStatus, setSyncStatus] = useState<string>('');
  const [syncLoading, setSyncLoading] = useState(false);

  // Is cloud active (from firebase config check)
  const isCloudEnabled = cloudService.isEnabled();

  useEffect(() => {
    if (isCloudEnabled && auth) {
      const unsubscribe = auth.onAuthStateChanged((u: any) => {
        setUser(u);
      });
      return unsubscribe;
    }
  }, [isCloudEnabled]);

  // Google Login
  const handleGoogleSignIn = async () => {
    setError('');
    setAuthLoading(true);
    try {
      const signedInUser = await cloudService.signInWithGoogle();
      setUser(signedInUser);
      setSyncStatus('Successfully signed in! Cloud backup is ready.');
    } catch (err: any) {
      console.error('Google login failed:', err);
      setError('Failed to authenticate with Google. Ensure cookies are enabled.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Log Out
  const handleSignOut = async () => {
    setError('');
    setAuthLoading(true);
    try {
      await cloudService.logOut();
      setUser(null);
      setSyncStatus('Signed out successfully.');
    } catch (err) {
      setError('Failed to sign out. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Perform Cloud Backup
  const triggerCloudBackup = async () => {
    if (!user) {
      setError('Please sign in first to execute cloud operations.');
      return;
    }
    setError('');
    setSyncLoading(true);
    setSyncStatus('Pre-processing local register datasets...');
    
    try {
      const data = dbService.getBackupData();
      const success = await cloudService.backupToCloud(data);
      if (success) {
        setSyncStatus('Cloud database backup completed successfully! All registers synced.');
      } else {
        setError('Cloud backup failed. Check connection or authorization rules.');
      }
    } catch (err: any) {
      setError(`Sync failure: ${err.message || err}`);
    } finally {
      setSyncLoading(false);
    }
  };

  // Perform Cloud Restore
  const triggerCloudRestore = async () => {
    if (!user) {
      setError('Please sign in first to restore data.');
      return;
    }
    if (!window.confirm('WARNING: Restoring cloud data will overwrite all current attendance logs on this device. Do you wish to continue?')) {
      return;
    }

    setError('');
    setSyncLoading(true);
    setSyncStatus('Downloading encrypted secure ledger backups...');

    try {
      const cloudData = await cloudService.restoreFromCloud();
      if (cloudData) {
        const success = dbService.restoreBackupData(cloudData);
        if (success) {
          setSyncStatus('Data restored on this phone successfully!');
          onDataRestored();
        } else {
          setError('Failed to format or restore downloaded ledger files.');
        }
      } else {
        setError('No active backup found on cloud for this account.');
      }
    } catch (err: any) {
      setError(`Sync restore failure: ${err.message || err}`);
    } finally {
      setSyncLoading(false);
    }
  };

  // --- MANUAL LOCAL BACKUP ---
  const triggerLocalExport = () => {
    try {
      const data = dbService.getBackupData();
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `Labour_Attendance_Backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setSyncStatus('Local JSON backup exported successfully!');
    } catch (err: any) {
      setError(`Local export failed: ${err.message}`);
    }
  };

  // --- MANUAL LOCAL RESTORE ---
  const handleLocalFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm('WARNING: Importing a backup file will fully replace all current local registers and workers. Proceed?')) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonStr = event.target?.result as string;
        const backupData = JSON.parse(jsonStr) as BackupData;
        
        const success = dbService.restoreBackupData(backupData);
        if (success) {
          setSyncStatus('JSON backup file imported successfully! All records restored.');
          onDataRestored();
        } else {
          setError('Invalid backup format. Ensure you loaded the correct register backup file.');
        }
      } catch (err: any) {
        setError(`Failed to parse backup JSON file: ${err.message}`);
      }
    };
    reader.readAsText(file);
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
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Security</span>
            <h2 className="font-bold text-slate-800 text-base leading-tight">Backup & Restore</h2>
            <p className="text-xs text-slate-500">Secure cloud synch and manual JSON file downloads</p>
          </div>
        </div>
      </div>

      {/* Cloud Synchronisation Portal */}
      <div className="bg-white rounded-3xl border border-slate-150 p-6 shadow-sm space-y-5">
        <div className="flex items-center space-x-3.5 border-b border-slate-100 pb-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
            <CloudLightning className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Secure Cloud Backup</h3>
            <p className="text-xs text-slate-400">Save your records to Google Firebase databases automatically</p>
          </div>
        </div>

        {/* Warning if Firebase not configured */}
        {!isCloudEnabled ? (
          <div className="flex items-start space-x-3 p-4 bg-amber-50 border border-amber-200/50 rounded-2xl">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600 space-y-1">
              <p className="font-bold text-slate-800">Local-Only Register Mode Active</p>
              <p>
                To enable **Google Cloud Backup & Multi-Phone Restore**, please open the Firebase Setup dialog inside Google AI Studio, provision the Firestore database, and save parameters. 
              </p>
              <p className="text-[10px] font-medium text-slate-500">
                Your registers are 100% safe, stored in your device's encrypted local database. You can use manual backups below in the meantime!
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {user ? (
              <div className="space-y-4">
                {/* Logged in Card */}
                <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200/50 rounded-2xl">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                      {user.displayName?.[0] || user.email?.[0] || 'U'}
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <h4 className="font-bold text-slate-800 text-xs truncate">{user.displayName || 'Google Account Connected'}</h4>
                      <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleSignOut}
                    disabled={authLoading}
                    className="flex items-center space-x-1 py-1.5 px-3 bg-white hover:bg-slate-100 text-slate-600 text-xs font-bold rounded-xl border border-slate-200 transition-all shrink-0"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Logout</span>
                  </button>
                </div>

                {/* Cloud action buttons */}
                <div className="grid grid-cols-2 gap-3.5 pt-1">
                  <button
                    onClick={triggerCloudBackup}
                    disabled={syncLoading}
                    className="flex items-center justify-center space-x-1.5 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-2xl transition-all shadow-sm"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Backup Registers</span>
                  </button>
                  <button
                    onClick={triggerCloudRestore}
                    disabled={syncLoading}
                    className="flex items-center justify-center space-x-1.5 py-3 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white text-xs font-bold rounded-2xl transition-all shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    <span>Restore Registers</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-6 bg-slate-50 border border-slate-150 rounded-2xl space-y-4">
                <Lock className="w-8 h-8 text-slate-400" />
                <div className="space-y-1 max-w-xs">
                  <h4 className="font-bold text-slate-800 text-xs">Unlock Cloud Services</h4>
                  <p className="text-[11px] text-slate-400">Sign in with your Google Account to authorize sync with other devices.</p>
                </div>
                <button
                  onClick={handleGoogleSignIn}
                  disabled={authLoading}
                  className="flex items-center space-x-2 py-2.5 px-5 bg-white hover:bg-slate-100 active:scale-95 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-all shadow-sm"
                >
                  {authLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-400" />
                  ) : (
                    <>
                      <User className="w-4 h-4 text-indigo-500" />
                      <span>Continue with Google Account</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Sync loading or status displays */}
        {(syncStatus || error) && (
          <div className="p-3.5 rounded-2xl text-xs space-y-1">
            {syncStatus && (
              <div className="flex items-center space-x-2 text-indigo-800 bg-indigo-50 border border-indigo-100 p-3 rounded-xl">
                <CheckCircle className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>{syncStatus}</span>
              </div>
            )}
            {error && (
              <div className="flex items-center space-x-2 text-rose-800 bg-rose-50 border border-rose-100 p-3 rounded-xl">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Manual JSON Backups Panel */}
      <div className="bg-white rounded-3xl border border-slate-150 p-6 shadow-sm space-y-5">
        <div className="flex items-center space-x-3.5 border-b border-slate-100 pb-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <Download className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Manual Ledger Backup</h3>
            <p className="text-xs text-slate-400">Save and load registers locally using files (.json)</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Export card */}
          <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl flex flex-col justify-between space-y-3">
            <div className="space-y-1">
              <h4 className="font-bold text-slate-800 text-xs">Export Local Backup</h4>
              <p className="text-[10px] text-slate-400">Download a complete encrypted database dump as a single JSON file. You can email this file to your office or save it.</p>
            </div>
            <button
              onClick={triggerLocalExport}
              className="w-full flex items-center justify-center space-x-2 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Backup File</span>
            </button>
          </div>

          {/* Import card */}
          <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl flex flex-col justify-between space-y-3">
            <div className="space-y-1">
              <h4 className="font-bold text-slate-800 text-xs">Import Register Backup</h4>
              <p className="text-[10px] text-slate-400">Upload and restore a previously saved ledger file. This will fully replace the active datasets on this phone.</p>
            </div>
            <div className="relative">
              <input
                type="file"
                accept=".json"
                onChange={handleLocalFileImport}
                className="hidden"
                id="local-restore-upload"
              />
              <label
                htmlFor="local-restore-upload"
                className="w-full flex items-center justify-center space-x-2 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl cursor-pointer transition-all shadow-sm"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Backup File</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Offline capabilities notice */}
      <div className="bg-indigo-900 text-white rounded-3xl p-5 shadow-sm space-y-2.5 flex items-start space-x-3 border border-indigo-950">
        <Wifi className="w-5 h-5 text-indigo-300 shrink-0 mt-0.5 animate-pulse" />
        <div className="text-xs space-y-0.5 text-indigo-100">
          <p className="font-bold text-white flex items-center">
            <CloudCheck className="w-4 h-4 mr-1.5 text-indigo-300" />
            <span>100% Offline Attendance Ledger</span>
          </p>
          <p>
            This register works completely offline! Tapping attendance status, marking overtimes, creating new sites, or exporting PDFs and Excel lists does not require internet connection.
          </p>
          <p className="text-[10px] text-indigo-300 font-medium">
            Once internet is restored or manual cloud backup is hit, your local registers automatically synchronize!
          </p>
        </div>
      </div>
    </div>
  );
}
