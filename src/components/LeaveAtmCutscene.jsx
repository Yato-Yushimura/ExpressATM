import React from 'react';
import { ArrowLeft, RotateCcw, User, Wallet, MapPin } from 'lucide-react';
import { playFootstep, playWalletRustle } from '../utils/soundEffects.js';

export const LeaveAtmCutscene = ({
  activeProfile,
  onReturnToAtm,
  onStartNewWalk,
  onOpenWallet,
}) => {
  return (
    <div className="relative w-full h-full min-h-screen bg-slate-950 flex flex-col justify-between select-none font-sans text-slate-100 overflow-hidden">
      {/* City Street View looking away from ATM */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        <div className="absolute top-1/4 inset-x-0 h-1/2 opacity-25 flex items-end justify-between px-8">
          <div className="w-28 h-56 bg-slate-800 rounded-t-sm" />
          <div className="w-36 h-72 bg-slate-900 rounded-t-sm" />
          <div className="w-24 h-48 bg-slate-800 rounded-t-sm" />
          <div className="w-40 h-64 bg-slate-900 rounded-t-sm" />
        </div>

        {/* Street lights & reflections */}
        <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />

        {/* Sidewalk pavement perspective */}
        <div className="absolute bottom-0 inset-x-0 h-2/5 bg-gradient-to-t from-slate-900 via-slate-950 to-transparent">
          <div
            className="w-full h-full opacity-20"
            style={{
              backgroundImage:
                'repeating-linear-gradient(0deg, rgba(255,255,255,0.08) 0px, rgba(255,255,255,0.08) 2px, transparent 2px, transparent 50px)',
              transform: 'perspective(300px) rotateX(55deg)',
              transformOrigin: 'bottom center',
            }}
          />
        </div>
      </div>

      {/* Header */}
      <header className="relative z-20 flex items-center justify-between p-4 md:px-8 bg-slate-950/70 backdrop-blur border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-mono text-slate-400">
            Commercial Avenue Sidewalk · Walking away from ATM
          </span>
        </div>
        <div className="text-xs font-mono text-cyan-300">
          User: {activeProfile.holderName}
        </div>
      </header>

      {/* Center Dialogue Box & Choices */}
      <main className="relative z-20 flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-slate-900/90 backdrop-blur-xl border border-slate-700 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-600 text-slate-300 flex items-center justify-center mx-auto shadow-inner">
            <RotateCcw className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-mono uppercase tracking-widest text-amber-400">
              Left ATM Kiosk
            </span>
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              You stepped away from the ATM
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed max-w-md mx-auto">
              You turn your back to the glowing blue kiosk and walk down the quiet sidewalk. Your ExpressBank card is safely tucked in your pocket.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={() => {
                playFootstep();
                onReturnToAtm();
              }}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Turn Around & Return to ATM Kiosk</span>
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  playWalletRustle();
                  onOpenWallet();
                }}
                className="py-3 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Wallet className="w-4 h-4 text-amber-400" />
                <span>Open Wallet</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  playFootstep();
                  onStartNewWalk();
                }}
                className="py-3 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <User className="w-4 h-4 text-cyan-400" />
                <span>New Walk / New User</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      <footer className="relative z-20 px-6 py-3 bg-slate-950/80 border-t border-slate-800/80 text-center text-xs text-slate-500 font-mono">
        ExpressBank ATM Simulator · POV Experience
      </footer>
    </div>
  );
};
