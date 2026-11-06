import React, { useState, useEffect } from 'react';
import { CreditCard, KeyRound, Sparkles, User, ArrowRight, Volume2, VolumeX, ShieldCheck, MapPin } from 'lucide-react';
import { playFootstep, playSuccessChime, toggleSoundMute, getSoundMuted } from '../utils/soundEffects.js';

export const WalkingCutscene = ({
  onArriveAtAtm,
  onRegisterAccount,
  initialProfile,
}) => {
  const [userName, setUserName] = useState('');
  const [customPin, setCustomPin] = useState('');
  const [showCustomPin, setShowCustomPin] = useState(false);
  const [distance, setDistance] = useState(45); // meters from ATM
  const [isWalking, setIsWalking] = useState(true);
  const [generatedCard, setGeneratedCard] = useState(initialProfile || null);
  const [muted, setMuted] = useState(getSoundMuted());

  // Head bobbing animation phase
  const [bobPhase, setBobPhase] = useState(0);

  // Walking interval
  useEffect(() => {
    if (!isWalking) return;
    const interval = setInterval(() => {
      setBobPhase((prev) => (prev + 1) % 8);
      setDistance((prev) => {
        if (prev <= 3) {
          setIsWalking(false);
          return 0;
        }
        return prev - 2;
      });
      playFootstep();
    }, 450);

    return () => clearInterval(interval);
  }, [isWalking]);

  const handleGenerateRandomPin = () => {
    const rand = Math.floor(100000 + Math.random() * 900000).toString();
    setCustomPin(rand);
  };

  const handleCreateCard = (e) => {
    e.preventDefault();
    if (!userName.trim()) return;
    const profile = onRegisterAccount(userName.trim(), customPin.trim());
    setGeneratedCard(profile);
    playSuccessChime();
  };

  const handleQuickName = (name) => {
    setUserName(name);
    const pinToUse = customPin.trim() || '123456';
    const profile = onRegisterAccount(name, pinToUse);
    setGeneratedCard(profile);
    playSuccessChime();
  };

  const handleProceedToKiosk = () => {
    if (!generatedCard) {
      const defaultName = userName.trim() || 'Alex Morgan';
      const profile = onRegisterAccount(defaultName);
      onArriveAtAtm(profile);
    } else {
      onArriveAtAtm(generatedCard);
    }
  };

  const bobOffset = Math.sin((bobPhase * Math.PI) / 4) * 10;
  const swayOffset = Math.cos((bobPhase * Math.PI) / 4) * 0.8;
  const walkScale = 1 + (45 - distance) * 0.014;

  return (
    <div className="relative w-full h-full min-h-screen bg-slate-950 overflow-hidden flex flex-col justify-between select-none font-sans text-slate-100">
      {/* PURE CSS AMBIENT NIGHT WALKING PERSPECTIVE (NO BACKGROUND IMAGE) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
        {/* Ambient atmospheric lighting */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-950/40 via-slate-950/90 to-slate-950" />
        
        {/* Perspective walking grid */}
        <div 
          className="absolute inset-0 opacity-20 transition-transform duration-300 ease-out"
          style={{
            backgroundImage: 'linear-gradient(to right, rgba(56, 189, 248, 0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(56, 189, 248, 0.15) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            transform: `translateY(${bobOffset * 1.5}px) scale(${walkScale})`,
            maskImage: 'radial-gradient(ellipse at center, rgba(0,0,0,0.8) 0%, transparent 75%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, rgba(0,0,0,0.8) 0%, transparent 75%)',
          }}
        />

        <div
          className="absolute inset-0 flex items-center justify-center transition-transform duration-300 ease-out"
          style={{
            transform: `translateY(${bobOffset}px) rotate(${swayOffset}deg) scale(${walkScale})`,
            transformOrigin: '50% 50%',
          }}
        >
          {/* Distant ATM kiosk glow beacon */}
          <div className="absolute top-[38%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Reticle pointing to ATM ahead */}
          <div
            className="absolute top-[38%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none transition-all duration-300"
            style={{
              opacity: distance > 3 ? 0.95 : 0.4,
            }}
          >
            <div className="relative flex items-center justify-center">
              <div className="w-12 h-12 rounded-full border-2 border-cyan-400 animate-ping opacity-75" />
              <div className="w-8 h-8 rounded-full border-2 border-white bg-blue-600/70 shadow-[0_0_25px_#06b6d4] flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-300 animate-pulse" />
              </div>
            </div>
            <div className="mt-2 px-3.5 py-1 rounded-full bg-slate-900/90 border border-cyan-400/80 shadow-[0_4px_15px_rgba(0,0,0,0.8)] text-[10px] font-mono text-cyan-200 font-bold tracking-wider flex items-center gap-1.5 whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>EXPRESSBANK ATM · {distance > 0 ? `${distance}m ahead` : 'Arrived!'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top HUD: Status Bar */}
      <header className="relative z-20 flex items-center justify-between p-4 md:px-8 bg-slate-950/70 backdrop-blur-md border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-blue-500 animate-ping" />
          <div>
            <h1 className="text-sm md:text-base font-bold text-white tracking-wide uppercase flex items-center gap-2">
              <span>ExpressBank POV Simulator</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-600/30 text-blue-300 border border-blue-500/40 font-mono">
                1st Person Walk
              </span>
            </h1>
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-blue-400" />
              <span>Commercial Avenue Kiosk · Corner 4th St.</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <button
            type="button"
            onClick={() => setIsWalking(!isWalking)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700/60 text-xs font-mono text-cyan-300 hover:text-white transition-colors flex items-center gap-1"
          >
            <span>{isWalking ? '⏸ Pause Walk' : '▶ Resume Walk'}</span>
          </button>

          <div className="bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-700/60 font-mono text-xs flex items-center gap-2">
            <span className="text-slate-400">ATM Distance:</span>
            <span className="text-cyan-400 font-bold">{distance > 0 ? `${distance}m` : '0m (Arrived)'}</span>
          </div>

          <button
            type="button"
            onClick={() => setMuted(toggleSoundMute())}
            aria-label={muted ? 'Unmute Audio' : 'Mute Audio'}
            className="p-2 rounded-lg bg-slate-900/90 border border-slate-700/60 text-slate-300 hover:text-white transition-colors"
          >
            {muted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          <button
            type="button"
            onClick={handleProceedToKiosk}
            className="px-3 py-1.5 text-xs rounded-lg bg-blue-600/40 hover:bg-blue-600 text-blue-200 hover:text-white border border-blue-500/50 transition-all font-medium flex items-center gap-1.5"
          >
            <span>Skip Walk</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Interactive Walking Prompt Area */}
      <main className="relative z-20 flex-1 flex items-center justify-center px-4 py-6">
        <div className="w-full max-w-xl bg-slate-900/80 backdrop-blur-xl border border-white/20 rounded-2xl p-6 md:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.85)]">
          {!generatedCard ? (
            <div>
              <div className="mb-6 border-l-4 border-cyan-400 pl-4 py-1">
                <span className="text-xs uppercase tracking-widest text-cyan-400 font-mono font-semibold">
                  REAL-LIFE STREET POV · WALKING TO ATM MACHINE
                </span>
                <p className="text-sm md:text-base text-slate-100 mt-1 leading-relaxed">
                  You are walking down the outdoor street toward the ATM storefront ahead. Before stepping in front of the machine, what is your name so we can issue your personalized debit card and PIN?
                </p>
                {distance === 0 && (
                  <div className="mt-2 text-xs font-mono text-emerald-400 font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>You have arrived at the ATM machine!</span>
                  </div>
                )}
              </div>

              <form onSubmit={handleCreateCard} className="space-y-4">
                <div>
                  <label htmlFor="user-name-input" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                    Cardholder Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-5 h-5" />
                    </div>
                    <input
                      id="user-name-input"
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="e.g. Samantha Cruz"
                      required
                      autoFocus
                      className="w-full pl-11 pr-4 py-3 bg-slate-950/90 border border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 rounded-xl text-white placeholder-slate-500 text-sm md:text-base outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="user-pin-input" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                      Customize Card PIN (4 to 6 Digits)
                    </label>
                    <button
                      type="button"
                      onClick={handleGenerateRandomPin}
                      className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                      🎲 Auto-Generate PIN
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <KeyRound className="w-5 h-5 text-amber-400" />
                    </div>
                    <input
                      id="user-pin-input"
                      type={showCustomPin ? 'text' : 'password'}
                      maxLength={6}
                      value={customPin}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setCustomPin(val);
                      }}
                      placeholder="Enter 4-6 digit PIN (or leave blank to auto-generate)"
                      className="w-full pl-11 pr-24 py-3 bg-slate-950/90 border border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 rounded-xl text-white font-mono text-sm tracking-widest placeholder:tracking-normal placeholder-slate-500 outline-none transition-all"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <button
                        type="button"
                        onClick={() => setShowCustomPin(!showCustomPin)}
                        className="text-xs font-mono text-slate-400 hover:text-slate-200 px-2 py-1 rounded bg-slate-800"
                      >
                        {showCustomPin ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 font-mono">
                    This is your personal PIN for ATM transactions.
                  </p>
                </div>

                <div>
                  <span className="text-xs text-slate-400 block mb-2">Quick choose persona:</span>
                  <div className="flex flex-wrap gap-2">
                    {['Samantha Cruz', 'Alex Santos', 'Hanz Dalmino', 'Maria Reyes'].map((name) => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => handleQuickName(name)}
                        className="px-3 py-1.5 text-xs rounded-lg bg-slate-800/80 hover:bg-blue-900/40 text-slate-300 hover:text-blue-300 border border-slate-700/80 hover:border-blue-500/50 transition-all font-medium"
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!userName.trim()}
                  className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm tracking-wide shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all transform active:scale-[0.99]"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Issue Personalized Card & Create Account</span>
                </button>
              </form>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
              <div className="text-center space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Account & Debit Card Created</span>
                </div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Welcome, {generatedCard.holderName}!
                </h2>
                <p className="text-xs text-slate-400">
                  Your ExpressBank card is ready in your wallet. You can view your PIN right on the card.
                </p>
              </div>

              {/* Debit Card Preview */}
              <div className="relative w-full aspect-[1.586/1] max-w-sm mx-auto rounded-2xl p-5 bg-gradient-to-tr from-blue-900 via-indigo-900 to-slate-900 border border-blue-400/40 shadow-[0_15px_35px_rgba(0,0,0,0.6)] flex flex-col justify-between overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none transform -skew-x-12" />

                <div className="flex items-start justify-between relative z-10">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold tracking-wider text-sm text-white drop-shadow">
                      ExpressBank
                    </span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-blue-500/30 text-blue-200 border border-blue-400/30">
                      Debit
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-amber-400/80" />
                    <div className="w-3 h-3 rounded-full bg-red-400/80 -ml-1.5" />
                  </div>
                </div>

                <div className="flex items-center gap-4 relative z-10 my-1">
                  <div className="w-10 h-7 rounded bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 border border-amber-300 shadow-sm flex items-center justify-center">
                    <div className="w-7 h-5 border border-amber-800/40 rounded-sm grid grid-cols-2 gap-0.5 opacity-60">
                      <div className="border-r border-amber-800/40" />
                      <div />
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-white/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M8.5 16.5a5 5 0 0 1 0-9" />
                    <path d="M12 19a8.5 8.5 0 0 0 0-14" />
                  </svg>
                </div>

                <div className="relative z-10">
                  <p className="font-mono text-base md:text-lg tracking-[0.18em] text-white font-medium drop-shadow">
                    {generatedCard.cardNumber}
                  </p>
                </div>

                <div className="flex items-end justify-between relative z-10 text-xs font-mono">
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 block">Cardholder</span>
                    <span className="text-white font-bold tracking-wide uppercase truncate max-w-[140px] block">
                      {generatedCard.holderName}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 block">Expires</span>
                    <span className="text-white font-medium">{generatedCard.expiry}</span>
                  </div>
                  <div className="bg-amber-400 text-slate-950 px-2 py-1 rounded shadow text-center font-sans font-bold">
                    <div className="text-[8px] uppercase tracking-tighter leading-none">Your PIN</div>
                    <div className="text-xs font-mono tracking-widest">{generatedCard.pin}</div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-amber-400" />
                  <span className="text-slate-300">
                    PIN Memo: <strong className="text-amber-400 font-mono">{generatedCard.pin}</strong>
                  </span>
                </div>
                <div className="text-slate-400 font-mono text-[11px]">
                  Account #{generatedCard.accountNumber}
                </div>
              </div>

              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={handleProceedToKiosk}
                  className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all transform active:scale-[0.99]"
                >
                  <span>Approach ATM Kiosk</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setGeneratedCard(null);
                    setUserName('');
                    setCustomPin('');
                    setDistance(45);
                    setIsWalking(true);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <User className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Create Another New User Instead</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="relative z-20 px-6 py-3 bg-slate-950/80 backdrop-blur border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Approaching kiosk... walking footsteps active</span>
        </div>
        <div className="font-mono text-slate-500">Press Skip Walk anytime</div>
      </footer>
    </div>
  );
};
