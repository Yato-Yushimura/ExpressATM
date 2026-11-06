import React, { useState, useEffect, useCallback } from 'react';
import {
  CreditCard,
  LogOut,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Receipt,
  RotateCcw,
  Sparkles,
  Banknote,
  ShieldCheck,
  Printer,
  X,
  Volume2,
  VolumeX,
  Eye,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  ATMService,
  formatPHP,
  maskAccountNumber,
} from '../utils/atmLogic.js';
import {
  playKeypadBeep,
  playCardEject,
  playCashDispense,
  playCashGrab,
  playSuccessChime,
  playErrorBuzz,
  toggleSoundMute,
  getSoundMuted,
} from '../utils/soundEffects.js';
import { FilipinoCashBill } from './FilipinoCashBills.jsx';

export function AtmZoomedView({
  service,
  insertedCard,
  walletCash = 0,
  onSubtractCashFromWallet,
  onExitAtm,
  onAddCashToWallet,
  dispensedCash,
  onCashDispensed,
  onTakeDispensedCash,
}) {
  // Screen sub-states matching user's original Brython app
  const [screen, setScreen] = useState('login');

  const [loadingTitle, setLoadingTitle] = useState('Verifying Credentials...');
  const [loadingSub, setLoadingSub] = useState('Please wait while we access your account');
  const [loginError, setLoginError] = useState(null);
  const [cashError, setCashError] = useState(null);

  // Inputs - Only PIN required on real inserted card
  const [inputPin, setInputPin] = useState('');
  const [inputAmount, setInputAmount] = useState('');

  // Pending action & selected account type
  const [pendingAction, setPendingAction] = useState(null);
  const [selectedKind, setSelectedKind] = useState('savings');

  // Completed transaction cache
  const [lastTx, setLastTx] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [muted, setMuted] = useState(getSoundMuted());

  // Hardware shutter state for cash animation & interaction on lower right dispenser
  const [shutterOpen, setShutterOpen] = useState(Boolean(dispensedCash?.isDispensed));
  const [withdrawnCash, setWithdrawnCash] = useState(
    dispensedCash?.isDispensed
      ? { amount: dispensedCash.amount, collected: false, showPopup: false }
      : null
  );

  // Sync if dispensedCash prop updates from parent
  useEffect(() => {
    if (dispensedCash?.isDispensed) {
      setShutterOpen(true);
      setWithdrawnCash({
        amount: dispensedCash.amount,
        collected: false,
        showPopup: false,
      });
    } else if (dispensedCash === null) {
      setWithdrawnCash((prev) => (prev?.collected ? prev : null));
    }
  }, [dispensedCash]);

  // Reset PIN on card change
  useEffect(() => {
    setInputPin('');
  }, [insertedCard]);

  // Helper to transition with loading screen
  const runWithLoading = (title, sub, delayMs, nextFn) => {
    setLoadingTitle(title);
    setLoadingSub(sub);
    setScreen('loading');
    setTimeout(() => {
      nextFn();
    }, delayMs);
  };

  // Login handler using inserted card and PIN
  const handleLogin = (e) => {
    if (e) e.preventDefault();
    setLoginError(null);
    playKeypadBeep(1100);

    runWithLoading('Verifying PIN Code...', 'Please wait while we access your account', 700, () => {
      try {
        service.loginWithCard(insertedCard.accountNumber, inputPin);
        playSuccessChime();
        setScreen('menu');
      } catch (err) {
        playErrorBuzz();
        setScreen('login');
        setLoginError(err.message || 'Invalid PIN Code. Please try again.');
      }
    });
  };

  // Exit ATM
  const handleExitAtm = () => {
    playCardEject();
    setScreen('thankyou');
    setTimeout(() => {
      service.logout();
      onExitAtm();
    }, 1600);
  };

  // Action flow
  const handleSelectAction = (action) => {
    playKeypadBeep(1200);
    setPendingAction(action);
    setScreen('account-type');
  };

  const handleChooseAccountType = (kind) => {
    playKeypadBeep(1300);
    setSelectedKind(kind);
    service.selectAccountType(kind);
    const accType = kind === 'savings' ? 'Savings Account' : 'Checking Account';

    if (pendingAction === 'withdraw' || pendingAction === 'deposit') {
      setInputAmount('');
      setCashError(null);
      runWithLoading(`Accessing ${accType}...`, 'Preparing cash terminal', 500, () => {
        setScreen('cash');
      });
    } else if (pendingAction === 'inquire') {
      runWithLoading(`Retrieving ${accType} Balance...`, 'Please wait', 600, () => {
        setScreen('inquire');
      });
    } else if (pendingAction === 'history') {
      runWithLoading(`Loading ${accType} Transactions...`, 'Please wait', 600, () => {
        setScreen('history');
      });
    }
  };

  // Confirm cash transaction
  const handleConfirmCash = () => {
    setCashError(null);
    const isWithdrawal = pendingAction === 'withdraw';
    playKeypadBeep(1400);

    const num = Number(inputAmount);
    if (isNaN(num) || num <= 0) {
      playErrorBuzz();
      setCashError('Please enter a valid positive amount.');
      return;
    }
    if (num % 100 !== 0) {
      playErrorBuzz();
      setCashError('Amount must be in denominations of PHP 100, 500, or 1,000 bills.');
      return;
    }

    // Bug Fix: Check pocket cash for deposits on both Savings and Checking accounts
    if (!isWithdrawal) {
      if (walletCash <= 0) {
        playErrorBuzz();
        setCashError('You have PHP 0.00 cash in your pocket to deposit! Withdraw cash first or check your wallet.');
        return;
      }
      if (num > walletCash) {
        playErrorBuzz();
        setCashError(`Insufficient cash in pocket! You only have ${formatPHP(walletCash)} in your pocket to deposit.`);
        return;
      }
    }

    runWithLoading(
      'Processing Transaction...',
      'Please wait while your transaction is being processed',
      800,
      () => {
        try {
          let tx;
          if (isWithdrawal) {
            tx = service.performWithdrawal(inputAmount);
            playCashDispense();
            setShutterOpen(true);
            // Compute cumulative stacked cash in dispenser
            const previouslyInSlot = (dispensedCash && dispensedCash.isDispensed)
              ? dispensedCash.amount
              : ((withdrawnCash && !withdrawnCash.collected) ? withdrawnCash.amount : 0);
            const newStackedTotal = previouslyInSlot + tx.amount;

            setWithdrawnCash({
              amount: newStackedTotal,
              collected: false,
              showPopup: false,
            });
            // Register dispensed cash in App root so it persists and stacks!
            onCashDispensed?.(tx.amount);
            // No modal popup! The cash emerges directly in the lower right cash dispenser.
            try {
              confetti({
                particleCount: 40,
                spread: 60,
                origin: { y: 0.8 },
                colors: ['#10b981', '#3b82f6', '#fbbf24'],
              });
            } catch {
              // ignore
            }
          } else {
            // Deposit cash into Savings or Checking account
            tx = service.performDeposit(inputAmount, walletCash);
            // Deduct the deposited cash from pocket/wallet!
            onSubtractCashFromWallet?.(tx.amount);
            playSuccessChime();
          }
          setLastTx(tx);
          setInputAmount('');
          setScreen('completed');
        } catch (err) {
          playErrorBuzz();
          setScreen('cash');
          setCashError(err.message || 'Transaction could not be processed.');
        }
      }
    );
  };

  // Interactive cash collection by clicking the protruding bills on the lower right dispenser
  const handleTakeCash = () => {
    const amt = onTakeDispensedCash ? onTakeDispensedCash() : (withdrawnCash?.amount || 0);
    if (!amt && (!withdrawnCash || withdrawnCash.collected)) return;

    playCashGrab();
    try {
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.82, x: 0.75 },
        colors: ['#10b981', '#34d399', '#fbbf24', '#60a5fa'],
      });
    } catch {}

    setWithdrawnCash({
      amount: amt || (withdrawnCash?.amount || 0),
      collected: true,
      showPopup: true,
    });
    if (!onTakeDispensedCash && amt) {
      onAddCashToWallet?.(amt);
    }

    // Auto-close motorized shutter after cash is taken
    setTimeout(() => {
      setWithdrawnCash((prev) => (prev ? { ...prev, showPopup: false } : null));
      setShutterOpen(false);
    }, 2800);
  };

  // Tactile metallic keypad button click - full ATM operation across all screens
  const handleKeypadPress = useCallback(
    (val) => {
      playKeypadBeep(900 + (parseInt(val, 10) || 5) * 50);

      if (screen === 'login') {
        if (val === 'CLEAR') {
          setInputPin('');
        } else if (val === 'ENTER') {
          handleLogin();
        } else if (val === 'CANCEL') {
          handleExitAtm();
        } else {
          if (inputPin.length < 6 && /^\d$/.test(val)) {
            setInputPin((prev) => prev + val);
          }
        }
      } else if (screen === 'menu') {
        if (val === '1') {
          handleSelectAction('withdraw');
        } else if (val === '2') {
          handleSelectAction('deposit');
        } else if (val === '3') {
          handleSelectAction('inquire');
        } else if (val === '4') {
          handleSelectAction('history');
        } else if (val === 'CANCEL') {
          handleExitAtm();
        }
      } else if (screen === 'account-type') {
        if (val === '1') {
          handleChooseAccountType('savings');
        } else if (val === '2') {
          handleChooseAccountType('checking');
        } else if (val === 'CANCEL') {
          setScreen('menu');
        }
      } else if (screen === 'cash') {
        if (val === 'CLEAR') {
          setInputAmount('');
        } else if (val === 'ENTER') {
          handleConfirmCash();
        } else if (val === 'CANCEL') {
          setScreen('menu');
        } else if (val === '00') {
          setInputAmount((prev) => (prev ? prev + '00' : ''));
        } else if (/^\d$/.test(val)) {
          setInputAmount((prev) => prev + val);
        }
      } else if (screen === 'inquire' || screen === 'history') {
        if (val === 'ENTER' || val === 'CANCEL') {
          setScreen('menu');
        }
      } else if (screen === 'completed') {
        if (val === 'ENTER') {
          setScreen('menu');
        } else if (val === 'CANCEL') {
          handleExitAtm();
        }
      }
    },
    [screen, inputPin, inputAmount, pendingAction]
  );

  // Global physical keyboard listener for realistic keypad feel
  useEffect(() => {
    const onKeyDown = (e) => {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (activeTag === 'input') {
        if (e.key === 'Enter') {
          if (screen === 'login') handleLogin();
          if (screen === 'cash') handleConfirmCash();
        }
        return;
      }

      if (e.key >= '0' && e.key <= '9') {
        handleKeypadPress(e.key);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleKeypadPress('ENTER');
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleKeypadPress('CANCEL');
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        if (screen === 'login') {
          setInputPin((p) => p.slice(0, -1));
        } else if (screen === 'cash') {
          setInputAmount((a) => a.slice(0, -1));
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleKeypadPress, screen, inputPin, inputAmount]);

  const currentAcc = service.currentAccount;

  return (
    <div className="relative w-full h-full min-h-screen bg-slate-950 flex flex-col items-center justify-between p-2 md:p-6 select-none font-sans text-slate-100 overflow-y-auto">
      {/* Top Bar with Camera Zoom Controls & Audio */}
      <header className="w-full max-w-4xl flex items-center justify-between px-4 py-2 bg-slate-900/80 backdrop-blur rounded-xl border border-slate-800 text-xs text-slate-300 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-semibold text-white">ExpressBank Terminal #NCR-5884</span>
          <span className="hidden sm:inline text-slate-500">|</span>
          <span className="hidden sm:inline text-cyan-400 font-mono">
            Card: {insertedCard.holderName}
          </span>
          <span className="hidden md:inline text-slate-500">|</span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 font-mono text-[11px] font-bold">
            Pocket Cash: {formatPHP(walletCash)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMuted(toggleSoundMute())}
            aria-label={muted ? 'Unmute Audio' : 'Mute Audio'}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
          >
            {muted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          <button
            type="button"
            onClick={handleExitAtm}
            className="px-3 py-1.5 rounded-lg bg-rose-600/30 hover:bg-rose-600 text-rose-200 hover:text-white border border-rose-500/40 font-medium transition-all flex items-center gap-1 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Return to POV</span>
          </button>
        </div>
      </header>

      {/* ATM Main Machine Bezel (Grey Metallic Enclosure matching the photo) */}
      <div className="relative w-full max-w-3xl bg-gradient-to-b from-slate-300 via-slate-400 to-slate-500 border-4 border-slate-600 rounded-3xl p-4 md:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.85)] flex flex-col items-center">
        {/* Top Header Strip: Card Logos & Branding */}
        <div className="w-full flex items-center justify-between pb-3 border-b border-slate-400/80 text-slate-800 font-bold">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-blue-700 text-white flex items-center justify-center font-black text-xs shadow">
              EB
            </div>
            <span className="text-sm md:text-base font-extrabold tracking-tight text-blue-900">
              ExpressBank 24/7 ATM
            </span>
          </div>

          {/* Supported Network Badges */}
          <div className="flex items-center gap-1.5 scale-90 sm:scale-100">
            <span className="px-1.5 py-0.5 rounded bg-blue-800 text-[10px] text-white font-mono font-bold">
              VISA
            </span>
            <span className="px-1.5 py-0.5 rounded bg-amber-600 text-[10px] text-white font-mono font-bold">
              MC
            </span>
            <span className="px-1.5 py-0.5 rounded bg-emerald-700 text-[10px] text-white font-mono font-bold">
              PLUS
            </span>
            <span className="px-1.5 py-0.5 rounded bg-indigo-700 text-[10px] text-white font-mono font-bold">
              Cirrus
            </span>
          </div>
        </div>

        {/* ATM Screen Container (Framed with side soft keys like NCR ATM) */}
        <div className="relative w-full mt-4 flex items-center gap-2">
          {/* Left Side ATM Soft Keys */}
          <div className="hidden sm:flex flex-col gap-6 py-8">
            {[1, 2, 3, 4].map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => playKeypadBeep(850 + i * 50)}
                className="w-4 h-8 rounded-l-md bg-gradient-to-r from-slate-400 to-slate-300 border border-slate-500 shadow active:translate-x-0.5 cursor-pointer"
                aria-label={`ATM Left Soft Key ${i}`}
              />
            ))}
          </div>

          {/* CRT/LCD ATM Screen Body */}
          <div className="flex-1 bg-gradient-to-b from-[#0a2754] via-[#081e42] to-[#041229] border-4 border-slate-700 rounded-2xl p-4 md:p-6 shadow-[inset_0_4px_25px_rgba(0,0,0,0.8)] text-white min-h-[360px] flex flex-col justify-between relative overflow-hidden">
            {/* Screen Glass scanlines effect */}
            <div
              className="absolute inset-0 pointer-events-none opacity-10"
              style={{
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.15) 2px, rgba(255,255,255,0.15) 4px)',
              }}
            />

            {/* SCREEN 1: LOGIN */}
            {screen === 'login' && (
              <div className="relative z-10 flex flex-col justify-between h-full py-2 space-y-4">
                <div className="text-center space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-cyan-300 text-xs font-mono font-semibold border border-blue-400/30">
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Card Authenticated: {insertedCard.holderName}</span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white">
                    Enter Your PIN Code
                  </h2>
                  <p className="text-xs text-blue-200/80">
                    Please enter your confidential card PIN to continue
                  </p>
                </div>

                {loginError && (
                  <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/60 text-rose-200 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <div>
                      <strong className="block font-semibold">Access Declined</strong>
                      <span>{loginError}</span>
                    </div>
                  </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4 max-w-xs mx-auto w-full">
                  <div>
                    <label className="block text-xs font-mono uppercase text-blue-300 mb-2 text-center">
                      Card PIN (4-6 Digits)
                    </label>
                    <input
                      type="password"
                      maxLength={6}
                      value={inputPin}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setInputPin(val);
                      }}
                      placeholder="••••••"
                      autoFocus
                      className="w-full text-center px-4 py-3 rounded-xl bg-blue-950/90 border-2 border-blue-400 focus:border-cyan-300 text-white font-mono text-xl tracking-[0.4em] outline-none shadow-inner transition-all"
                    />
                    <p className="text-[10px] text-blue-300/70 text-center font-mono mt-1.5">
                      Type on keyboard or use metallic keypad below
                    </p>
                  </div>

                  <div className="pt-1 flex items-center gap-2">
                    <button
                      type="submit"
                      disabled={!inputPin.trim()}
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm tracking-wide shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Enter ATM</span>
                    </button>
                  </div>
                </form>

                <div className="text-center text-[11px] text-blue-300/60 font-mono">
                  Press CANCEL on keypad to cancel & eject card
                </div>
              </div>
            )}

            {/* SCREEN: LOADING */}
            {screen === 'loading' && (
              <div className="relative z-10 flex flex-col items-center justify-center h-full py-12 space-y-4">
                <div className="w-12 h-12 rounded-full border-4 border-cyan-400/30 border-t-cyan-400 animate-spin" />
                <div className="text-center">
                  <h3 className="text-base font-bold text-white tracking-wide">{loadingTitle}</h3>
                  <p className="text-xs text-blue-300/80 mt-1">{loadingSub}</p>
                </div>
              </div>
            )}

            {/* SCREEN 2: MAIN MENU */}
            {screen === 'menu' && (
              <div className="relative z-10 flex flex-col justify-between h-full space-y-4">
                <div className="flex items-center justify-between border-b border-blue-500/30 pb-2">
                  <div>
                    <h2 className="text-base font-bold text-white">
                      {service.currentAccount?.holderName || insertedCard.holderName}
                    </h2>
                    <p className="text-xs text-blue-300/80 font-mono">
                      Card Account #{maskAccountNumber(service.loggedInCard || insertedCard.accountNumber)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleExitAtm}
                    className="px-2.5 py-1 rounded-lg bg-blue-900/40 hover:bg-rose-900/40 border border-blue-500/40 text-xs text-blue-200 hover:text-rose-200 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Exit ATM</span>
                  </button>
                </div>

                <div className="text-center">
                  <p className="text-xs uppercase tracking-wider font-mono text-cyan-300">
                    Please select a transaction
                  </p>
                </div>

                {/* 4 Main Options Grid */}
                <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto w-full">
                  <button
                    type="button"
                    onClick={() => handleSelectAction('withdraw')}
                    className="p-3.5 rounded-xl bg-blue-900/50 hover:bg-blue-800/80 border border-blue-400/40 hover:border-cyan-300 text-left transition-all group cursor-pointer"
                  >
                    <div className="font-bold text-sm text-white group-hover:text-cyan-300 flex items-center justify-between">
                      <span>Withdraw</span>
                      <span className="text-xs text-blue-400 font-mono">[1]</span>
                    </div>
                    <p className="text-[11px] text-blue-200/70 mt-1">Dispense cash from account</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectAction('deposit')}
                    className="p-3.5 rounded-xl bg-blue-900/50 hover:bg-blue-800/80 border border-blue-400/40 hover:border-cyan-300 text-left transition-all group cursor-pointer"
                  >
                    <div className="font-bold text-sm text-white group-hover:text-cyan-300 flex items-center justify-between">
                      <span>Deposit</span>
                      <span className="text-xs text-blue-400 font-mono">[2]</span>
                    </div>
                    <p className="text-[11px] text-blue-200/70 mt-1">Deposit cash into account</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectAction('inquire')}
                    className="p-3.5 rounded-xl bg-blue-900/50 hover:bg-blue-800/80 border border-blue-400/40 hover:border-cyan-300 text-left transition-all group cursor-pointer"
                  >
                    <div className="font-bold text-sm text-white group-hover:text-cyan-300 flex items-center justify-between">
                      <span>Inquire Balance</span>
                      <span className="text-xs text-blue-400 font-mono">[3]</span>
                    </div>
                    <p className="text-[11px] text-blue-200/70 mt-1">Check current balance</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectAction('history')}
                    className="p-3.5 rounded-xl bg-blue-900/50 hover:bg-blue-800/80 border border-blue-400/40 hover:border-cyan-300 text-left transition-all group cursor-pointer"
                  >
                    <div className="font-bold text-sm text-white group-hover:text-cyan-300 flex items-center justify-between">
                      <span>History</span>
                      <span className="text-xs text-blue-400 font-mono">[4]</span>
                    </div>
                    <p className="text-[11px] text-blue-200/70 mt-1">View transaction ledger</p>
                  </button>
                </div>

                <div className="text-center text-[11px] text-blue-300/60 font-mono">
                  Select an option or tap ATM soft keys
                </div>
              </div>
            )}

            {/* SCREEN 3: ACCOUNT TYPE SELECTION */}
            {screen === 'account-type' && (
              <div className="relative z-10 flex flex-col justify-between h-full space-y-4">
                <div className="text-center space-y-1">
                  <h2 className="text-lg font-bold text-white">Select Account Type</h2>
                  <p className="text-xs text-blue-200/80">
                    Choose which account to conduct this {pendingAction} transaction with
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto w-full">
                  {/* Savings Account */}
                  <button
                    type="button"
                    onClick={() => handleChooseAccountType('savings')}
                    className="p-4 rounded-xl bg-gradient-to-br from-blue-900/60 to-indigo-900/60 hover:from-blue-800 hover:to-indigo-800 border-2 border-blue-400/40 hover:border-cyan-300 text-left transition-all cursor-pointer"
                  >
                    <div className="font-bold text-sm text-white flex items-center justify-between">
                      <span>Savings Account</span>
                      <span className="text-xs text-cyan-400 font-mono">SA</span>
                    </div>
                    <div className="mt-2 space-y-1 text-xs text-blue-200/80">
                      <div>Maintaining: <strong className="text-white">PHP 500.00</strong></div>
                      <div>Max Withdrawal: <strong className="text-white">PHP 20,000.00</strong></div>
                      <div>Withdrawal Fee: <strong className="text-emerald-400">FREE</strong></div>
                    </div>
                  </button>

                  {/* Checking Account */}
                  <button
                    type="button"
                    onClick={() => handleChooseAccountType('checking')}
                    className="p-4 rounded-xl bg-gradient-to-br from-blue-900/60 to-indigo-900/60 hover:from-blue-800 hover:to-indigo-800 border-2 border-blue-400/40 hover:border-cyan-300 text-left transition-all cursor-pointer"
                  >
                    <div className="font-bold text-sm text-white flex items-center justify-between">
                      <span>Checking Account</span>
                      <span className="text-xs text-amber-400 font-mono">CA</span>
                    </div>
                    <div className="mt-2 space-y-1 text-xs text-blue-200/80">
                      <div>Maintaining: <strong className="text-white">PHP 0.00</strong></div>
                      <div>Max Withdrawal: <strong className="text-white">PHP 50,000.00</strong></div>
                      <div>Withdrawal Fee: <strong className="text-amber-400">PHP 15.00</strong></div>
                    </div>
                  </button>
                </div>

                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => setScreen('menu')}
                    className="px-4 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-xs text-slate-300 hover:text-white transition-colors cursor-pointer"
                  >
                    Cancel & Back to Menu
                  </button>
                </div>
              </div>
            )}

            {/* SCREEN 4: CASH WITHDRAWAL / DEPOSIT */}
            {screen === 'cash' && (
              <div className="relative z-10 flex flex-col justify-between h-full space-y-3">
                <div className="flex items-center justify-between border-b border-blue-500/30 pb-2">
                  <div>
                    <h2 className="text-sm md:text-base font-bold text-white capitalize">
                      {pendingAction} Cash ({currentAcc?.accountType})
                    </h2>
                    <div className="flex items-center gap-2.5 text-[11px] mt-0.5">
                      <p className="text-blue-200/80">
                        Balance: <strong className="text-cyan-300">{formatPHP(currentAcc?.balance || 0)}</strong>
                      </p>
                      <span className="text-blue-400/50">|</span>
                      <p className="text-emerald-300 font-mono">
                        Pocket Cash: <strong className="text-emerald-400">{formatPHP(walletCash)}</strong>
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setScreen('menu')}
                    className="text-xs text-blue-300 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>
                </div>

                {cashError && (
                  <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-500/60 text-rose-200 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{cashError}</span>
                  </div>
                )}

                {/* Pocket empty warning on deposit */}
                {pendingAction === 'deposit' && walletCash <= 0 && (
                  <div className="p-2.5 rounded-xl bg-amber-950/80 border border-amber-500/60 text-amber-200 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Your pocket is empty (PHP 0.00). You cannot deposit without cash in hand. Withdraw cash first!</span>
                  </div>
                )}

                {/* Amount input field */}
                <div className="max-w-md mx-auto w-full">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-mono uppercase text-blue-300">
                      Amount (PHP)
                    </label>
                    {pendingAction === 'deposit' && walletCash > 0 && (
                      <span className="text-[10px] text-emerald-400 font-mono">
                        Max Deposit: {formatPHP(walletCash)}
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={inputAmount}
                    onChange={(e) => setInputAmount(e.target.value)}
                    placeholder={pendingAction === 'deposit' ? `Max pocket: PHP ${walletCash.toLocaleString()}` : "Enter amount or pick quick cash below"}
                    className="w-full px-4 py-2.5 rounded-xl bg-blue-950/80 border-2 border-cyan-400 text-white font-mono text-base md:text-lg font-bold outline-none"
                  />
                </div>

                {/* Quick Denominations */}
                <div className="space-y-1.5 max-w-md mx-auto w-full">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-blue-300 font-mono block">
                      Quick Denominations:
                    </span>
                    {pendingAction === 'deposit' && walletCash > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setInputAmount(String(walletCash));
                          playKeypadBeep(1200);
                        }}
                        className="text-[10px] text-emerald-400 hover:text-emerald-300 font-mono font-bold underline cursor-pointer"
                      >
                        Deposit All Pocket Cash ({formatPHP(walletCash)})
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {['500', '1000', '2000', '5000', '10000', '20000'].map((amt) => {
                      const num = parseInt(amt, 10);
                      const isExceedsPocket = pendingAction === 'deposit' && num > walletCash;
                      return (
                        <button
                          key={amt}
                          type="button"
                          disabled={isExceedsPocket}
                          onClick={() => {
                            setInputAmount(amt);
                            playKeypadBeep(1200);
                          }}
                          className={`py-1.5 px-2 rounded-lg border text-xs font-mono font-semibold transition-all ${
                            isExceedsPocket
                              ? 'bg-slate-900/30 border-slate-700/30 text-slate-500 cursor-not-allowed opacity-50 line-through'
                              : 'bg-blue-900/60 hover:bg-blue-800 border-blue-500/40 text-cyan-200 hover:text-white cursor-pointer'
                          }`}
                        >
                          ₱{num.toLocaleString()}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Confirm button */}
                <div className="flex items-center gap-3 max-w-md mx-auto w-full pt-1">
                  <button
                    type="button"
                    onClick={handleConfirmCash}
                    disabled={!inputAmount.trim() || (pendingAction === 'deposit' && walletCash <= 0)}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm tracking-wide shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Confirm {pendingAction === 'withdraw' ? 'Withdrawal' : 'Deposit'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* SCREEN 5: COMPLETED */}
            {screen === 'completed' && (
              <div className="relative z-10 flex flex-col justify-between h-full space-y-4 text-center py-2">
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-300 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    Transaction Successful!
                  </h2>
                  <p className="text-xs text-blue-200/80">
                    {pendingAction === 'withdraw'
                      ? (dispensedCash?.isDispensed || (withdrawnCash && !withdrawnCash.collected))
                        ? `Cash has popped up in the cash dispenser on the lower right corner! Total cash stacked in dispenser: ${formatPHP(dispensedCash?.amount || withdrawnCash?.amount || 0)}. Click the protruding bills to take your cash.`
                        : 'Cash collected successfully and added to your wallet.'
                      : 'Your cash deposit has been credited to your account.'}
                  </p>
                </div>

                {/* If cash is sitting in dispenser and not yet collected, provide quick action */}
                {(dispensedCash?.isDispensed || (withdrawnCash && !withdrawnCash.collected)) && (
                  <button
                    type="button"
                    onClick={handleTakeCash}
                    className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-xs tracking-wide shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 mx-auto animate-pulse transition-all transform hover:scale-105 cursor-pointer"
                  >
                    <Banknote className="w-4 h-4 text-emerald-200" />
                    <span>Take Stacked Cash from Dispenser on Lower Right (+{formatPHP(dispensedCash?.amount || withdrawnCash?.amount || 0)})</span>
                  </button>
                )}

                {lastTx && (
                  <div className="max-w-sm mx-auto w-full bg-blue-950/60 border border-blue-400/40 rounded-xl p-3 text-xs font-mono text-left space-y-1">
                    <div className="flex justify-between">
                      <span className="text-blue-300">Transaction ID:</span>
                      <span className="text-white">{lastTx.transaction_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-300">Amount:</span>
                      <span className="text-emerald-400 font-bold">{formatPHP(lastTx.amount)}</span>
                    </div>
                    {lastTx.fee > 0 && (
                      <div className="flex justify-between">
                        <span className="text-blue-300">Fee:</span>
                        <span className="text-amber-400">{formatPHP(lastTx.fee)}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-blue-400/20 pt-1">
                      <span className="text-blue-300">New Balance:</span>
                      <span className="text-cyan-300 font-bold">{formatPHP(lastTx.balance_after)}</span>
                    </div>
                    {pendingAction === 'deposit' && (
                      <div className="flex justify-between border-t border-blue-400/20 pt-1 text-emerald-300">
                        <span>Remaining Pocket Cash:</span>
                        <span className="font-bold">{formatPHP(walletCash)}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-center gap-3 max-w-sm mx-auto w-full">
                  <button
                    type="button"
                    onClick={() => setShowReceiptModal(true)}
                    className="py-2.5 px-4 rounded-xl bg-blue-900/60 hover:bg-blue-800 border border-blue-400/50 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Receipt className="w-4 h-4 text-cyan-300" />
                    <span>View Receipt</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setScreen('menu')}
                    className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-xs font-bold text-white shadow transition-all cursor-pointer"
                  >
                    Another Transaction
                  </button>
                </div>
              </div>
            )}

            {/* SCREEN 6: INQUIRE BALANCE */}
            {screen === 'inquire' && (
              <div className="relative z-10 flex flex-col justify-between h-full space-y-4">
                <div className="text-center space-y-0.5">
                  <h2 className="text-lg font-bold text-white">Account Balance Inquiry</h2>
                  <p className="text-xs text-blue-200/80 font-mono">
                    {currentAcc?.accountType} · Account #{currentAcc?.maskedAccountNumber}
                  </p>
                </div>

                <div className="max-w-md mx-auto w-full bg-blue-950/70 border border-blue-400/40 rounded-xl p-4 text-xs font-mono space-y-2.5">
                  <div className="flex justify-between items-center text-sm border-b border-blue-400/30 pb-2">
                    <span className="text-blue-300 font-sans">Current Balance:</span>
                    <span className="text-cyan-300 font-bold text-base">
                      {formatPHP(currentAcc?.balance || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-300 font-sans">Max Withdrawable:</span>
                    <span className="text-emerald-400 font-bold">
                      {formatPHP(currentAcc?.getMaxWithdrawable() || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-300 font-sans">Maintaining Balance:</span>
                    <span className="text-slate-300">
                      {formatPHP(currentAcc?.maintainingBalance || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-300 font-sans">Withdrawal Fee:</span>
                    <span className="text-slate-300">
                      {formatPHP(currentAcc?.withdrawalFee || 0)}
                    </span>
                  </div>
                </div>

                <div className="flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setScreen('menu')}
                    className="py-2.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors cursor-pointer"
                  >
                    Return to Menu
                  </button>
                </div>
              </div>
            )}

            {/* SCREEN 7: TRANSACTION HISTORY */}
            {screen === 'history' && (
              <div className="relative z-10 flex flex-col justify-between h-full space-y-3">
                <div className="flex items-center justify-between border-b border-blue-500/30 pb-2">
                  <div>
                    <h2 className="text-sm md:text-base font-bold text-white">
                      Transaction Ledger ({currentAcc?.accountType})
                    </h2>
                    <p className="text-[11px] text-blue-300/80 font-mono">
                      Account #{currentAcc?.maskedAccountNumber}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setScreen('menu')}
                    className="text-xs text-blue-300 hover:text-white cursor-pointer"
                  >
                    Back
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto max-h-48 border border-blue-500/30 rounded-xl bg-blue-950/50 p-2">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="border-b border-blue-400/30 text-blue-300 text-[10px]">
                        <th className="p-1.5">ID</th>
                        <th className="p-1.5">Type</th>
                        <th className="p-1.5">Date</th>
                        <th className="p-1.5 text-right">Amount</th>
                        <th className="p-1.5 text-right">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-blue-400/20">
                      {(currentAcc?.transactions || []).map((t) => (
                        <tr key={t.transaction_id} className="hover:bg-blue-900/30">
                          <td className="p-1.5 text-slate-300 text-[10px]">{t.transaction_id}</td>
                          <td className="p-1.5 text-white font-sans">{t.tx_type}</td>
                          <td className="p-1.5 text-slate-400 text-[10px]">{t.timestamp}</td>
                          <td className="p-1.5 text-right text-emerald-400">{formatPHP(t.amount)}</td>
                          <td className="p-1.5 text-right text-cyan-300">{formatPHP(t.balance_after)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => setScreen('menu')}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs cursor-pointer"
                  >
                    Return to Main Menu
                  </button>
                </div>
              </div>
            )}

            {/* SCREEN 8: THANK YOU & CARD EJECT */}
            {screen === 'thankyou' && (
              <div className="relative z-10 flex flex-col items-center justify-center h-full py-10 space-y-4 text-center">
                <div className="w-14 h-14 rounded-full bg-blue-500/20 border-2 border-cyan-400 flex items-center justify-center text-cyan-300">
                  <Sparkles className="w-8 h-8 animate-spin" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    Thank You for Banking with ExpressBank!
                  </h2>
                  <p className="text-xs text-blue-200/80 mt-1">
                    Your card has been returned. Returning to POV kiosk view...
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right Side ATM Soft Keys */}
          <div className="hidden sm:flex flex-col gap-6 py-8">
            {[1, 2, 3, 4].map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => playKeypadBeep(1050 + i * 50)}
                className="w-4 h-8 rounded-r-md bg-gradient-to-l from-slate-400 to-slate-300 border border-slate-500 shadow active:-translate-x-0.5 cursor-pointer"
                aria-label={`ATM Right Soft Key ${i}`}
              />
            ))}
          </div>
        </div>

        {/* Lower Hardware Controls: Keypad, Card Reader, Cash Dispenser */}
        <div className="w-full mt-5 pt-4 border-t border-slate-400 grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
          {/* Card Reader Slot Indicator on Kiosk */}
          <div className="md:col-span-3 flex flex-col items-center p-3 rounded-xl bg-slate-300 border border-slate-400 shadow-inner">
            <span className="text-[10px] font-mono font-bold text-slate-700 uppercase mb-1">
              Smart Card Reader
            </span>
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center shadow-[0_0_15px_#10b981]">
              <div className="w-10 h-2 bg-emerald-500 rounded-full animate-pulse" />
            </div>
            <span className="text-[9px] font-mono text-emerald-800 font-bold mt-1">CARD INSERTED</span>
          </div>

          {/* Metallic 4x4 Physical Pin Pad */}
          <div className="md:col-span-5 p-3 rounded-2xl bg-gradient-to-b from-slate-300 to-slate-400 border border-slate-500 shadow-md">
            <div className="text-[10px] font-mono font-bold text-slate-700 uppercase mb-2 text-center">
              Tactile Metallic Keypad
            </div>
            <div className="grid grid-cols-4 gap-2">
              {['1', '2', '3', 'CANCEL'].map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleKeypadPress(key)}
                  className={`h-9 rounded-lg font-mono font-extrabold text-xs shadow-md transition-all active:translate-y-0.5 active:shadow-inner flex items-center justify-center cursor-pointer ${
                    key === 'CANCEL'
                      ? 'bg-gradient-to-b from-red-500 to-red-700 hover:from-red-400 hover:to-red-600 text-white text-[10px] border border-red-800'
                      : 'bg-gradient-to-b from-slate-100 via-slate-200 to-slate-400 hover:from-white hover:to-slate-300 text-slate-800 border-t border-l border-white/80 border-r border-b border-slate-500'
                  }`}
                >
                  {key}
                </button>
              ))}

              {['4', '5', '6', 'CLEAR'].map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleKeypadPress(key)}
                  className={`h-9 rounded-lg font-mono font-extrabold text-xs shadow-md transition-all active:translate-y-0.5 active:shadow-inner flex items-center justify-center relative cursor-pointer ${
                    key === 'CLEAR'
                      ? 'bg-gradient-to-b from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 text-[10px] border border-amber-700'
                      : 'bg-gradient-to-b from-slate-100 via-slate-200 to-slate-400 hover:from-white hover:to-slate-300 text-slate-800 border-t border-l border-white/80 border-r border-b border-slate-500'
                  }`}
                >
                  <span>{key}</span>
                  {/* Tactile braille dot bump on key '5' */}
                  {key === '5' && (
                    <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-slate-500/80 shadow-inner" />
                  )}
                </button>
              ))}

              {['7', '8', '9', 'ENTER'].map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleKeypadPress(key)}
                  className={`h-9 rounded-lg font-mono font-extrabold text-xs shadow-md transition-all active:translate-y-0.5 active:shadow-inner flex items-center justify-center cursor-pointer ${
                    key === 'ENTER'
                      ? 'bg-gradient-to-b from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600 text-white text-[10px] border border-emerald-800'
                      : 'bg-gradient-to-b from-slate-100 via-slate-200 to-slate-400 hover:from-white hover:to-slate-300 text-slate-800 border-t border-l border-white/80 border-r border-b border-slate-500'
                  }`}
                >
                  {key}
                </button>
              ))}

              {['0', '00', '.', 'BLANK'].map((key) =>
                key === 'BLANK' ? (
                  <div key={key} className="h-9" />
                ) : (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleKeypadPress(key)}
                    className="h-9 rounded-lg bg-gradient-to-b from-slate-100 via-slate-200 to-slate-400 hover:from-white hover:to-slate-300 text-slate-800 border-t border-l border-white/80 border-r border-b border-slate-500 font-mono font-extrabold text-xs shadow-md active:translate-y-0.5 active:shadow-inner flex items-center justify-center cursor-pointer"
                  >
                    {key}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Cash Dispenser Shutter Slot & Banknotes on the Lower Right Corner */}
          <div className="md:col-span-4 p-3 rounded-2xl bg-slate-300 border border-slate-400 shadow-inner flex flex-col justify-between relative">
            <div className="flex items-center justify-between mb-1.5 px-1">
              <span className="text-[10px] font-mono font-bold text-slate-700 uppercase">
                Cash Dispenser Shutter
              </span>
              {(dispensedCash?.isDispensed || (withdrawnCash && !withdrawnCash.collected)) && (
                <span className="text-[9px] font-mono text-emerald-700 font-extrabold animate-pulse">
                  ● CASH STACKED ({formatPHP(dispensedCash?.amount || withdrawnCash?.amount || 0)})
                </span>
              )}
            </div>

            {/* Shutter visual */}
            <div className="relative w-full h-18 bg-slate-950 rounded-lg border-2 border-slate-600 overflow-visible flex items-center justify-center shadow-inner">
              {(dispensedCash?.isDispensed || (withdrawnCash && !withdrawnCash.collected)) ? (
                /* Banknotes emerging on the lower right corner dispenser */
                <button
                  type="button"
                  onClick={handleTakeCash}
                  className="cursor-pointer group relative flex flex-col items-center animate-slide-out-cash z-20 hover:scale-105 active:scale-95 transition-transform focus:outline-none"
                  aria-label={`Take dispensed cash: ${formatPHP(dispensedCash?.amount || withdrawnCash?.amount || 0)}`}
                >
                  <div className="flex items-center -space-x-4 filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)]">
                    <div className="w-22 h-10 rounded bg-gradient-to-r from-[#1e4b85] via-[#2c6cb0] to-[#1a3d6d] border-2 border-cyan-300 text-white font-mono text-[9px] font-extrabold flex items-center justify-between px-2 shadow-lg rotate-[-5deg] group-hover:rotate-[-7deg] transition-transform">
                      <span className="text-[8px] opacity-80">BSP</span>
                      <span className="text-xs font-black">
                        {(dispensedCash?.amount || withdrawnCash?.amount || 0) >= 1000 ? '₱1,000' : '₱500'}
                      </span>
                    </div>
                    {((dispensedCash?.amount || withdrawnCash?.amount || 0) >= 1500) && (
                      <div className="w-20 h-10 rounded bg-gradient-to-r from-[#8f6d14] via-[#c69a2a] to-[#73550e] border-2 border-amber-300 text-white font-mono text-[9px] font-extrabold flex items-center justify-between px-2 shadow-lg rotate-[4deg] group-hover:rotate-[6deg] transition-transform">
                        <span className="text-[8px] opacity-80">BSP</span>
                        <span className="text-xs font-black">₱500</span>
                      </div>
                    )}
                    {((dispensedCash?.amount || withdrawnCash?.amount || 0) >= 2500) && (
                      <div className="w-18 h-9 rounded bg-gradient-to-r from-[#2f1b4a] via-[#4c2b77] to-[#25123d] border-2 border-purple-300 text-white font-mono text-[9px] font-extrabold flex items-center justify-between px-2 shadow-lg rotate-[9deg] group-hover:rotate-[11deg] transition-transform">
                        <span className="text-[8px] opacity-80">BSP</span>
                        <span className="text-xs font-black">₱100</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-1 px-3 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black tracking-tight shadow-md animate-bounce flex items-center gap-1">
                    <span>TAKE STACK ({formatPHP(dispensedCash?.amount || withdrawnCash?.amount || 0)})</span>
                    <span>👆</span>
                  </div>
                </button>
              ) : shutterOpen && withdrawnCash?.collected ? (
                <div className="text-emerald-400 font-mono text-[10px] font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Cash Collected Into Wallet</span>
                </div>
              ) : (
                <div className="w-full h-2 bg-slate-700 border-y border-slate-600 flex items-center justify-center">
                  <div className="w-24 h-1 bg-slate-500 rounded-full" />
                </div>
              )}

              {/* FLOATING POPUP: +(the amount of cash you withdraw) */}
              {withdrawnCash?.showPopup && (
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-40 pointer-events-none animate-float-up">
                  <div className="px-4 py-1.5 rounded-full bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-black font-mono text-sm shadow-[0_10px_25px_rgba(16,185,129,0.7)] border-2 border-emerald-300 flex items-center gap-1.5 whitespace-nowrap">
                    <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
                    <span>+{formatPHP(withdrawnCash.amount)}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-2 text-center">
              <span className="text-[9px] font-mono text-slate-600">
                {(dispensedCash?.isDispensed || (withdrawnCash && !withdrawnCash.collected))
                  ? 'Philippine Peso notes dispensed! Click cash above to collect'
                  : shutterOpen && withdrawnCash?.collected
                  ? 'All cash collected into wallet'
                  : 'Locked until withdrawal'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Realistic Printed Thermal Receipt Modal */}
      {showReceiptModal && lastTx && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-sm bg-neutral-100 text-neutral-900 rounded-xl p-6 shadow-2xl font-mono text-xs border border-neutral-300 space-y-4">
            <button
              type="button"
              onClick={() => setShowReceiptModal(false)}
              className="absolute top-3 right-3 text-neutral-500 hover:text-black cursor-pointer"
              aria-label="Close Receipt"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Receipt Header */}
            <div className="text-center border-b-2 border-dashed border-neutral-400 pb-3">
              <h4 className="font-extrabold text-sm tracking-wider">EXPRESSBANK ATM</h4>
              <p className="text-[10px] text-neutral-600">TERMINAL #NCR-5884 · 24/7</p>
              <p className="text-[10px] text-neutral-500">{lastTx.timestamp}</p>
            </div>

            {/* Receipt Line Items */}
            <div className="space-y-1.5 py-1">
              <div className="flex justify-between">
                <span>CARD NUMBER:</span>
                <span>•••• •••• •••• {insertedCard.accountNumber.slice(-3)}</span>
              </div>
              <div className="flex justify-between">
                <span>CUSTOMER:</span>
                <span className="uppercase font-bold">{insertedCard.holderName}</span>
              </div>
              <div className="flex justify-between">
                <span>TXN NUMBER:</span>
                <span>{lastTx.transaction_id}</span>
              </div>
              <div className="flex justify-between">
                <span>ACTION:</span>
                <span className="font-bold">{lastTx.tx_type}</span>
              </div>
              <div className="flex justify-between">
                <span>AMOUNT:</span>
                <span className="font-bold">{formatPHP(lastTx.amount)}</span>
              </div>
              {lastTx.fee > 0 && (
                <div className="flex justify-between">
                  <span>TERMINAL FEE:</span>
                  <span>{formatPHP(lastTx.fee)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-dashed border-neutral-400 pt-1.5 font-bold text-sm">
                <span>AVAIL BAL:</span>
                <span>{formatPHP(lastTx.balance_after)}</span>
              </div>
            </div>

            {/* Receipt Footer */}
            <div className="text-center border-t-2 border-dashed border-neutral-400 pt-3 text-[10px] text-neutral-500 space-y-1">
              <p>THANK YOU FOR BANKING WITH US</p>
              <p>RETAIN THIS RECEIPT FOR YOUR RECORDS</p>
            </div>

            <button
              type="button"
              onClick={() => setShowReceiptModal(false)}
              className="w-full py-2.5 rounded-lg bg-neutral-900 text-white font-bold text-xs cursor-pointer"
            >
              Done / Close Receipt
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
