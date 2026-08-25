import { useState, useRef, useEffect } from 'react';
import type { KeyboardEvent, FormEvent } from 'react';
import { ShieldCheck, Lock, AlertCircle, LogOut, Delete, KeyRound, Eye, EyeOff } from 'lucide-react';
import { User } from 'firebase/auth';

interface Props {
  user: User;
  onSuccess: () => void;
  onSignOut: () => void;
}

const CORRECT_PIN = '200176';

export function SecurityPinScreen({ user, onSuccess, onSignOut }: Props) {
  const [pin, setPin] = useState<string[]>(['', '', '', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Focus first input on mount
    inputsRef.current[0]?.focus();
  }, []);

  const handleInputChange = (index: number, value: string) => {
    // If value has multiple characters (like paste)
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, 6).split('');
      const newPin = [...pin];
      digits.forEach((digit, i) => {
        if (i < 6) newPin[i] = digit;
      });
      setPin(newPin);
      setError(null);
      
      const nextIndex = Math.min(digits.length, 5);
      inputsRef.current[nextIndex]?.focus();

      if (digits.length === 6) {
        verifyPin(newPin.join(''));
      }
      return;
    }

    const digit = value.replace(/\D/g, '');
    const newPin = [...pin];
    newPin[index] = digit;
    setPin(newPin);
    setError(null);

    // Auto advance to next input
    if (digit && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }

    // If completed 6 digits, verify automatically
    if (digit && index === 5) {
      const fullPin = newPin.join('');
      if (fullPin.length === 6) {
        verifyPin(fullPin);
      }
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!pin[index] && index > 0) {
        const newPin = [...pin];
        newPin[index - 1] = '';
        setPin(newPin);
        inputsRef.current[index - 1]?.focus();
      } else {
        const newPin = [...pin];
        newPin[index] = '';
        setPin(newPin);
      }
      setError(null);
    } else if (e.key === 'ArrowLeft' && index < 5) {
      inputsRef.current[index + 1]?.focus();
    } else if (e.key === 'ArrowRight' && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === 'Enter') {
      const fullPin = pin.join('');
      if (fullPin.length === 6) {
        verifyPin(fullPin);
      }
    }
  };

  const handlePadClick = (num: string) => {
    const emptyIndex = pin.findIndex(d => d === '');
    if (emptyIndex !== -1) {
      handleInputChange(emptyIndex, num);
    }
  };

  const handlePadBackspace = () => {
    const lastFilledIndex = [...pin].reverse().findIndex(d => d !== '');
    if (lastFilledIndex !== -1) {
      const actualIndex = 5 - lastFilledIndex;
      const newPin = [...pin];
      newPin[actualIndex] = '';
      setPin(newPin);
      inputsRef.current[actualIndex]?.focus();
      setError(null);
    }
  };

  const verifyPin = (enteredPin: string) => {
    if (enteredPin === CORRECT_PIN) {
      setError(null);
      if (user) {
        localStorage.setItem(`fria_pin_verified_${user.uid}`, 'true');
        if (user.email) {
          localStorage.setItem(`fria_pin_verified_${user.email}`, 'true');
        }
        sessionStorage.setItem(`fria_pin_verified_${user.uid}`, 'true');
      }
      onSuccess();
    } else {
      setIsShaking(true);
      setError('کۆدی ئەمنی هەڵەیە! تکایە دووبارە هەوڵبدەرەوە.');
      setTimeout(() => setIsShaking(false), 600);
      setPin(['', '', '', '', '', '']);
      setTimeout(() => inputsRef.current[0]?.focus(), 50);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const fullPin = pin.join('');
    if (fullPin.length < 6) {
      setError('تکایە هەموو ٦ ژمارەکە بنووسە.');
      return;
    }
    verifyPin(fullPin);
  };

  return (
    <div className="min-h-full flex items-center justify-center p-4" dir="rtl">
      <div 
        className={`w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200/80 p-8 flex flex-col items-center transition-all ${
          isShaking ? 'animate-bounce border-red-400 ring-4 ring-red-100' : ''
        }`}
      >
        {/* Logo & Security Badge */}
        <div className="relative mb-5">
          <div className="w-20 h-20 rounded-full border-4 border-red-600 bg-white flex items-center justify-center shadow-md p-1 overflow-hidden">
            <img src="/frialogo.jpg" alt="Fria Logo" className="w-full h-full object-contain rounded-full" />
          </div>
          <div className="absolute -bottom-1 -left-1 w-7 h-7 bg-red-600 rounded-full border-2 border-white flex items-center justify-center text-white shadow">
            <Lock className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-black text-slate-800 mb-1 tracking-tight text-center">
          کۆدی ئەمنی داواکراوە
        </h2>
        <p className="text-slate-500 text-sm text-center mb-6 leading-relaxed">
          تکایە کۆدی ئەمنی ٦ ژمارەیی بنووسە بۆ چوونە ناو سیستەم
        </p>

        {/* User Account Pill */}
        <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 px-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-slate-200 border border-white shadow-xs flex items-center justify-center overflow-hidden shrink-0">
              {user.photoURL ? (
                <img src={user.photoURL} alt="User avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-slate-600 font-bold text-sm">{user.email?.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="flex flex-col min-w-0 text-right">
              <span className="text-xs font-bold text-slate-700 truncate">{user.displayName || 'بەکارهێنەر'}</span>
              <span className="text-[11px] text-slate-400 truncate" dir="ltr">{user.email}</span>
            </div>
          </div>

          <button
            onClick={onSignOut}
            type="button"
            className="flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 p-1.5 px-2.5 rounded-lg transition-colors shrink-0"
            title="چوونەدەرەوە لەم هەژمارە"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>چوونەدەرەوە</span>
          </button>
        </div>

        {/* PIN Inputs Form */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col items-center">
          <div className="flex items-center justify-center gap-2 sm:gap-2.5 mb-3" dir="ltr">
            {pin.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => (inputsRef.current[idx] = el)}
                type={showPin ? 'text' : 'password'}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={digit}
                onChange={(e) => handleInputChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-2xl font-mono font-bold rounded-xl border-2 transition-all focus:outline-none ${
                  error
                    ? 'border-red-400 bg-red-50/50 text-red-600 focus:ring-4 focus:ring-red-100'
                    : digit
                    ? 'border-red-600 bg-red-50/30 text-slate-900 focus:ring-4 focus:ring-red-100'
                    : 'border-slate-200 bg-slate-50 text-slate-800 focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-100'
                }`}
              />
            ))}
          </div>

          {/* Toggle visibility */}
          <div className="flex justify-end w-full px-2 mb-2">
            <button
              type="button"
              onClick={() => setShowPin(!showPin)}
              className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 font-medium transition-colors"
            >
              {showPin ? (
                <>
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>شاردنەوەی کۆد</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  <span>پیشاندانی کۆد</span>
                </>
              )}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="w-full bg-red-50 border border-red-200 text-red-700 text-xs font-bold p-3 rounded-xl mb-4 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-red-200 flex items-center justify-center gap-2 transition-all mb-4 text-base"
          >
            <ShieldCheck className="w-5 h-5" />
            <span>چوونەژوورەوە بۆ سیستەم</span>
          </button>
        </form>

        {/* Numeric Keypad for convenient Touch / Mobile / Fast input */}
        <div className="w-full grid grid-cols-3 gap-2 pt-2 border-t border-slate-100" dir="ltr">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handlePadClick(num)}
              className="py-3 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-800 font-mono font-bold text-xl rounded-xl transition-colors flex items-center justify-center shadow-xs"
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPin(['', '', '', '', '', ''])}
            className="py-3 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-400 hover:text-slate-600 font-bold text-xs rounded-xl transition-colors flex items-center justify-center"
          >
            سڕینەوە
          </button>
          <button
            type="button"
            onClick={() => handlePadClick('0')}
            className="py-3 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-800 font-mono font-bold text-xl rounded-xl transition-colors flex items-center justify-center shadow-xs"
          >
            0
          </button>
          <button
            type="button"
            onClick={handlePadBackspace}
            className="py-3 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-600 font-bold text-sm rounded-xl transition-colors flex items-center justify-center"
            title="Backspace"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Security notice */}
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-5">
          <KeyRound className="w-3.5 h-3.5 text-slate-400" />
          <span>ئەم سیستەمە پارێزراوە بە کۆدی ئەمنی تایبەت</span>
        </div>
      </div>
    </div>
  );
}
