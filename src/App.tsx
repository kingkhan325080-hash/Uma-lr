/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Users, 
  BarChart3, 
  CloudLightning, 
  Settings as SettingsIcon,
  Home,
  CheckCircle2,
  FolderOpen,
  FileSpreadsheet,
  Info,
  Smartphone,
  Download,
  WifiOff,
  Check
} from 'lucide-react';
import { Register, Worker, AttendanceRecord, OvertimeRecord, AppSettings } from './types';
import { dbService } from './utils/db';
import { auth, cloudService } from './utils/firebase';

// Component Imports
import SecurityLock from './components/SecurityLock';
import HomeView from './components/HomeView';
import RegisterView from './components/RegisterView';
import WorkerManagement from './components/WorkerManagement';
import ReportsView from './components/ReportsView';
import SalaryAttendanceSheetView from './components/SalaryAttendanceSheetView';
import BackupRestoreView from './components/BackupRestoreView';
import SettingsView from './components/SettingsView';
import CreateRegisterView from './components/CreateRegisterView';
import OpenRegisterView from './components/OpenRegisterView';
import AboutView from './components/AboutView';

export default function App() {
  // Navigation states
  const [currentView, setCurrentView] = useState<string>('home');
  const [isLocked, setIsLocked] = useState<boolean>(true);

  // App core database states
  const [registers, setRegisters] = useState<Register[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [overtime, setOvertime] = useState<OvertimeRecord[]>([]);
  const [settings, setSettings] = useState<AppSettings>(dbService.getSettings());

  // Active viewing/editing register
  const [activeRegister, setActiveRegister] = useState<Register | null>(null);

  // PWA, offline sync, and update states
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [syncNotification, setSyncNotification] = useState<string>('');
  const [isAppInstallable, setIsAppInstallable] = useState<boolean>(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isAppInstalled, setIsAppInstalled] = useState<boolean>(false);
  const [updateAvailable, setUpdateAvailable] = useState<boolean>(false);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const isCloudEnabled = cloudService.isEnabled();

  // Subscribe to Firebase Auth state
  useEffect(() => {
    if (isCloudEnabled && auth) {
      const unsubscribe = auth.onAuthStateChanged((u: any) => {
        setCurrentUser(u);
      });
      return unsubscribe;
    }
  }, [isCloudEnabled]);

  // Handle Online/Offline and auto synchronization
  const triggerAutoSync = async (userToSync = currentUser) => {
    if (!navigator.onLine || !isCloudEnabled || !userToSync) return;
    try {
      const data = dbService.getBackupData();
      const success = await cloudService.backupToCloud(data);
      if (success) {
        setSyncNotification('Data Synced Successfully');
        setTimeout(() => setSyncNotification(''), 4000);
      }
    } catch (e) {
      console.error('PWA Auto Sync failed:', e);
    }
  };

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      triggerAutoSync();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [currentUser]);

  // Auto-sync local modifications
  useEffect(() => {
    if (registers.length > 0) {
      triggerAutoSync();
    }
  }, [registers, workers, attendance, overtime]);

  // Service Worker Registration and Update listener
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => {
          setSwRegistration(reg);

          if (reg.waiting) {
            setUpdateAvailable(true);
          }

          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setUpdateAvailable(true);
                }
              });
            }
          });
        })
        .catch((err) => {
          console.error('PWA Service Worker registration failed:', err);
        });
    }
  }, []);

  // Handle App Install Prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsAppInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone) {
      setIsAppInstalled(true);
    }

    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setIsAppInstallable(false);
      setDeferredPrompt(null);
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`PWA Installation outcome: ${outcome}`);
    setDeferredPrompt(null);
    setIsAppInstallable(false);
  };

  const handleUpdateApp = () => {
    if (swRegistration && swRegistration.waiting) {
      swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
  };

  // Load datasets on mount
  useEffect(() => {
    loadAllData();
    const currentSettings = dbService.getSettings();
    setSettings(currentSettings);
    
    // Lock the app if PIN is enabled
    setIsLocked(currentSettings.pinEnabled);
  }, []);

  const loadAllData = () => {
    const regs = dbService.getRegisters();
    const wrks = dbService.getWorkers();
    const atts = dbService.getAttendance();
    const ots = dbService.getOvertime();
    
    setRegisters(regs);
    setWorkers(wrks);
    setAttendance(atts);
    setOvertime(ots);

    // Auto-set the most recent active register as active if none is selected
    if (regs.length > 0 && !activeRegister) {
      const activeRegs = regs.filter(r => !r.isArchived);
      if (activeRegs.length > 0) {
        setActiveRegister(activeRegs[0]);
      } else {
        setActiveRegister(regs[0]);
      }
    }
  };

  // --- ACTIONS ---

  // Create Register
  const handleAddRegister = (newReg: Omit<Register, 'id' | 'createdAt'>) => {
    const created = dbService.addRegister(newReg);
    setActiveRegister(created);
    loadAllData();
    setCurrentView('register'); // Go straight to the grid!
  };

  // Delete Register
  const handleDeleteRegister = (id: string) => {
    dbService.deleteRegister(id);
    
    // Load fresh data
    const regs = dbService.getRegisters();
    setRegisters(regs);
    const wrks = dbService.getWorkers();
    setWorkers(wrks);
    const atts = dbService.getAttendance();
    setAttendance(atts);
    const ots = dbService.getOvertime();
    setOvertime(ots);

    // If activeRegister was deleted, set it to null or another register
    if (activeRegister?.id === id) {
      const remainingActive = regs.filter(r => !r.isArchived);
      if (remainingActive.length > 0) {
        setActiveRegister(remainingActive[0]);
      } else if (regs.length > 0) {
        setActiveRegister(regs[0]);
      } else {
        setActiveRegister(null);
        // Requirement 8: If only one register exists and it is deleted, automatically return the user to the Home Screen without any errors.
        setCurrentView('home');
      }
    }
  };

  // Archive / Restore Register
  const handleArchiveRegister = (id: string, archive: boolean) => {
    dbService.archiveRegister(id, archive);
    
    const regs = dbService.getRegisters();
    setRegisters(regs);

    // If active register is archived, assign another active register
    if (archive && activeRegister?.id === id) {
      const remainingActive = regs.filter(r => !r.isArchived);
      if (remainingActive.length > 0) {
        setActiveRegister(remainingActive[0]);
      } else {
        setActiveRegister(null);
      }
    } else if (!archive && !activeRegister) {
      // If we are restoring and currently no register is active, set restored as active
      const restored = regs.find(r => r.id === id);
      if (restored) {
        setActiveRegister(restored);
      }
    }
    loadAllData();
  };

  // Rename Register
  const handleRenameRegister = (id: string, newProjectName: string, newCompanyName: string) => {
    dbService.renameRegister(id, newProjectName, newCompanyName);
    
    const regs = dbService.getRegisters();
    setRegisters(regs);

    if (activeRegister?.id === id) {
      const updated = regs.find(r => r.id === id);
      if (updated) {
        setActiveRegister(updated);
      }
    }
    loadAllData();
  };

  // Duplicate Register
  const handleDuplicateRegister = (id: string, newProjectName: string, newCompanyName: string) => {
    const duplicated = dbService.duplicateRegister(id, newProjectName, newCompanyName);
    
    const regs = dbService.getRegisters();
    setRegisters(regs);

    if (duplicated) {
      setActiveRegister(duplicated);
      loadAllData();
      setCurrentView('register'); // Go to the duplicated register
    } else {
      loadAllData();
    }
  };

  // Add Worker
  const handleAddWorker = (newWorker: Omit<Worker, 'id' | 'createdAt'>) => {
    dbService.addWorker(newWorker);
    loadAllData();
  };

  // Update Worker
  const handleUpdateWorker = (id: string, updatedFields: Partial<Omit<Worker, 'id' | 'createdAt'>>) => {
    dbService.updateWorker(id, updatedFields);
    loadAllData();
  };

  // Mark Attendance
  const handleMarkAttendance = (workerId: string, date: string, status: AttendanceRecord['status']) => {
    if (!activeRegister) return;
    dbService.markAttendance(activeRegister.id, workerId, date, status);
    loadAllData();
  };

  // Bulk Mark Present
  const handleBulkMarkPresent = (date: string, workerIds: string[]) => {
    if (!activeRegister) return;
    dbService.bulkMarkPresent(activeRegister.id, date, workerIds);
    loadAllData();
  };

  // Save Overtime
  const handleSaveOvertime = (workerId: string, date: string, hours: number, reason?: string) => {
    if (!activeRegister) return;
    dbService.saveOvertimeRecord(activeRegister.id, workerId, date, hours, reason);
    loadAllData();
  };

  // Save Application Settings
  const handleSaveSettings = (newSettings: AppSettings) => {
    dbService.saveSettings(newSettings);
    setSettings(newSettings);
    loadAllData();
  };

  // Load Demo Data Shortcut
  const handleLoadDemo = () => {
    dbService.loadDemoData();
    loadAllData();
    const regs = dbService.getRegisters();
    if (regs.length > 0) {
      setActiveRegister(regs[0]);
    }
  };

  // Handle data restored from cloud/local file
  const handleDataRestored = () => {
    loadAllData();
    const currentSettings = dbService.getSettings();
    setSettings(currentSettings);
  };

  // Navigation shortcut
  const openRegisterLedger = (reg: Register) => {
    setActiveRegister(reg);
    setCurrentView('register');
  };

  // Render correct panel
  const renderMainContent = () => {
    switch (currentView) {
      case 'home':
        return (
          <HomeView
            registers={registers}
            workers={workers}
            activeRegister={activeRegister}
            onSelectView={setCurrentView}
            onOpenRegister={openRegisterLedger}
            onCreateDemo={handleLoadDemo}
            isAppInstallable={isAppInstallable}
            onInstallApp={handleInstallApp}
            isOnline={isOnline}
          />
        );
      case 'create_register':
        return (
          <CreateRegisterView
            settings={settings}
            onAddRegister={handleAddRegister}
            onBack={() => setCurrentView('home')}
          />
        );
      case 'open_register':
        return (
          <OpenRegisterView
            registers={registers}
            activeRegister={activeRegister}
            onOpenRegister={openRegisterLedger}
            onDeleteRegister={handleDeleteRegister}
            onArchiveRegister={handleArchiveRegister}
            onRenameRegister={handleRenameRegister}
            onDuplicateRegister={handleDuplicateRegister}
            onBack={() => setCurrentView('home')}
          />
        );
      case 'register':
        if (!activeRegister) {
          return (
            <div className="text-center py-16 bg-white border border-slate-150 rounded-3xl shadow-sm space-y-3">
              <BookOpen className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-sm font-semibold text-slate-800">No Register Active</p>
              <button 
                onClick={() => setCurrentView('create_register')}
                className="py-2 px-4 bg-indigo-600 text-white text-xs font-bold rounded-xl"
              >
                Create New Register
              </button>
            </div>
          );
        }
        return (
          <RegisterView
            register={activeRegister}
            workers={workers}
            attendance={attendance}
            overtime={overtime}
            onMarkAttendance={handleMarkAttendance}
            onBulkMarkPresent={handleBulkMarkPresent}
            onSaveOvertime={handleSaveOvertime}
            onBack={() => setCurrentView('home')}
          />
        );
      case 'workers':
        return (
          <WorkerManagement
            workers={workers}
            settings={settings}
            onAddWorker={handleAddWorker}
            onUpdateWorker={handleUpdateWorker}
            onBack={() => setCurrentView('home')}
          />
        );
      case 'reports':
        return (
          <ReportsView
            registers={registers}
            workers={workers}
            attendance={attendance}
            overtime={overtime}
            onBack={() => setCurrentView('home')}
            onSelectSalarySheet={(regId) => {
              if (regId) {
                // Pre-select the register
                setActiveRegister(registers.find(r => r.id === regId) || activeRegister);
              }
              setCurrentView('salary_sheet');
            }}
          />
        );
      case 'salary_sheet':
        return (
          <SalaryAttendanceSheetView
            registers={registers}
            workers={workers}
            attendance={attendance}
            overtime={overtime}
            onBack={() => setCurrentView('reports')}
            initialRegisterId={activeRegister?.id}
          />
        );
      case 'backup':
        return (
          <BackupRestoreView
            onBack={() => setCurrentView('home')}
            onDataRestored={handleDataRestored}
          />
        );
      case 'settings':
        return (
          <SettingsView
            settings={settings}
            onSaveSettings={handleSaveSettings}
            onBack={() => setCurrentView('home')}
            isAppInstallable={isAppInstallable}
            onInstallApp={handleInstallApp}
            isOnline={isOnline}
          />
        );
      case 'about':
        return (
          <AboutView
            onBack={() => setCurrentView('home')}
          />
        );
      default:
        return <div>View not found</div>;
    }
  };

  // Show lock screen if enabled and locked
  if (settings.pinEnabled && isLocked) {
    return <SecurityLock settings={settings} onUnlocked={() => setIsLocked(false)} />;
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex text-[#1A1C1E] antialiased font-sans relative">
      {/* PWA Update Banner */}
      {updateAvailable && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] bg-gradient-to-r from-indigo-900 to-indigo-950 text-white py-3 px-5 rounded-2xl shadow-xl border border-indigo-950 flex items-center gap-4 animate-bounce max-w-sm sm:max-w-md">
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-white">App Update Available!</p>
            <p className="text-[10px] text-indigo-200">A new version was compiled. Tap update to load instantly without losing data.</p>
          </div>
          <button
            onClick={handleUpdateApp}
            className="py-1.5 px-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-black rounded-lg transition-colors cursor-pointer shrink-0"
          >
            Update App
          </button>
        </div>
      )}

      {/* Cloud Sync Success Toast */}
      {syncNotification && (
        <div className="fixed bottom-24 md:bottom-6 right-6 z-[9999] bg-emerald-900 text-white py-3 px-4 rounded-xl shadow-lg border border-emerald-950 flex items-center gap-2">
          <div className="p-1 bg-emerald-800 rounded-lg text-emerald-300">
            <Check className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-white">{syncNotification}</span>
        </div>
      )}

      {/* Left Sidebar (Desktop only) */}
      <aside className="w-[260px] bg-[#1A1C1E] text-white flex flex-col p-6 border-r border-[#C4C7C8] shrink-0 md:flex hidden">
        <div className="flex items-center gap-3 mb-10 cursor-pointer select-none" onClick={() => setCurrentView('home')}>
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center font-extrabold text-white text-sm shadow-sm">
            LR
          </div>
          <div>
            <h2 className="font-bold text-sm leading-none">Labour Register</h2>
            <p className="text-[10px] text-[#BEC6DC] font-medium tracking-wider mt-1 uppercase">Industrial Pro</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          <div 
            onClick={() => setCurrentView('home')}
            className={`flex items-center gap-3 py-3 px-4 rounded-lg cursor-pointer text-sm font-semibold transition-all ${currentView === 'home' ? 'bg-[#44474E] text-white' : 'text-[#BEC6DC] hover:bg-white/5 hover:text-white'}`}
          >
            <Home className="w-4.5 h-4.5 opacity-80" />
            <span>Dashboard Home</span>
          </div>

          <div 
            onClick={() => {
              if (activeRegister) {
                setCurrentView('register');
              } else {
                setCurrentView('create_register');
              }
            }}
            className={`flex items-center gap-3 py-3 px-4 rounded-lg cursor-pointer text-sm font-semibold transition-all ${currentView === 'register' ? 'bg-[#44474E] text-white' : 'text-[#BEC6DC] hover:bg-white/5 hover:text-white'}`}
          >
            <BookOpen className="w-4.5 h-4.5 opacity-80" />
            <span>Attendance Grid</span>
          </div>

          <div 
            onClick={() => setCurrentView('workers')}
            className={`flex items-center gap-3 py-3 px-4 rounded-lg cursor-pointer text-sm font-semibold transition-all ${currentView === 'workers' ? 'bg-[#44474E] text-white' : 'text-[#BEC6DC] hover:bg-white/5 hover:text-white'}`}
          >
            <Users className="w-4.5 h-4.5 opacity-80" />
            <span>Worker Database</span>
          </div>

          <div 
            onClick={() => setCurrentView('reports')}
            className={`flex items-center gap-3 py-3 px-4 rounded-lg cursor-pointer text-sm font-semibold transition-all ${currentView === 'reports' ? 'bg-[#44474E] text-white' : 'text-[#BEC6DC] hover:bg-white/5 hover:text-white'}`}
          >
            <BarChart3 className="w-4.5 h-4.5 opacity-80" />
            <span>Site Reports</span>
          </div>

          <div 
            onClick={() => setCurrentView('salary_sheet')}
            className={`flex items-center gap-3 py-3 px-4 rounded-lg cursor-pointer text-sm font-semibold transition-all ${currentView === 'salary_sheet' ? 'bg-[#44474E] text-white' : 'text-[#BEC6DC] hover:bg-white/5 hover:text-white'}`}
          >
            <FileSpreadsheet className="w-4.5 h-4.5 opacity-80 text-emerald-400" />
            <span>Salary Summary</span>
          </div>

          <div 
            onClick={() => setCurrentView('backup')}
            className={`flex items-center gap-3 py-3 px-4 rounded-lg cursor-pointer text-sm font-semibold transition-all ${currentView === 'backup' ? 'bg-[#44474E] text-white' : 'text-[#BEC6DC] hover:bg-white/5 hover:text-white'}`}
          >
            <CloudLightning className="w-4.5 h-4.5 opacity-80" />
            <span>Backup & Sync</span>
          </div>

          <div 
            onClick={() => setCurrentView('settings')}
            className={`flex items-center gap-3 py-3 px-4 rounded-lg cursor-pointer text-sm font-semibold transition-all ${currentView === 'settings' ? 'bg-[#44474E] text-white' : 'text-[#BEC6DC] hover:bg-white/5 hover:text-white'}`}
          >
            <SettingsIcon className="w-4.5 h-4.5 opacity-80" />
            <span>Settings</span>
          </div>

          <div 
            onClick={() => setCurrentView('about')}
            className={`flex items-center gap-3 py-3 px-4 rounded-lg cursor-pointer text-sm font-semibold transition-all ${currentView === 'about' ? 'bg-[#44474E] text-white' : 'text-[#BEC6DC] hover:bg-white/5 hover:text-white'}`}
          >
            <Info className="w-4.5 h-4.5 opacity-80" />
            <span>About App</span>
          </div>
        </nav>

        <div className="pt-4 border-t border-[#44474E] mt-auto text-xs space-y-2">
          {/* Online/Offline Status */}
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-ping'}`} />
            <span className="text-[#BEC6DC] font-medium">
              {isOnline ? 'Cloud Sync Online' : 'Offline Ledger Mode'}
            </span>
          </div>

          {/* Sync indicator */}
          {currentUser && (
            <p className="text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Cloud Vault Secured</span>
            </p>
          )}

          {/* Install prompt promo inside sidebar */}
          {isAppInstallable && (
            <button
              onClick={handleInstallApp}
              className="w-full mt-2 py-2 px-3 bg-[#44474E] hover:bg-[#5a5e66] active:scale-95 text-white text-[11px] font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Install Device App</span>
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-0">
        {/* Top Header */}
        <header className="bg-white border-b border-[#C4C7C8] px-6 py-4 flex items-center justify-between z-20 shrink-0">
          <div className="flex items-center gap-3 md:hidden">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center font-extrabold text-white text-xs">
              LR
            </div>
            <div>
              <h1 className="font-bold text-xs text-slate-800 leading-none">Labour Register</h1>
              <p className="text-[9px] text-slate-400 font-medium tracking-wider mt-0.5 uppercase">Industrial Pro</p>
            </div>
          </div>

          <div className="hidden md:block">
            {activeRegister ? (
              <div>
                <h1 className="font-bold text-lg text-[#1A1C1E]">{activeRegister.projectName}</h1>
                <p className="text-xs text-[#44474E]">
                  Register for {activeRegister.companyName} &bull; {activeRegister.supervisorName ? `Supervisor: ${activeRegister.supervisorName}` : 'No Supervisor Specified'}
                </p>
              </div>
            ) : (
              <div>
                <h1 className="font-bold text-lg text-[#1A1C1E]">No Active Register</h1>
                <p className="text-xs text-[#44474E]">Create or select a monthly labour attendance ledger</p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {activeRegister && (
              <span className="flex items-center space-x-1.5 py-1 px-3 bg-[#E8F5E9] border border-[#C8E6C9] text-[#2E7D32] text-[11px] font-bold rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D32]" />
                <span>Verified Active</span>
              </span>
            )}
            
            <button
              onClick={() => setCurrentView('home')}
              className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-500 md:hidden"
              title="Home Screen"
            >
              <Home className="w-4.5 h-4.5" />
            </button>
          </div>
        </header>

        {/* Main Viewport Content */}
        <main className="flex-1 overflow-y-auto px-6 py-6 w-full max-w-7xl mx-auto">
          {renderMainContent()}
        </main>
      </div>

      {/* Bottom Navigation Menu (Fixed on Mobile Viewports only) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#C4C7C8] py-2.5 px-6 z-30 flex items-center justify-between shadow-[0_-2px_10px_rgba(0,0,0,0.03)] md:hidden">
        {/* Home option */}
        <button
          onClick={() => setCurrentView('home')}
          className={`flex flex-col items-center space-y-1 ${currentView === 'home' ? 'text-primary font-bold' : 'text-slate-400'}`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[9px] tracking-wider uppercase font-bold">Home</span>
        </button>

        {/* Ledger option */}
        <button
          onClick={() => {
            if (activeRegister) {
              setCurrentView('register');
            } else {
              setCurrentView('create_register');
            }
          }}
          className={`flex flex-col items-center space-y-1 ${currentView === 'register' ? 'text-primary font-bold' : 'text-slate-400'}`}
        >
          <BookOpen className="w-5 h-5" />
          <span className="text-[9px] tracking-wider uppercase font-bold">Ledger</span>
        </button>

        {/* Workers directory option */}
        <button
          onClick={() => setCurrentView('workers')}
          className={`flex flex-col items-center space-y-1 ${currentView === 'workers' ? 'text-primary font-bold' : 'text-slate-400'}`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[9px] tracking-wider uppercase font-bold">Workers</span>
        </button>

        {/* Reports option */}
        <button
          onClick={() => setCurrentView('reports')}
          className={`flex flex-col items-center space-y-1 ${currentView === 'reports' ? 'text-primary font-bold' : 'text-slate-400'}`}
        >
          <BarChart3 className="w-5 h-5" />
          <span className="text-[9px] tracking-wider uppercase font-bold">Stats</span>
        </button>

        {/* Sync backup option */}
        <button
          onClick={() => setCurrentView('backup')}
          className={`flex flex-col items-center space-y-1 ${currentView === 'backup' ? 'text-primary font-bold' : 'text-slate-400'}`}
        >
          <CloudLightning className="w-5 h-5" />
          <span className="text-[9px] tracking-wider uppercase font-bold">Sync</span>
        </button>
      </nav>
    </div>
  );
}
