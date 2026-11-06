import React from 'react';

export const FilipinoCashBill = ({
  denomination,
  className = '',
  rotation = 0,
  interactive = false,
  onClick,
}) => {
  // Color themes based on real Bangko Sentral ng Pilipinas New Generation Currency
  const config = {
    1000: {
      bg: 'from-[#1e4b85] via-[#2c6cb0] to-[#1a3d6d]',
      border: 'border-[#4a8cd4]',
      glow: 'shadow-[0_8px_25px_rgba(30,75,133,0.6)]',
      accent: 'text-cyan-200',
      seal: 'bg-cyan-300/30 border-cyan-400',
      label: 'SAN PEDRO CALUNGSOD & ESCUDA / EAGLE',
      tag: 'SANGLIBONG PISO',
      stripColor: 'bg-gradient-to-b from-cyan-300 via-emerald-300 to-cyan-400',
      numColor: 'text-[#e2f1ff]',
    },
    500: {
      bg: 'from-[#8f6d14] via-[#c69a2a] to-[#73550e]',
      border: 'border-[#e0b84c]',
      glow: 'shadow-[0_8px_25px_rgba(198,154,42,0.6)]',
      accent: 'text-amber-200',
      seal: 'bg-amber-300/30 border-amber-400',
      label: 'BENIGNO & CORAZON AQUINO',
      tag: 'LIMANDAANG PISO',
      stripColor: 'bg-gradient-to-b from-amber-300 via-yellow-200 to-amber-400',
      numColor: 'text-[#fff8db]',
    },
    100: {
      bg: 'from-[#542168] via-[#7a3296] to-[#421854]',
      border: 'border-[#9c4dc0]',
      glow: 'shadow-[0_8px_25px_rgba(122,50,150,0.6)]',
      accent: 'text-purple-200',
      seal: 'bg-purple-300/30 border-purple-400',
      label: 'MANUEL ROXAS',
      tag: 'SANDAANG PISO',
      stripColor: 'bg-gradient-to-b from-purple-300 via-pink-200 to-purple-400',
      numColor: 'text-[#faedff]',
    },
  }[denomination] || {
    bg: 'from-[#1e4b85] via-[#2c6cb0] to-[#1a3d6d]',
    border: 'border-[#4a8cd4]',
    glow: 'shadow-[0_8px_25px_rgba(30,75,133,0.6)]',
    accent: 'text-cyan-200',
    seal: 'bg-cyan-300/30 border-cyan-400',
    label: 'SANGLIBONG PISO',
    tag: 'SANGLIBONG PISO',
    stripColor: 'bg-gradient-to-b from-cyan-300 via-emerald-300 to-cyan-400',
    numColor: 'text-[#e2f1ff]',
  };

  return (
    <div
      onClick={onClick}
      style={{
        transform: `rotate(${rotation}deg)`,
      }}
      className={`relative w-64 md:w-72 aspect-[2.1/1] rounded-lg p-2.5 bg-gradient-to-r ${config.bg} border-2 ${config.border} ${config.glow} select-none overflow-hidden flex flex-col justify-between font-mono ${
        interactive ? 'cursor-pointer hover:scale-105 active:scale-95 transition-transform' : ''
      } ${className}`}
    >
      {/* Intricate banknote Guilloché micro-pattern overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.4) 1px, transparent 1px), repeating-linear-gradient(45deg, rgba(255,255,255,0.1) 0, rgba(255,255,255,0.1) 1px, transparent 0, transparent 4px)',
          backgroundSize: '8px 8px, 6px 6px',
        }}
      />

      {/* Holographic vertical security thread strip */}
      <div className={`absolute top-0 bottom-0 left-[28%] w-2 ${config.stripColor} opacity-85 shadow-[0_0_8px_rgba(255,255,255,0.8)] border-x border-white/40 flex flex-col justify-around items-center py-1`}>
        <span className="text-[5px] text-slate-900 font-black tracking-tighter leading-none transform -rotate-90">BSP</span>
        <span className="text-[5px] text-slate-900 font-black tracking-tighter leading-none transform -rotate-90">{denomination}</span>
        <span className="text-[5px] text-slate-900 font-black tracking-tighter leading-none transform -rotate-90">BSP</span>
      </div>

      {/* Top Row: Bangko Sentral ng Pilipinas Seal & Republic Header */}
      <div className="relative z-10 flex items-start justify-between">
        <div className="flex items-center gap-1.5">
          {/* BSP Seal Emblem */}
          <div className={`w-6 h-6 rounded-full ${config.seal} border flex items-center justify-center shadow-inner`}>
            <div className="w-4 h-4 rounded-full border border-white/60 flex items-center justify-center text-[6px] font-black text-white">
              BSP
            </div>
          </div>
          <div className="leading-tight">
            <div className="text-[7px] font-bold tracking-widest text-white/90 uppercase font-sans">
              REPUBLIKA NG PILIPINAS
            </div>
            <div className="text-[6px] text-white/70 tracking-tight uppercase">
              ANG SALAPING ITO AY BAYARIN NG BANGKO SENTRAL
            </div>
          </div>
        </div>

        {/* Large Denomination Top Right */}
        <div className={`text-base md:text-lg font-black tracking-tighter ${config.numColor} drop-shadow`}>
          ₱{denomination}
        </div>
      </div>

      {/* Center Body: Philippine Portrait & Watermark Area */}
      <div className="relative z-10 flex items-center justify-between px-1">
        {/* Left Side: Watermark Window with Eagle/Star */}
        <div className="w-12 h-10 rounded border border-white/30 bg-black/15 flex items-center justify-center opacity-85">
          <span className="text-[7px] text-white/50 font-bold uppercase tracking-widest">
            PILIPINAS
          </span>
        </div>

        {/* Center: Denomination in Tagalog */}
        <div className="text-center">
          <span className="text-[8px] md:text-[9px] font-extrabold text-white tracking-widest uppercase block drop-shadow">
            {config.tag}
          </span>
          <span className="text-[6px] text-white/60 uppercase tracking-wider block">
            {config.label}
          </span>
        </div>

        {/* Serial Number */}
        <div className="text-right">
          <div className="text-[6px] text-red-300 font-bold tracking-widest">
            KL894210
          </div>
          <div className="text-[5px] text-white/60">
            SERYE 2026
          </div>
        </div>
      </div>

      {/* Bottom Row: Microtext & Corner Denominations */}
      <div className="relative z-10 flex items-end justify-between pt-1 border-t border-white/20">
        <div className="text-[8px] md:text-[10px] font-black text-white">
          ₱{denomination}
        </div>
        <div className="text-[6px] text-white/70 font-sans tracking-wide">
          BANGKO SENTRAL NG PILIPINAS
        </div>
        <div className="text-[8px] md:text-[10px] font-black text-white">
          {denomination}
        </div>
      </div>
    </div>
  );
};
