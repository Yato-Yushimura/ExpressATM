import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Wallet,
  LogOut,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  Sparkles,
  ArrowRight,
  Info,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { formatPHP } from '../utils/atmLogic.js';
import {
  playKeypadBeep,
  playCardInsert,
  playWalletRustle,
  playCashGrab,
  toggleSoundMute,
  getSoundMuted,
} from '../utils/soundEffects.js';

export const AtmPovKiosk = ({
  activeProfile,
  onInteractUseCard,
  onOpenWallet,
  onLeaveAtm,
  dispensedCash,
  onTakeDispensedCash,
}) => {
  const [showPinPeek, setShowPinPeek] = useState(false);
  const [muted, setMuted] = useState(getSoundMuted());
  const [hoveredHotspot, setHoveredHotspot] = useState(null);
  const [floatingCashPopup, setFloatingCashPopup] = useState(null);
  const [dialogueText, setDialogueText] = useState(
    dispensedCash?.isDispensed
      ? `Cash is sitting in the cash dispenser slot! Click the dispenser button below to take your ${formatPHP(dispensedCash.amount)}.`
      : 'You stand directly in front of the ExpressBank ATM. The green circular card reader is pulsing with light.'
  );

  useEffect(() => {
    if (dispensedCash?.isDispensed) {
      setDialogueText(
        `Philippine Peso cash (${formatPHP(dispensedCash.amount)}) is sitting in the ATM cash dispenser slot! Click the dispenser button to collect it into your wallet.`
      );
    }
  }, [dispensedCash]);

  const handleCardSlotClick = () => {
    playCardInsert();
    setDialogueText('You align your card with the card reader slot...');
    setTimeout(() => {
      onInteractUseCard();
    }, 400);
  };

  const handleScreenClick = () => {
    playKeypadBeep(1400);
    setDialogueText('ATM Screen displays: "WELCOME TO EXPRESSBANK. PLEASE INSERT YOUR CARD TO BEGIN."');
  };

  const handleKeypadClick = () => {
    playKeypadBeep(1200);
    setDialogueText('You tap the metal keypad. The ATM emits a clear digital confirmation beep.');
  };

  const handleCashSlotClick = () => {
    if (dispensedCash && dispensedCash.isDispensed) {
      playCashGrab();
      const amountTaken = onTakeDispensedCash ? onTakeDispensedCash() : dispensedCash.amount;
      setFloatingCashPopup(amountTaken);
      setDialogueText(
        `You reach into the cash dispenser and take ${formatPHP(amountTaken)} in cash! The money has been added to your wallet.`
      );
      try {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.72, x: 0.5 },
          colors: ['#10b981', '#34d399', '#fbbf24', '#60a5fa'],
        });
      } catch {}

      setTimeout(() => {
        setFloatingCashPopup(null);
      }, 2500);
    } else {
      playKeypadBeep(900);
      setDialogueText('Cash dispenser shutter is locked. Complete a cash withdrawal to open the shutter.');
    }
  };

  return (
    <div className="relative w-full h-full min-h-screen bg-slate-950 flex flex-col justify-between overflow-hidden select-none font-sans text-slate-100">
      {/* IMMERSIVE OUTDOOR STREET BACKGROUND (Manila Night Street Setting) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
        <div className="absolute inset-0 bg-gradient-to-b from-[#02050e] via-[#071124] to-[#040814]" />

        {/* Distant city high-rise skyline silhouettes & window lights */}
        <div className="absolute top-8 inset-x-0 h-44 flex items-end justify-between px-6 opacity-30">
          <div className="w-16 h-36 bg-slate-900 border-x border-t border-slate-700/50 flex flex-col justify-around p-1">
            <div className="grid grid-cols-2 gap-1 opacity-60">
              <div className="w-1.5 h-1.5 bg-amber-200/80 rounded-[1px]" />
              <div className="w-1.5 h-1.5 bg-cyan-200/80 rounded-[1px]" />
              <div className="w-1.5 h-1.5 bg-amber-200/80 rounded-[1px]" />
              <div className="w-1.5 h-1.5 bg-slate-700 rounded-[1px]" />
            </div>
          </div>
          <div className="w-24 h-44 bg-slate-950 border-x border-t border-slate-700/60 flex flex-col justify-around p-1">
            <div className="grid grid-cols-3 gap-1 opacity-70">
              <div className="w-1.5 h-1.5 bg-yellow-100 rounded-[1px]" />
              <div className="w-1.5 h-1.5 bg-slate-800 rounded-[1px]" />
              <div className="w-1.5 h-1.5 bg-yellow-100 rounded-[1px]" />
            </div>
          </div>
          <div className="w-20 h-32 bg-slate-900 border-x border-t border-slate-700/50" />
        </div>

        {/* Ambient streetlights & warm neon city glow */}
        <div className="absolute top-10 left-12 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl" />
        <div className="absolute top-24 right-16 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-48 bg-cyan-500/10 rounded-full blur-3xl" />

        {/* LEFT FLANK: 24/7 Convenience Store / Mini-Mart Storefront */}
        <div className="absolute inset-y-0 left-0 w-1/4 min-w-[190px] max-w-xs bg-gradient-to-r from-[#0d1424] to-[#11192d] border-r-2 border-slate-700/80 shadow-2xl flex flex-col justify-between p-3.5 z-0">
          <div className="space-y-1">
            <div className="px-2.5 py-1.5 rounded-lg bg-emerald-950/90 border border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.3)] text-center">
              <div className="text-[11px] font-black tracking-wider text-emerald-400 font-sans">
                24/7 CONVENIENCE
              </div>
              <div className="text-[8px] font-mono text-emerald-200 tracking-widest uppercase">
                ● OPEN ALL NIGHT
              </div>
            </div>

            <div className="mt-3 w-full h-64 rounded-xl border-2 border-slate-600 bg-gradient-to-b from-amber-500/15 via-blue-900/30 to-slate-950 p-2.5 shadow-inner relative overflow-hidden flex flex-col justify-between">
              <div className="absolute inset-0 bg-gradient-to-t from-transparent via-amber-200/5 to-amber-300/10 pointer-events-none" />
              <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />

              <div className="relative z-10 text-[9px] font-bold text-amber-300 uppercase tracking-wider flex items-center justify-between border-b border-amber-400/20 pb-1">
                <span>BEVERAGE & SNACKS</span>
                <span className="text-[7px] text-emerald-400">INDOORS</span>
              </div>

              <div className="relative z-10 space-y-2 py-1">
                <div className="h-6 rounded bg-slate-900/80 border border-slate-700/70 p-1 flex items-center justify-around">
                  <div className="w-2.5 h-4 rounded-sm bg-red-600 shadow-sm" />
                  <div className="w-2.5 h-4 rounded-sm bg-blue-600 shadow-sm" />
                  <div className="w-2.5 h-4 rounded-sm bg-emerald-600 shadow-sm" />
                  <div className="w-2.5 h-4 rounded-sm bg-amber-500 shadow-sm" />
                  <div className="w-2.5 h-4 rounded-sm bg-purple-600 shadow-sm" />
                </div>
                <div className="h-6 rounded bg-slate-900/80 border border-slate-700/70 p-1 flex items-center justify-around">
                  <div className="w-3 h-3.5 rounded bg-yellow-500 shadow-sm" />
                  <div className="w-3 h-3.5 rounded bg-orange-600 shadow-sm" />
                  <div className="w-3 h-3.5 rounded bg-red-500 shadow-sm" />
                  <div className="w-3 h-3.5 rounded bg-teal-600 shadow-sm" />
                </div>
                <div className="h-6 rounded bg-slate-900/80 border border-slate-700/70 p-1 flex items-center justify-around">
                  <div className="w-4 h-3 rounded bg-amber-700 shadow-sm" />
                  <div className="w-4 h-3 rounded bg-blue-800 shadow-sm" />
                  <div className="w-4 h-3 rounded bg-emerald-800 shadow-sm" />
                </div>
              </div>

              <div className="relative z-10 text-[8px] font-mono text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800">
                <span>AIR-CONDITIONED</span>
                <span className="text-cyan-300 font-bold">ATM PARTNER</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-[9px] text-slate-300">
              <span className="text-amber-400 text-xs">🛵</span>
              <span>Motorcycle Parking Zone</span>
            </div>
            <div className="bg-slate-900/90 border border-slate-800 p-2 rounded-lg text-[9px] font-mono text-slate-400 flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>CCTV SECURITY PATROL</span>
            </div>
          </div>
        </div>

        {/* RIGHT FLANK: Street Lamp, Philippine Road Signs, and Night Urban Avenue */}
        <div className="absolute inset-y-0 right-0 w-1/4 min-w-[190px] max-w-xs bg-gradient-to-l from-[#0d1424] to-[#11192d] border-l-2 border-slate-700/80 shadow-2xl flex flex-col justify-between p-3.5 z-0">
          <div className="space-y-2">
            <div className="px-3 py-2 rounded-lg bg-[#00472f] border-2 border-white/60 shadow-lg text-white">
              <div className="text-[11px] font-black tracking-wider uppercase font-sans">
                AYALA AVENUE
              </div>
              <div className="text-[8px] font-mono text-emerald-200 tracking-wide uppercase flex justify-between">
                <span>MAKATI CBD</span>
                <span>METRO MANILA</span>
              </div>
            </div>

            <div className="flex flex-col items-center py-2">
              <div className="w-12 h-5 rounded-t-full bg-gradient-to-b from-amber-300 to-amber-500 shadow-[0_0_40px_#f59e0b] border-t border-amber-200" />
              <div className="w-3 h-10 bg-slate-700 border-x border-slate-600" />
              <div className="w-28 h-20 bg-gradient-to-b from-amber-400/20 via-amber-400/5 to-transparent blur-md pointer-events-none" />
            </div>

            <div className="rounded-xl border border-blue-500/30 bg-blue-950/40 p-2.5 text-[9px] text-blue-200/90 space-y-1">
              <div className="font-bold text-cyan-300 flex items-center gap-1">
                <span>●</span>
                <span>SAFE BANKING NOTICE</span>
              </div>
              <p className="leading-tight">
                Shield the PIN keypad with your hand while keying in your code. Report any suspicious devices.
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 text-[9px] font-mono text-slate-400">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-emerald-400 font-bold">CROSSWALK</span>
              </div>
              <span>SPEED: 30 KPH</span>
            </div>
            <div className="text-[8px] font-mono text-slate-500 text-center">
              EXPRESSBANK NETWORK · EST. 2026
            </div>
          </div>
        </div>

        {/* OVERHEAD ROOF CANOPY & ATM ILLUMINATION DOWNLIGHTS */}
        <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-slate-950 via-slate-900 to-transparent border-b border-slate-800 z-10 flex items-center justify-center">
          <div className="flex items-center gap-16">
            <div className="w-10 h-2 bg-cyan-400/80 rounded-full shadow-[0_0_20px_#22d3ee]" />
            <div className="px-4 py-1 rounded-full bg-slate-900/90 border border-cyan-500/40 text-[10px] font-mono font-bold text-cyan-300 shadow">
              OUTDOOR 24/7 ATM STATION · WELL LIT ZONE
            </div>
            <div className="w-10 h-2 bg-cyan-400/80 rounded-full shadow-[0_0_20px_#22d3ee]" />
          </div>
        </div>

        {/* OUTDOOR SIDEWALK PAVEMENT, CURB & TACTILE PAVING */}
        <div className="absolute bottom-0 inset-x-0 h-44 bg-gradient-to-t from-slate-950 via-[#0d1424] to-transparent border-t-2 border-slate-700/80 z-0">
          <div
            className="w-full h-full opacity-40"
            style={{
              backgroundImage:
                'repeating-linear-gradient(90deg, rgba(255,255,255,0.08) 0px, rgba(255,255,255,0.08) 2px, transparent 2px, transparent 100px), repeating-linear-gradient(0deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 1px, transparent 1px, transparent 35px)',
              transform: 'perspective(350px) rotateX(55deg)',
              transformOrigin: 'bottom center',
            }}
          />

          <div className="absolute bottom-2 inset-x-1/3 h-8 bg-amber-400/30 border-y-2 border-amber-400/60 flex items-center justify-around px-4 shadow-[0_0_15px_rgba(251,191,36,0.3)]">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="w-1.5 h-4 bg-amber-300 rounded-full opacity-80" />
            ))}
          </div>
        </div>
      </div>

      {/* Main ATM Picture POV centered */}
      <div className="relative z-10 flex-1 flex items-center justify-center overflow-hidden">
        <div className="relative w-full h-full max-w-5xl flex items-center justify-center animate-[pulse_8s_ease-in-out_infinite]">
          <img
            src="/assets/aistudio/image_ccbca15a.png"
            alt="ExpressBank ATM Front View POV"
            className="w-full h-full object-contain max-h-[92vh] drop-shadow-[0_25px_50px_rgba(0,0,0,0.9)] select-none pointer-events-none"
          />

          {/* 1. ATM Screen Hotspot */}
          <button
            type="button"
            onClick={handleScreenClick}
            onMouseEnter={() => {
              setHoveredHotspot('screen');
              setDialogueText('ExpressBank high-contrast ATM color display. Screen prompts to insert card.');
            }}
            onMouseLeave={() => setHoveredHotspot(null)}
            className="absolute top-[41.8%] left-[37.5%] w-[25%] h-[15.5%] rounded-sm cursor-pointer group focus:outline-none focus:ring-2 focus:ring-blue-400"
            aria-label="Inspect ATM Display Screen"
          >
            <div className="w-full h-full bg-blue-950/40 hover:bg-blue-900/30 backdrop-blur-[0.5px] border border-cyan-400/30 group-hover:border-cyan-300 rounded flex flex-col items-center justify-center transition-all p-2">
              <span className="text-[10px] md:text-xs text-cyan-300 font-mono tracking-wider font-semibold animate-pulse drop-shadow">
                EXPRESSBANK 24/7
              </span>
              <span className="text-[9px] md:text-[11px] text-white/90 font-mono mt-1 drop-shadow bg-blue-950/80 px-2 py-0.5 rounded">
                INSERT CARD TO BEGIN
              </span>
              <span className="text-[8px] md:text-[9px] text-cyan-400 font-mono mt-1 opacity-70 group-hover:opacity-100">
                [Click to inspect screen]
              </span>
            </div>
          </button>

          {/* 2. Green Circular Card Slot Hotspot */}
          <button
            type="button"
            onClick={handleCardSlotClick}
            onMouseEnter={() => {
              setHoveredHotspot('cardslot');
              setDialogueText('Contactless Smart Card & Chip Reader. Click to insert your active card!');
            }}
            onMouseLeave={() => setHoveredHotspot(null)}
            className="absolute top-[59.5%] left-[55.5%] w-[7.8%] h-[5.8%] rounded-full cursor-pointer group focus:outline-none focus:ring-2 focus:ring-emerald-400"
            aria-label="Insert Card into Green Card Reader"
          >
            <div className="w-full h-full rounded-full border-2 border-emerald-400 bg-emerald-500/25 group-hover:bg-emerald-400/40 animate-pulse shadow-[0_0_20px_#10b981] flex items-center justify-center transition-all">
              <CreditCard className="w-3.5 h-3.5 text-emerald-300 group-hover:scale-125 transition-transform" />
            </div>
          </button>

          {/* 3. Physical Keypad Hotspot */}
          <button
            type="button"
            onClick={handleKeypadClick}
            onMouseEnter={() => {
              setHoveredHotspot('keypad');
              setDialogueText('Tactile metal PIN keypad with braille indicators.');
            }}
            onMouseLeave={() => setHoveredHotspot(null)}
            className="absolute top-[65%] left-[44%] w-[11.5%] h-[4.5%] rounded cursor-pointer group hover:bg-amber-400/10 border border-transparent hover:border-amber-400/40 focus:outline-none focus:ring-1 focus:ring-amber-400"
            aria-label="Test ATM Metal Keypad"
          />

          {/* 4. Cash Dispenser Shutter Hotspot */}
          <button
            type="button"
            onClick={handleCashSlotClick}
            onMouseEnter={() => {
              setHoveredHotspot('cashslot');
              if (dispensedCash?.isDispensed) {
                setDialogueText(`Philippine banknotes ready in dispenser! Click to take ${formatPHP(dispensedCash.amount)}.`);
              } else {
                setDialogueText('Motorized cash dispenser shutter. Dispenses Philippine Peso notes.');
              }
            }}
            onMouseLeave={() => setHoveredHotspot(null)}
            className={`absolute top-[70.5%] left-[39%] w-[22%] h-[7.5%] rounded-b cursor-pointer group focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all ${
              dispensedCash?.isDispensed
                ? 'border-2 border-emerald-400 bg-emerald-500/30 shadow-[0_0_30px_#10b981]'
                : 'hover:bg-emerald-400/10 border border-transparent hover:border-emerald-400/30'
            }`}
            aria-label="Cash Dispenser Shutter"
          >
            {/* Visual of bills sticking out of the shutter on the POV view */}
            {dispensedCash?.isDispensed && (
              <div className="relative w-full h-full flex flex-col items-center justify-center animate-slide-out-cash z-20">
                <div className="flex items-center -space-x-3 filter drop-shadow-[0_4px_10px_rgba(0,0,0,0.9)] scale-90 sm:scale-100">
                  <div className="w-16 h-7 rounded bg-gradient-to-r from-[#1e4b85] to-[#2c6cb0] border border-cyan-300 text-[8px] font-mono font-black text-white flex items-center justify-between px-1 shadow-lg rotate-[-5deg]">
                    <span>BSP</span>
                    <span>{dispensedCash.amount >= 1000 ? '₱1,000' : '₱500'}</span>
                  </div>
                  {dispensedCash.amount >= 1500 && (
                    <div className="w-16 h-7 rounded bg-gradient-to-r from-[#8f6d14] to-[#c69a2a] border border-amber-300 text-[8px] font-mono font-black text-white flex items-center justify-between px-1 shadow-lg rotate-[4deg]">
                      <span>BSP</span>
                      <span>₱500</span>
                    </div>
                  )}
                  {dispensedCash.amount >= 2500 && (
                    <div className="w-14 h-6 rounded bg-gradient-to-r from-[#2f1b4a] to-[#4c2b77] border border-purple-300 text-[7px] font-mono font-black text-white flex items-center justify-between px-1 shadow-lg rotate-[8deg]">
                      <span>BSP</span>
                      <span>₱100</span>
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-6 px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-black text-[9px] shadow-lg whitespace-nowrap animate-bounce flex items-center gap-1">
                  <span>TAKE STACK ({formatPHP(dispensedCash.amount)})</span>
                  <span>👆</span>
                </div>
              </div>
            )}
          </button>

          {/* Floating Popup on POV View: +PHP (amount) */}
          {floatingCashPopup && (
            <div className="absolute top-[67%] left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-float-up">
              <div className="px-5 py-2 rounded-full bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-black font-mono text-base md:text-lg shadow-[0_10px_35px_rgba(16,185,129,0.8)] border-2 border-emerald-300 flex items-center gap-2 whitespace-nowrap">
                <Sparkles className="w-5 h-5 text-amber-300 animate-spin" />
                <span>+{formatPHP(floatingCashPopup)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Hand holding active card in foreground */}
        <div className="absolute bottom-36 md:bottom-32 right-4 md:right-12 z-30 pointer-events-auto transition-transform hover:scale-105 duration-200">
          <div
            onClick={handleCardSlotClick}
            className="cursor-pointer group relative w-48 md:w-56 p-3 rounded-xl bg-gradient-to-tr from-blue-900 via-indigo-900 to-slate-900 border-2 border-blue-400/60 shadow-[0_15px_35px_rgba(0,0,0,0.8)] rotate-[-6deg] hover:rotate-0 transition-transform"
            title="Click to insert into ATM"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-wider text-white">ExpressBank</span>
              <span className="text-[8px] bg-blue-500/40 text-blue-200 px-1 py-0.5 rounded font-mono">
                ACTIVE IN HAND
              </span>
            </div>

            <div className="flex items-center gap-2 my-2">
              <div className="w-6 h-4 rounded bg-amber-400/90 border border-amber-200" />
              <div className="font-mono text-xs text-white tracking-widest font-semibold">
                •••• {activeProfile.accountNumber.slice(-3)}
              </div>
            </div>

            <div className="flex items-end justify-between text-[9px] font-mono text-slate-300">
              <div className="truncate max-w-[100px] font-bold text-white uppercase">
                {activeProfile.holderName}
              </div>
              <div className="bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded font-bold text-[9px]">
                PIN: {showPinPeek ? activeProfile.pin : '••••'}
              </div>
            </div>

            <div className="mt-2 text-[8px] text-cyan-300 text-center font-sans font-medium group-hover:underline flex items-center justify-center gap-1">
              <span>Click to Insert into Slot</span>
              <ArrowRight className="w-2.5 h-2.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Top Floating HUD */}
      <header className="relative z-30 flex items-center justify-between p-4 md:px-8 bg-slate-950/70 backdrop-blur-md border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
          <div>
            <h1 className="text-sm md:text-base font-bold text-white tracking-wide uppercase flex items-center gap-2">
              <span>ATM POV Simulator</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 font-mono">
                Standing at Kiosk
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Holding card for <strong className="text-white">{activeProfile.holderName}</strong> · Acc #{activeProfile.accountNumber}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <button
            type="button"
            onClick={() => setShowPinPeek(!showPinPeek)}
            className="px-3 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-xs font-mono text-amber-300 flex items-center gap-1.5 transition-colors"
            title="Toggle viewing your PIN code"
          >
            {showPinPeek ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>PIN: {showPinPeek ? activeProfile.pin : '••••••'}</span>
          </button>

          <button
            type="button"
            onClick={() => setMuted(toggleSoundMute())}
            aria-label={muted ? 'Unmute Audio' : 'Mute Audio'}
            className="p-2 rounded-lg bg-slate-900/90 border border-slate-700/60 text-slate-300 hover:text-white transition-colors"
          >
            {muted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </header>

      {/* Lower Dialogue & Action HUD */}
      <footer className="relative z-30 p-4 md:p-6 bg-gradient-to-t from-slate-950 via-slate-950/95 to-slate-950/60 backdrop-blur-xl border-t border-blue-500/30">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-3 md:p-4 shadow-xl flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-500/50 flex items-center justify-center shrink-0 mt-0.5 text-blue-400">
              <Info className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="text-[11px] font-mono uppercase tracking-wider text-blue-400 font-semibold">
                FIRST-PERSON PERSPECTIVE · ATM KIOSK
              </div>
              <p className="text-sm md:text-base text-slate-100 font-medium leading-relaxed mt-0.5">
                {dialogueText}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => {
                playCardInsert();
                onInteractUseCard();
              }}
              className="py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-blue-600/25 border border-blue-400/40 flex items-center justify-center gap-2.5 transition-all transform active:scale-[0.98] group"
            >
              <CreditCard className="w-4 h-4 text-blue-200 group-hover:scale-110 transition-transform" />
              <span>Interact with ATM & use card</span>
            </button>

            <button
              type="button"
              onClick={() => {
                playWalletRustle();
                onOpenWallet();
              }}
              className="py-3.5 px-4 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-100 hover:text-white font-bold text-sm tracking-wide shadow-md border border-slate-700 hover:border-slate-500 flex items-center justify-center gap-2.5 transition-all transform active:scale-[0.98] group"
            >
              <Wallet className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
              <span>Open wallet & choose card</span>
            </button>

            <button
              type="button"
              onClick={onLeaveAtm}
              className="py-3.5 px-4 rounded-xl bg-slate-900/80 hover:bg-rose-950/40 text-slate-300 hover:text-rose-200 font-bold text-sm tracking-wide shadow-md border border-slate-800 hover:border-rose-800/60 flex items-center justify-center gap-2.5 transition-all transform active:scale-[0.98] group"
            >
              <LogOut className="w-4 h-4 text-slate-400 group-hover:text-rose-400 group-hover:scale-110 transition-transform" />
              <span>Leave ATM</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
