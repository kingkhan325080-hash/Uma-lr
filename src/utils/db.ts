/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Register, Worker, AttendanceRecord, OvertimeRecord, AppSettings, BackupData } from '../types';

const STORAGE_KEYS = {
  REGISTERS: 'labour_attendance_registers',
  WORKERS: 'labour_attendance_workers',
  ATTENDANCE: 'labour_attendance_records',
  OVERTIME: 'labour_attendance_overtime',
  SETTINGS: 'labour_attendance_settings'
};

const DEFAULT_DESIGNATIONS = [
  'Driver',
  'Helper',
  'Plant Operator',
  'Mason',
  'Electrician',
  'Welder',
  'Carpenter'
];

const DEFAULT_SETTINGS: AppSettings = {
  pinEnabled: false,
  pinCode: '',
  fingerprintSimulated: false,
  supervisorNameDefault: '',
  companyNameDefault: '',
  designations: DEFAULT_DESIGNATIONS
};

// Local storage helpers with fallback
function getLocalItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    console.error(`Error reading key ${key} from localStorage`, e);
    return defaultValue;
  }
}

function setLocalItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error writing key ${key} to localStorage`, e);
  }
}

export const dbService = {
  // --- SETTINGS ---
  getSettings(): AppSettings {
    return getLocalItem<AppSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  },

  saveSettings(settings: AppSettings): void {
    setLocalItem(STORAGE_KEYS.SETTINGS, settings);
  },

  // --- REGISTERS ---
  getRegisters(): Register[] {
    const registers = getLocalItem<Register[]>(STORAGE_KEYS.REGISTERS, []);
    return registers.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  saveRegisters(registers: Register[]): void {
    setLocalItem(STORAGE_KEYS.REGISTERS, registers);
  },

  addRegister(register: Omit<Register, 'id' | 'createdAt'>): Register {
    const registers = this.getRegisters();
    const id = `${register.projectName.trim().toLowerCase().replace(/\s+/g, '_')}_${register.year}_${register.month}`;
    
    // Check if register already exists
    const existing = registers.find(r => r.id === id);
    if (existing) {
      return existing; // Return existing register
    }

    const newRegister: Register = {
      ...register,
      id,
      createdAt: new Date().toISOString()
    };

    registers.push(newRegister);
    this.saveRegisters(registers);
    return newRegister;
  },

  deleteRegister(registerId: string): void {
    let registers = this.getRegisters();
    registers = registers.filter(r => r.id !== registerId);
    this.saveRegisters(registers);

    // Clean up attendance and overtime for this register
    let attendance = this.getAttendance();
    attendance = attendance.filter(a => a.registerId !== registerId);
    this.saveAttendance(attendance);

    let overtime = this.getOvertime();
    overtime = overtime.filter(o => o.registerId !== registerId);
    this.saveOvertime(overtime);
  },

  archiveRegister(id: string, isArchived: boolean): void {
    const registers = this.getRegisters();
    const index = registers.findIndex(r => r.id === id);
    if (index !== -1) {
      registers[index].isArchived = isArchived;
      this.saveRegisters(registers);
    }
  },

  renameRegister(id: string, newProjectName: string, newCompanyName: string): void {
    const registers = this.getRegisters();
    const index = registers.findIndex(r => r.id === id);
    if (index !== -1) {
      registers[index].projectName = newProjectName;
      registers[index].companyName = newCompanyName;
      this.saveRegisters(registers);
    }
  },

  duplicateRegister(originalId: string, newProjectName: string, newCompanyName: string): Register | null {
    const registers = this.getRegisters();
    const original = registers.find(r => r.id === originalId);
    if (!original) return null;

    const baseId = `${newProjectName.trim().toLowerCase().replace(/\s+/g, '_')}_${original.year}_${original.month}`;
    const id = `${baseId}_${Math.random().toString(36).substring(2, 6)}`;

    const duplicatedRegister: Register = {
      ...original,
      id,
      projectName: newProjectName,
      companyName: newCompanyName,
      createdAt: new Date().toISOString(),
      isArchived: false,
    };

    registers.push(duplicatedRegister);
    this.saveRegisters(registers);

    // Now duplicate the attendance records
    const attendance = this.getAttendance();
    const origAttendance = attendance.filter(a => a.registerId === originalId);
    const dupAttendance = origAttendance.map(a => ({
      ...a,
      id: `${id}_${a.workerId}_${a.date}`,
      registerId: id,
    }));
    this.saveAttendance([...attendance, ...dupAttendance]);

    // Now duplicate the overtime records
    const overtime = this.getOvertime();
    const origOvertime = overtime.filter(o => o.registerId === originalId);
    const dupOvertime = origOvertime.map(o => ({
      ...o,
      id: `${id}_${o.workerId}_${o.date}`,
      registerId: id,
    }));
    this.saveOvertime([...overtime, ...dupOvertime]);

    return duplicatedRegister;
  },

  // --- WORKERS ---
  getWorkers(): Worker[] {
    const workers = getLocalItem<Worker[]>(STORAGE_KEYS.WORKERS, []);
    return workers.sort((a, b) => a.name.localeCompare(b.name));
  },

  saveWorkers(workers: Worker[]): void {
    setLocalItem(STORAGE_KEYS.WORKERS, workers);
  },

  addWorker(worker: Omit<Worker, 'id' | 'createdAt'>): Worker {
    const workers = this.getWorkers();
    const newWorker: Worker = {
      ...worker,
      id: `worker_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      createdAt: new Date().toISOString()
    };
    workers.push(newWorker);
    this.saveWorkers(workers);
    return newWorker;
  },

  updateWorker(id: string, updatedFields: Partial<Omit<Worker, 'id' | 'createdAt'>>): void {
    const workers = this.getWorkers();
    const index = workers.findIndex(w => w.id === id);
    if (index !== -1) {
      workers[index] = { ...workers[index], ...updatedFields };
      this.saveWorkers(workers);
    }
  },

  // --- ATTENDANCE ---
  getAttendance(): AttendanceRecord[] {
    return getLocalItem<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, []);
  },

  saveAttendance(attendance: AttendanceRecord[]): void {
    setLocalItem(STORAGE_KEYS.ATTENDANCE, attendance);
  },

  markAttendance(registerId: string, workerId: string, date: string, status: AttendanceRecord['status']): void {
    const records = this.getAttendance();
    const recordId = `${registerId}_${workerId}_${date}`;
    const index = records.findIndex(r => r.id === recordId);

    if (status === '') {
      // Remove if cleared
      if (index !== -1) {
        records.splice(index, 1);
      }
    } else {
      const record: AttendanceRecord = {
        id: recordId,
        registerId,
        workerId,
        date,
        status
      };
      if (index !== -1) {
        records[index] = record;
      } else {
        records.push(record);
      }
    }
    this.saveAttendance(records);
  },

  bulkMarkPresent(registerId: string, date: string, workerIds: string[]): void {
    const records = this.getAttendance();
    
    workerIds.forEach(workerId => {
      const recordId = `${registerId}_${workerId}_${date}`;
      const index = records.findIndex(r => r.id === recordId);
      
      const record: AttendanceRecord = {
        id: recordId,
        registerId,
        workerId,
        date,
        status: 'P'
      };

      if (index !== -1) {
        // Only overwrite if currently empty
        if (!records[index].status) {
          records[index] = record;
        }
      } else {
        records.push(record);
      }
    });

    this.saveAttendance(records);
  },

  // --- OVERTIME ---
  getOvertime(): OvertimeRecord[] {
    return getLocalItem<OvertimeRecord[]>(STORAGE_KEYS.OVERTIME, []);
  },

  saveOvertime(overtime: OvertimeRecord[]): void {
    setLocalItem(STORAGE_KEYS.OVERTIME, overtime);
  },

  saveOvertimeRecord(registerId: string, workerId: string, date: string, hours: number, reason?: string): void {
    const records = this.getOvertime();
    const recordId = `${registerId}_${workerId}_${date}`;
    const index = records.findIndex(r => r.id === recordId);

    if (hours <= 0) {
      if (index !== -1) {
        records.splice(index, 1);
      }
    } else {
      const record: OvertimeRecord = {
        id: recordId,
        registerId,
        workerId,
        date,
        hours,
        reason: reason?.trim() || ''
      };

      if (index !== -1) {
        records[index] = record;
      } else {
        records.push(record);
      }
    }
    this.saveOvertime(records);
  },

  // --- EXPORT & BACKUP ---
  getBackupData(): BackupData {
    return {
      registers: this.getRegisters(),
      workers: this.getWorkers(),
      attendance: this.getAttendance(),
      overtime: this.getOvertime(),
      settings: this.getSettings(),
      backupTime: new Date().toISOString(),
      version: '1.0.0'
    };
  },

  restoreBackupData(data: BackupData): boolean {
    if (!data || !Array.isArray(data.registers) || !Array.isArray(data.workers)) {
      return false;
    }
    this.saveRegisters(data.registers);
    this.saveWorkers(data.workers);
    this.saveAttendance(data.attendance || []);
    this.saveOvertime(data.overtime || []);
    this.saveSettings(data.settings || DEFAULT_SETTINGS);
    return true;
  },

  // --- LOAD DEMO DATA ---
  loadDemoData(): void {
    // 1. Create a register
    const now = new Date();
    const month = now.getMonth() + 1; // 1-indexed
    const year = now.getFullYear();

    const register = this.addRegister({
      companyName: 'Apex Constructions Ltd.',
      projectName: 'Metro Station - Site A',
      month,
      year,
      supervisorName: 'Karan Sharma'
    });

    // 2. Add workers if empty
    let workers = this.getWorkers();
    if (workers.length === 0) {
      const demoWorkers = [
        { name: 'Amit Kumar', designation: 'Mason', isActive: true },
        { name: 'Rajesh Yadav', designation: 'Helper', isActive: true },
        { name: 'Vijay Singh', designation: 'Welder', isActive: true },
        { name: 'Sanjay Dutt', designation: 'Driver', isActive: true },
        { name: 'Sunil Verma', designation: 'Carpenter', isActive: true },
        { name: 'Rakesh Mishra', designation: 'Plant Operator', isActive: true },
        { name: 'Manish Pandey', designation: 'Electrician', isActive: true },
        { name: 'Vikram Rathore', designation: 'Mason', isActive: true },
        { name: 'Anil Gupta', designation: 'Helper', isActive: true },
        { name: 'Deepak Chawla', designation: 'Helper', isActive: false }
      ];

      demoWorkers.forEach(w => {
        this.addWorker(w);
      });
      workers = this.getWorkers();
    }

    // 3. Mark some attendance and overtime for testing
    // Fill the past 5 days of this month with simulated records
    const activeWorkers = workers.filter(w => w.isActive);
    const dayCount = 5;
    for (let day = 1; day <= dayCount; day++) {
      const dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      activeWorkers.forEach((worker, i) => {
        // Randomly assign: P (70%), A (10%), H (10%), L (10%)
        const rand = Math.random();
        let status: AttendanceRecord['status'] = 'P';
        if (rand < 0.1) status = 'A';
        else if (rand < 0.2) status = 'H';
        else if (rand < 0.3) status = 'L';

        this.markAttendance(register.id, worker.id, dateString, status);

        // Add some overtime (e.g. 2 hours on Day 2 for Welder, Mason, Plant Operator)
        if (day === 2 && (worker.designation === 'Welder' || worker.designation === 'Mason' || worker.designation === 'Plant Operator')) {
          this.saveOvertimeRecord(register.id, worker.id, dateString, 2.5, 'Slab Concrete Pouring');
        } else if (day === 4 && worker.designation === 'Driver' && status === 'P') {
          this.saveOvertimeRecord(register.id, worker.id, dateString, 1.5, 'Material Unloading');
        }
      });
    }
  }
};
