import React, { useState } from 'react';
import {
  Wallet,
  CreditCard,
  Check,
  RotateCw,
  X,
  ArrowRight,
  ShieldAlert,
  Coins,
  Banknote,
  KeyRound,
  Eye,
  EyeOff,
} from 'lucide-react';
import { formatPHP } from '../utils/atmLogic.js';
import { playWalletRustle, playCardInsert, playKeypadBeep } from '../utils/soundEffects.js';

export const WalletView = ({
  availableCards,
  activeCard,
  walletCash = 3600,
  onSelectCard,
  onInsertCardDirectly,
  onCloseWallet,
}) => {
  const [selectedCard, setSelectedCard] = useState(activeCard);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showPin, setShowPin] = useState(true);

  const handleSelectCard = (card) => {
    setSelectedCard(card);
    onSelectCard(card);
    playWalletRustle();
    setIsFlipped(false);
  };

  const handleDirectInsert = () => {
    playCardInsert();
    onInsertCardDirectly(selectedCard);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 md:p-6 select-none font-sans text-slate-100 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-[#1c1613] border-4 border-[#3a2d24] rounded-3xl shadow-[0_25px_80px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Leather texture stitches & header */}
        <div className="border-b border-[#3a2d24] bg-[#29201a] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#3f3127] border border-[#5a4637] flex items-center justify-center text-amber-200 shadow-inner">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-amber-100 tracking-wide flex items-center gap-2">
                <span>Personal Leather Wallet</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                  Bifold Pocket
                </span>
              </h2>
              <p className="text-xs text-amber-200/60">
                Select an ATM debit card from your slots to hold in hand
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCloseWallet}
            className="p-2 rounded-xl bg-[#3f3127] hover:bg-[#524033] border border-[#5a4637] text-amber-200/80 hover:text-white transition-colors"
            aria-label="Close Wallet"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wallet Interior: 2 Columns */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-6 bg-gradient-to-b from-[#231b16] to-[#17120e]">
          {/* Left Column: Card Slots & Cash pocket (7 cols) */}
          <div className="md:col-span-7 space-y-5">
            <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-amber-300/80">
              <span>Card Slots ({availableCards.length})</span>
              <span className="text-[11px] text-amber-400">Click a card to inspect</span>
            </div>

            {/* Slotted Cards List */}
            <div className="space-y-3">
              {availableCards.map((card) => {
                const isSelected = selectedCard.accountNumber === card.accountNumber;
                const isActiveInHand = activeCard.accountNumber === card.accountNumber;

                return (
                  <div
                    key={card.accountNumber}
                    onClick={() => handleSelectCard(card)}
                    className={`relative cursor-pointer p-4 rounded-2xl border transition-all ${
                      isSelected
                        ? 'bg-gradient-to-r from-blue-950/90 to-indigo-950/90 border-blue-400 shadow-[0_10px_25px_rgba(37,99,235,0.25)] scale-[1.01]'
                        : 'bg-[#28201a]/90 hover:bg-[#332921] border-[#44352b] hover:border-amber-500/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-7 rounded bg-gradient-to-br from-amber-300 to-amber-500 border border-amber-200 flex items-center justify-center shadow-sm">
                          <div className="w-6 h-4 border border-amber-800/40 rounded-sm" />
                        </div>
                        <div>
                          <div className="font-bold text-sm text-white tracking-wide">
                            {card.holderName}
                          </div>
                          <div className="font-mono text-xs text-slate-300">
                            {card.cardNumber}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isActiveInHand && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            IN HAND
                          </span>
                        )}
                        {isSelected && (
                          <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center shadow">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono text-slate-400">
                      <span>Account #{card.accountNumber}</span>
                      <span className="text-amber-300 font-semibold">
                        PIN: {showPin ? card.pin : '••••••'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Cash Bills Pocket */}
            <div className="mt-4 p-4 rounded-2xl bg-[#28201a]/60 border border-[#44352b]">
              <div className="flex items-center justify-between text-xs font-mono text-amber-300/80 mb-2">
                <span className="flex items-center gap-1.5">
                  <Banknote className="w-4 h-4 text-emerald-400" />
                  <span>Cash Pocket (Philippine Peso)</span>
                </span>
                <span className="text-emerald-400 font-bold">{formatPHP(walletCash)}</span>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto py-1">
                <div className="px-3 py-1.5 rounded-lg bg-blue-900/60 border border-blue-600/40 text-blue-200 text-xs font-mono font-bold whitespace-nowrap shadow-sm">
                  ₱1,000 × 2
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-amber-900/60 border border-amber-600/40 text-amber-200 text-xs font-mono font-bold whitespace-nowrap shadow-sm">
                  ₱500 × 3
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-violet-900/60 border border-violet-600/40 text-violet-200 text-xs font-mono font-bold whitespace-nowrap shadow-sm">
                  ₱100 × 1
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: 3D Flip Card Inspector & Actions */}
          <div className="md:col-span-5 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-amber-300/80">
                <span>Card Inspector</span>
                <button
                  type="button"
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="hover:text-white flex items-center gap-1 text-[11px] text-cyan-400"
                >
                  <RotateCw className="w-3 h-3" />
                  <span>Flip to {isFlipped ? 'Front' : 'Back'}</span>
                </button>
              </div>

              {/* Debit Card View */}
              <div
                className="relative w-full aspect-[1.586/1] rounded-2xl cursor-pointer perspective-1000"
                onClick={() => setIsFlipped(!isFlipped)}
              >
                {!isFlipped ? (
                  <div className="w-full h-full rounded-2xl p-5 bg-gradient-to-tr from-blue-900 via-indigo-900 to-slate-900 border-2 border-blue-400/50 shadow-[0_15px_35px_rgba(0,0,0,0.7)] flex flex-col justify-between overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none transform -skew-x-12" />

                    <div className="flex items-start justify-between relative z-10">
                      <div>
                        <span className="font-extrabold tracking-wider text-sm text-white drop-shadow">
                          ExpressBank
                        </span>
                        <div className="text-[9px] font-mono text-blue-300">24/7 ATM & Debit Card</div>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3.5 h-3.5 rounded-full bg-amber-400" />
                        <div className="w-3.5 h-3.5 rounded-full bg-red-400 -ml-2" />
                      </div>
                    </div>

                    <div className="flex items-center gap-4 relative z-10">
                      <div className="w-10 h-7 rounded bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 border border-amber-300 shadow flex items-center justify-center">
                        <div className="w-7 h-5 border border-amber-800/40 rounded-sm" />
                      </div>
                      <svg className="w-5 h-5 text-white/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M8.5 16.5a5 5 0 0 1 0-9" />
                        <path d="M12 19a8.5 8.5 0 0 0 0-14" />
                      </svg>
                    </div>

                    <div className="relative z-10">
                      <p className="font-mono text-base tracking-[0.16em] text-white font-medium drop-shadow">
                        {selectedCard.cardNumber}
                      </p>
                    </div>

                    <div className="flex items-end justify-between relative z-10 text-xs font-mono">
                      <div>
                        <span className="text-[8px] uppercase tracking-wider text-slate-400 block">Cardholder</span>
                        <span className="text-white font-bold tracking-wide uppercase truncate max-w-[130px] block">
                          {selectedCard.holderName}
                        </span>
                      </div>
                      <div className="bg-amber-400 text-slate-950 px-2 py-0.5 rounded shadow text-center font-sans font-bold">
                        <div className="text-[7px] uppercase tracking-tighter leading-none">PIN</div>
                        <div className="text-xs font-mono">{showPin ? selectedCard.pin : '••••'}</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full rounded-2xl bg-gradient-to-tr from-slate-900 to-blue-950 border-2 border-slate-700 p-4 flex flex-col justify-between shadow-2xl relative">
                    <div className="-mx-4 h-9 bg-slate-950 border-y border-black" />

                    <div className="space-y-2 mt-2">
                      <div className="bg-slate-200 text-slate-900 px-3 py-1 rounded text-right font-mono text-xs flex justify-between items-center">
                        <span className="text-[9px] text-slate-600 font-sans italic">Authorized Signature: {selectedCard.holderName}</span>
                        <span className="font-bold tracking-wider">{selectedCard.cvv}</span>
                      </div>
                      <p className="text-[8px] text-slate-400 leading-tight">
                        This card is property of ExpressBank. If found, please return to any ExpressBank ATM branch or call 1-800-EXPRESS.
                      </p>
                    </div>

                    <div className="bg-amber-400/90 text-slate-950 p-2 rounded-lg text-xs font-mono flex items-center justify-between">
                      <span className="font-bold font-sans text-[10px]">PIN Sticker:</span>
                      <span className="font-bold text-sm tracking-widest">{selectedCard.pin}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* PIN Visibility Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#28201a] border border-[#44352b] text-xs">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-amber-400" />
                  <span className="text-amber-100">
                    PIN Code: <strong className="font-mono text-amber-300">{showPin ? selectedCard.pin : '••••••'}</strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="text-amber-400 hover:text-amber-300 flex items-center gap-1 font-mono text-[11px]"
                >
                  {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showPin ? 'Hide' : 'Reveal'}</span>
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={handleDirectInsert}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all transform active:scale-[0.98]"
              >
                <CreditCard className="w-4 h-4" />
                <span>Insert This Card Into ATM</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>

              <button
                type="button"
                onClick={onCloseWallet}
                className="w-full py-2.5 px-4 rounded-xl bg-[#332921] hover:bg-[#44372c] border border-[#524033] text-amber-100 text-xs font-semibold tracking-wide transition-colors"
              >
                Close Wallet (Keep in Hand)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
