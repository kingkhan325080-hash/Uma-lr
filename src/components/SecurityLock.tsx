/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Lock, Fingerprint, RefreshCw, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { AppSettings } from '../types';

interface SecurityLockProps {
  settings: AppSettings;
  onUnlocked: () => void;
}

export default function SecurityLock({ settings, onUnlocked }: SecurityLockProps) {
  const [pin, setPin] = useState<string>('');
  const [showPin, setShowPin] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [useFingerprint, setUseFingerprint] = useState<boolean>(false);

  useEffect(() => {
    if (!settings.pinEnabled) {
      onUnlocked();
    }
  }, [settings.pinEnabled, onUnlocked]);

  const handleKeyPress = (num: string) => {
    setError('');
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      
      // Auto-submit when 4 digits are typed
      if (newPin === settings.pinCode) {
        setTimeout(() => {
          onUnlocked();
        }, 150);
      } else if (newPin.length === 4) {
        setTimeout(() => {
          setError('Incorrect 4-digit PIN. Please try again.');
          setPin('');
        }, 200);
      }
    }
  };

  const handleBackspace = () => {
    if (pin.length > 0) {
      setPin(pin.slice(0, -1));
    }
  };

  const triggerFingerprint = () => {
    setUseFingerprint(true);
    setTimeout(() => {
      // Simulate fingerprint success
      setUseFingerprint(false);
      onUnlocked();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 bg-slate-900 flex flex-col items-center justify-between py-12 px-6 z-50 select-none">
      {/* Top Header */}
      <div className="flex flex-col items-center space-y-3 text-center mt-6">
        <div className="p-4 bg-indigo-600/15 rounded-full border border-indigo-500/20">
          <Lock className="w-8 h-8 text-indigo-400" />
        </div>
        <h1 className="text-xl font-bold text-slate-100 tracking-tight">
          Labour Attendance Register
        </h1>
        <p className="text-sm text-slate-400 max-w-xs">
          This app is locked to protect labor records. Please enter your 4-digit security PIN.
        </p>
      </div>

      {/* PIN Dots display */}
      <div className="flex flex-col items-center space-y-4 my-auto">
        <div className="flex justify-center space-x-6">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`w-4 h-4 rounded-full transition-all duration-150 ${
                pin.length > idx
                  ? 'bg-indigo-400 scale-110 shadow-[0_0_10px_rgba(129,140,248,0.5)]'
                  : 'bg-slate-700 border border-slate-600'
              }`}
            />
          ))}
        </div>

        {error ? (
          <div className="flex items-center space-x-1.5 text-rose-400 text-xs mt-2 animate-bounce">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        ) : (
          <button
            onClick={() => setShowPin(!showPin)}
            className="flex items-center space-x-1 text-slate-400 hover:text-slate-300 text-xs mt-2 transition-colors duration-150 py-1 px-3 bg-slate-800/40 rounded-full"
          >
            {showPin ? (
              <>
                <EyeOff className="w-3 h-3" />
                <span>Hide Input</span>
              </>
            ) : (
              <>
                <Eye className="w-3 h-3" />
                <span>Show Input</span>
              </>
            )}
          </button>
        )}

        {showPin && pin.length > 0 && (
          <div className="text-slate-300 font-mono text-sm tracking-widest bg-slate-800 py-1 px-4 rounded-md">
            {pin}
          </div>
        )}
      </div>

      {/* Keypad Panel */}
      <div className="w-full max-w-xs flex flex-col space-y-4 mb-6">
        <div className="grid grid-cols-3 gap-3">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              onClick={() => handleKeyPress(num)}
              className="aspect-square flex items-center justify-center bg-slate-800/50 hover:bg-slate-800 active:bg-slate-700 border border-slate-700/30 text-slate-200 text-2xl font-medium rounded-full transition-colors duration-100"
            >
              {num}
            </button>
          ))}

          {/* Fingerprint Button */}
          <button
            onClick={triggerFingerprint}
            className="aspect-square flex flex-col items-center justify-center bg-indigo-950/20 hover:bg-indigo-900/30 active:bg-indigo-900/40 text-indigo-400 border border-indigo-500/20 rounded-full transition-colors duration-100"
          >
            <Fingerprint className="w-7 h-7" />
            <span className="text-[10px] mt-1 font-medium tracking-wide">Touch ID</span>
          </button>

          {/* Zero Button */}
          <button
            onClick={() => handleKeyPress('0')}
            className="aspect-square flex items-center justify-center bg-slate-800/50 hover:bg-slate-800 active:bg-slate-700 border border-slate-700/30 text-slate-200 text-2xl font-medium rounded-full transition-colors duration-100"
          >
            0
          </button>

          {/* Backspace Button */}
          <button
            onClick={handleBackspace}
            className="aspect-square flex items-center justify-center bg-slate-800/30 hover:bg-slate-800 active:bg-slate-700 text-slate-400 rounded-full transition-colors duration-100"
          >
            <span className="text-sm font-semibold">Delete</span>
          </button>
        </div>
      </div>

      {/* Fingerprint Simulation Modal */}
      {useFingerprint && (
        <div className="fixed inset-0 bg-slate-950/90 flex flex-col items-center justify-center space-y-6 z-50 animate-fade-in">
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-indigo-500/20 animate-ping" />
            <div className="p-8 bg-indigo-600/30 border border-indigo-500/40 rounded-full text-indigo-400 animate-pulse">
              <Fingerprint className="w-16 h-16" />
            </div>
          </div>
          <div className="flex flex-col items-center space-y-2 text-center">
            <h3 className="text-lg font-bold text-slate-100">Scanning Fingerprint...</h3>
            <p className="text-sm text-slate-400">Place your finger on your screen sensor</p>
            <div className="flex items-center space-x-2 text-indigo-400 text-xs mt-3 bg-indigo-950/50 px-3 py-1.5 rounded-full border border-indigo-500/20">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Matching biometric templates...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
