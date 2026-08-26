import React from 'react';
import { Compass, Eye, Move, Sparkles, Loader2 } from 'lucide-react';
import { PrewarmState } from '../types';

interface StartScreenProps {
  onEnter: () => void;
  prewarmState?: PrewarmState;
}

export const StartScreen: React.FC<StartScreenProps> = ({ onEnter, prewarmState }) => {
  const isReady = prewarmState ? prewarmState.isComplete : true;
  const progressPercent = prewarmState
    ? Math.round((prewarmState.loaded / Math.max(1, prewarmState.total)) * 100)
    : 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/95 backdrop-blur-md text-amber-50 p-6 overflow-y-auto">
      {/* Subtle gold grid ambient glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-900/20 via-zinc-950/80 to-zinc-950 pointer-events-none" />

      <div className="relative max-w-3xl w-full bg-zinc-900/90 border border-amber-600/30 rounded-2xl p-8 shadow-2xl text-center space-y-8">
        
        {/* Header Title */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" /> Classical Royal Architecture
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-600 tracking-wider">
            PROPHETIA MUSEUM
          </h1>
        </div>

        <p className="text-zinc-300 text-sm max-w-xl mx-auto leading-relaxed font-sans">
          A 3D Gallery Museum designed as an innovative visual aid for immersive presentation, exploration, and interactive exhibition.
        </p>

        {/* Controls Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left pt-2">
          <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-1">
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs uppercase tracking-wider">
              <Move className="w-4 h-4" /> Movement
            </div>
            <p className="text-xs text-zinc-300">W, A, S, D Keys</p>
            <p className="text-[11px] text-zinc-500">Shift to sprint</p>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-1">
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs uppercase tracking-wider">
              <Eye className="w-4 h-4" /> Look
            </div>
            <p className="text-xs text-zinc-300">Mouse Look</p>
            <p className="text-[11px] text-zinc-500">Esc to release</p>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-1">
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4" /> Inspect
            </div>
            <p className="text-xs text-zinc-300">Press [F] or Click</p>
            <p className="text-[11px] text-zinc-500">Examine artwork</p>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-1">
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs uppercase tracking-wider">
              <Compass className="w-4 h-4" /> Map
            </div>
            <p className="text-xs text-zinc-300">Press [M] Key</p>
            <p className="text-[11px] text-zinc-500">Floorplan map</p>
          </div>
        </div>

        {/* Action Button & Prewarming Status */}
        <div className="space-y-4">
          {!isReady && prewarmState && (
            <div className="max-w-md mx-auto space-y-2">
              <div className="flex justify-between items-center text-xs text-amber-300/80 font-sans px-1">
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  {prewarmState.statusMessage || 'Preparing Exhibition...'}
                </span>
                <span>{progressPercent}%</span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full transition-all duration-200 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          <div>
            <button
              onClick={onEnter}
              disabled={!isReady}
              className={`w-full sm:w-auto px-10 py-4 rounded-xl font-bold font-serif text-lg tracking-wider transition-all shadow-lg select-none ${
                isReady
                  ? 'bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-600 text-zinc-950 hover:from-amber-500 hover:to-yellow-500 hover:shadow-amber-500/20 active:scale-95 cursor-pointer'
                  : 'bg-zinc-800/80 border border-zinc-700 text-zinc-400 cursor-not-allowed opacity-80'
              }`}
            >
              {isReady ? 'ENTER MUSEUM' : 'PREPARING EXHIBITION...'}
            </button>
            <p className="text-[11px] text-zinc-500 mt-3">
              Click anywhere in the museum to lock mouse look. Press ESC to unlock cursor.
            </p>
          </div>
        </div>

        {/* Copyright Notice */}
        <div className="pt-3 border-t border-zinc-800 text-xs text-zinc-400 font-sans tracking-wide">
          © 2026 <span className="text-amber-400 font-semibold tracking-wider">Pola Bahaa</span>. All Rights Reserved.
        </div>

      </div>
    </div>
  );
};
