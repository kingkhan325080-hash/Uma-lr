/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Register {
  id: string; // unique ID, e.g. "projectName_month_year"
  companyName: string;
  projectName: string;
  month: number; // 1 to 12
  year: number;
  supervisorName?: string;
  createdAt: string;
  isArchived?: boolean;
}

export interface Worker {
  id: string;
  name: string;
  mobile?: string;
  designation: string;
  isActive: boolean;
  createdAt: string;
}

export interface AttendanceRecord {
  id: string; // `${registerId}_${workerId}_${date}`
  registerId: string;
  workerId: string;
  date: string; // "YYYY-MM-DD"
  status: 'P' | 'A' | 'H' | 'L' | ''; // Present, Absent, Half Day, Leave, None
}

export interface OvertimeRecord {
  id: string; // `${registerId}_${workerId}_${date}`
  registerId: string;
  workerId: string;
  date: string; // "YYYY-MM-DD"
  hours: number;
  reason?: string;
}

export interface AppSettings {
  pinEnabled: boolean;
  pinCode: string; // 4-digit PIN
  fingerprintSimulated: boolean;
  supervisorNameDefault: string;
  companyNameDefault: string;
  designations: string[];
}

export interface BackupData {
  registers: Register[];
  workers: Worker[];
  attendance: AttendanceRecord[];
  overtime: OvertimeRecord[];
  settings: AppSettings;
  backupTime: string;
  version: string;
}
