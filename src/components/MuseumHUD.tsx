import React, { useState } from 'react';
import { PlayerState } from '../types';
import { Map, Compass, Sparkles, Activity } from 'lucide-react';

interface MuseumHUDProps {
  playerState: PlayerState;
  onToggleMap: () => void;
  onInspectArtwork: () => void;
  onOpenHallSelector: () => void;
}

export const MuseumHUD: React.FC<MuseumHUDProps> = ({
  playerState,
  onToggleMap,
  onInspectArtwork,
  onOpenHallSelector
}) => {
  const { currentHallName, nearestArtwork, distanceToNearestArtwork, isPointerLocked, perfStats } = playerState;
  const isNearArtwork = nearestArtwork && distanceToNearestArtwork <= 4.5;
  const [showPerf, setShowPerf] = useState(true);

  const fps = perfStats?.fps ?? 60;
  const fpsColor = fps >= 55 ? 'text-emerald-400' : fps >= 30 ? 'text-amber-400' : 'text-rose-400';

  return (
    <div className="pointer-events-none fixed inset-0 z-30 flex flex-col justify-between p-6 select-none">
      
      {/* Top Bar */}
      <div className="flex items-start justify-between gap-4">
        
        {/* Top Left: Museum Badge & Performance Monitor */}
        <div className="flex flex-col gap-2">
          <div className="bg-zinc-950/80 backdrop-blur-md border border-amber-600/30 px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <div>
              <h2 className="text-amber-200 font-serif font-semibold text-sm tracking-wide">
                REVELATION ROYAL MUSEUM
              </h2>
              <p className="text-xs text-amber-400/80 font-mono">
                {currentHallName}
              </p>
            </div>
          </div>

          {/* Performance Monitor Card */}
          {showPerf && perfStats && (
            <div className="bg-zinc-950/90 backdrop-blur-md border border-zinc-800 px-3.5 py-2 rounded-xl shadow-xl text-[11px] font-mono text-zinc-300 flex flex-wrap items-center gap-x-3 gap-y-1">
              <div className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-amber-400" />
                <span className={`font-bold ${fpsColor}`}>{fps} FPS</span>
              </div>
              <div className="text-zinc-600">|</div>
              <div><span className="text-zinc-500">Draws:</span> {perfStats.drawCalls}</div>
              <div className="text-zinc-600">|</div>
              <div><span className="text-zinc-500">Tris:</span> {(perfStats.triangles / 1000).toFixed(1)}k</div>
              <div className="text-zinc-600">|</div>
              <div><span className="text-zinc-500">Tex:</span> {perfStats.textures}</div>
              <div className="text-zinc-600">|</div>
              <div><span className="text-zinc-500">Lights:</span> {perfStats.activeLights}</div>
              <div className="text-zinc-600">|</div>
              <div className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 text-[10px] font-semibold border border-amber-500/20">
                {perfStats.qualityLevel}
              </div>
            </div>
          )}
        </div>

        {/* Top Right: Interactive Controls */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            onClick={() => setShowPerf(!showPerf)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700/50 text-zinc-300 text-xs font-semibold tracking-wide transition-all shadow-lg cursor-pointer"
            title="Toggle Performance Monitor"
          >
            <Activity className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Stats</span>
          </button>

          <button
            onClick={onToggleMap}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-amber-600/30 text-amber-200 text-xs font-semibold tracking-wide transition-all shadow-lg active:scale-95 cursor-pointer"
            title="Open Architectural Map [M]"
          >
            <Map className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Architectural Map [M]</span>
          </button>

          <button
            onClick={onOpenHallSelector}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-amber-600/30 text-amber-200 text-xs font-semibold tracking-wide transition-all shadow-lg active:scale-95 cursor-pointer"
            title="Hall Directory & Jump"
          >
            <Compass className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Halls</span>
          </button>
        </div>
      </div>

      {/* Bottom Center: Interaction Prompt */}
      {isNearArtwork && (
        <div className="pointer-events-auto self-center mb-4">
          <button
            onClick={onInspectArtwork}
            className="flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-600 text-zinc-950 font-bold font-serif text-sm tracking-wider shadow-2xl hover:scale-105 transition-all cursor-pointer animate-bounce"
          >
            <Sparkles className="w-4 h-4" />
            Press [F] or Click to Inspect: {nearestArtwork.title}
          </button>
        </div>
      )}

      {/* Bottom Bar Hints */}
      <div className="flex items-end justify-between text-[11px] text-zinc-400">
        <div className="bg-zinc-950/70 backdrop-blur-md px-3 py-1.5 rounded-lg border border-zinc-800">
          WASD: Move | Shift: Sprint | F: Inspect | M: Map | ESC: Release Look
        </div>

        {!isPointerLocked && (
          <div className="pointer-events-auto cursor-pointer bg-amber-500/20 text-amber-300 px-3 py-1.5 rounded-lg border border-amber-500/40 text-xs font-semibold animate-pulse">
            Click Screen to Enable Pointer Look
          </div>
        )}
      </div>

    </div>
  );
};
