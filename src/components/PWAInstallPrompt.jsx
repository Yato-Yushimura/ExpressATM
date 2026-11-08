import React, { useState } from 'react';
import { Download, X, Monitor, Smartphone, WifiOff, CheckCircle2 } from 'lucide-react';
import { usePWAInstall, useOnlineStatus } from '../utils/usePWAInstall.js';

export const PWAInstallPrompt = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const isOnline = useOnlineStatus();
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);

  const handleInstallClick = async () => {
    if (isInstallable) {
      await install();
    } else {
      setShowManualModal(true);
    }
  };

  return (
    <>
      {/* Offline Connectivity Indicator */}
      {!isOnline && (
        <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-500/95 border border-amber-300 px-3.5 py-2 text-xs font-bold text-slate-950 shadow-xl">
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>Offline Mode — Running from cached PWA storage</span>
        </div>
      )}

      {/* Floating Install App Pill (Bottom-Right) & Auto Prompt Banner when not installed */}
      {!isInstalled && (
        <>
          {/* Auto-Prompt Install Banner at top-center when browser fires beforeinstallprompt */}
          {isInstallable && !bannerDismissed && (
            <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-lg rounded-2xl bg-slate-900/95 backdrop-blur-xl border-2 border-cyan-400/70 p-3.5 shadow-[0_15px_45px_rgba(6,182,212,0.35)] flex items-center justify-between gap-3 animate-in fade-in duration-300">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white shrink-0 shadow">
                  <Download className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs md:text-sm font-bold text-white truncate">
                    Install ExpressBank ATM Simulator
                  </div>
                  <div className="text-[11px] text-cyan-200/80 truncate">
                    Run as a standalone desktop or mobile app (works offline)
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleInstallClick}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/25 flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Install App</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBannerDismissed(true)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  aria-label="Dismiss install banner"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Persistent Install App Button in Bottom-Left Corner */}
          <div className="fixed bottom-4 left-4 z-40">
            <button
              type="button"
              onClick={handleInstallClick}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600/95 to-indigo-600/95 hover:from-blue-500 hover:to-indigo-500 border border-cyan-400/50 px-3.5 py-2 text-xs font-bold text-white shadow-[0_8px_25px_rgba(37,99,235,0.45)] transition-all cursor-pointer"
              title="Install ExpressBank ATM POV Simulator as an App"
            >
              <Download className="w-3.5 h-3.5 text-cyan-300" />
              <span>{isIOS ? 'Install on iOS' : 'Install App'}</span>
            </button>
          </div>
        </>
      )}

      {/* Browser / OS Install Instructions Modal (when beforeinstallprompt is pending or on iOS/Safari) */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-cyan-500/40 p-6 shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-cyan-300">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Install ExpressBank ATM App
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Progressive Web App (PWA) & Desktop App
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowManualModal(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isIOS ? (
              <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                  <Smartphone className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-white mb-1">Install on iPhone / iPad (Safari):</p>
                    <ol className="list-decimal list-inside space-y-1 text-slate-300">
                      <li>Tap the <strong>Share</strong> button in the Safari toolbar.</li>
                      <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
                      <li>Tap <strong>Add</strong> in the top-right corner.</li>
                    </ol>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                  <Monitor className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-white mb-1">
                      Install from Browser Address Bar (Chrome / Edge / Brave):
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-slate-300">
                      <li>
                        Look at the right side of your browser&apos;s URL address bar and click the{' '}
                        <strong className="text-cyan-300">Install icon (computer/download symbol)</strong>.
                      </li>
                      <li>
                        Or open the browser menu (<strong>⋮</strong> or <strong>⋯</strong>) &rarr;{' '}
                        <strong>Save and share / Apps</strong> &rarr;{' '}
                        <strong>Install ExpressBank ATM POV Simulator</strong>.
                      </li>
                    </ol>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-emerald-300 mb-0.5">
                      Native Windows .EXE Installer Available:
                    </p>
                    <p className="text-slate-300">
                      You can also download the standalone <strong>ExpressBank-ATM-Simulator.exe</strong>{' '}
                      directly from your GitHub repository&apos;s <strong>Actions &rarr; Artifacts</strong> tab.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowManualModal(false)}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
};
