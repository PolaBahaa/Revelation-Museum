import React from 'react';
import { PlayerState } from '../types';
import { MUSEUM_HALLS } from '../museum/MuseumData';
import { X, Navigation, MapPin } from 'lucide-react';

interface MapModalProps {
  playerState: PlayerState;
  onClose: () => void;
  onTeleport: (x: number, y: number, z: number) => void;
}

export const MapModal: React.FC<MapModalProps> = ({ playerState, onClose, onTeleport }) => {
  const [px, py, pz] = playerState.position;
  const yaw = playerState.rotation[1];

  // Map coordinate conversion
  // Map canvas domain: X from -45 to +45 (90m), Z from -85 to +60 (145m)
  const mapW = 400;
  const mapH = 500;

  const toMapCoords = (worldX: number, worldZ: number) => {
    const mx = ((worldX + 45) / 90) * mapW;
    const my = ((worldZ + 85) / 145) * mapH;
    return { x: mx, y: my };
  };

  const playerMapPos = toMapCoords(px, pz);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/90 backdrop-blur-md text-amber-50 p-6 overflow-y-auto select-none">
      
      <div className="relative max-w-3xl w-full bg-zinc-900 border border-amber-600/40 rounded-2xl shadow-2xl p-6 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div>
            <h2 className="text-xl font-serif font-bold text-amber-300 tracking-wider">
              MUSEUM ARCHITECTURAL FLOORPLAN
            </h2>
            <p className="text-xs text-zinc-400 font-mono">
              Current Location: {playerState.currentHallName}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-amber-300 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2D Architectural Canvas Map */}
        <div className="flex flex-col md:flex-row gap-6 items-center">
          
          <div className="relative bg-zinc-950 p-4 rounded-xl border border-amber-600/30 w-[320px] h-[400px] flex items-center justify-center overflow-hidden">
            <svg width="280" height="380" viewBox="0 0 400 500" className="w-full h-full">
              
              {/* Museum Outer Footprint */}
              <rect x="20" y="20" width="360" height="460" fill="#090b10" stroke="#3f3f46" strokeWidth="2" rx="10" />

              {/* Entrance Vestibule */}
              <rect x="130" y="420" width="140" height="50" fill="#18181b" stroke="#d4af37" strokeWidth="1.5" />
              <text x="200" y="450" fill="#fef08a" fontSize="12" textAnchor="middle" fontFamily="serif">Entrance</text>

              {/* Lobby */}
              <rect x="100" y="340" width="200" height="70" fill="#18181b" stroke="#d4af37" strokeWidth="1.5" />
              <text x="200" y="380" fill="#fef08a" fontSize="12" textAnchor="middle" fontFamily="serif">Grand Lobby</text>

              {/* Central Rotunda */}
              <rect x="90" y="240" width="220" height="80" fill="#27272a" stroke="#fbbf24" strokeWidth="2" rx="8" />
              <text x="200" y="285" fill="#fef08a" fontSize="13" fontWeight="bold" textAnchor="middle" fontFamily="serif">Rotunda</text>

              {/* West Corridor */}
              <rect x="40" y="260" width="50" height="40" fill="#18181b" stroke="#71717a" strokeWidth="1" />
              {/* East Corridor */}
              <rect x="310" y="260" width="50" height="40" fill="#18181b" stroke="#71717a" strokeWidth="1" />

              {/* Hall 01 (West North) */}
              <rect x="30" y="200" width="100" height="50" fill="#1e1b4b" stroke="#6366f1" strokeWidth="1.5" />
              <text x="80" y="230" fill="#c7d2fe" fontSize="10" textAnchor="middle">Hall 01</text>

              {/* Hall 02 (West South) */}
              <rect x="30" y="140" width="100" height="50" fill="#31121d" stroke="#f43f5e" strokeWidth="1.5" />
              <text x="80" y="170" fill="#fecdd3" fontSize="10" textAnchor="middle">Hall 02</text>

              {/* Hall 03 (East North) */}
              <rect x="270" y="200" width="100" height="50" fill="#1e1b4b" stroke="#6366f1" strokeWidth="1.5" />
              <text x="320" y="230" fill="#c7d2fe" fontSize="10" textAnchor="middle">Hall 03</text>

              {/* Hall 04 (East South) */}
              <rect x="270" y="140" width="100" height="50" fill="#31121d" stroke="#f43f5e" strokeWidth="1.5" />
              <text x="320" y="170" fill="#fecdd3" fontSize="10" textAnchor="middle">Hall 04</text>

              {/* Hall 05 & Hall 06 */}
              <rect x="70" y="80" width="120" height="50" fill="#1e1b4b" stroke="#6366f1" strokeWidth="1.5" />
              <text x="130" y="110" fill="#c7d2fe" fontSize="10" textAnchor="middle">Hall 05</text>

              <rect x="210" y="80" width="120" height="50" fill="#31121d" stroke="#f43f5e" strokeWidth="1.5" />
              <text x="270" y="110" fill="#fecdd3" fontSize="10" textAnchor="middle">Hall 06</text>

              {/* Final Hall & Exit */}
              <rect x="120" y="30" width="160" height="40" fill="#18181b" stroke="#fbbf24" strokeWidth="1.5" />
              <text x="200" y="55" fill="#fef08a" fontSize="10" textAnchor="middle">Final Gallery</text>

              {/* Live Player Position Marker */}
              <g transform={`translate(${playerMapPos.x}, ${playerMapPos.y})`}>
                <circle r="7" fill="#f59e0b" stroke="#ffffff" strokeWidth="2" className="animate-ping" />
                <circle r="6" fill="#fbbf24" />
                {/* Pointer Cone */}
                <line
                  x1="0" y1="0"
                  x2={-Math.sin(yaw) * 16}
                  y2={-Math.cos(yaw) * 16}
                  stroke="#fef08a"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </g>

            </svg>
          </div>

          {/* Hall Quick Travel Directory */}
          <div className="flex-1 space-y-3 w-full">
            <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Navigation className="w-4 h-4" /> Quick Hall Directory
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              
              <button
                onClick={() => { onTeleport(0, 1.7, 50); onClose(); }}
                className="p-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-left border border-zinc-700 text-zinc-200 cursor-pointer"
              >
                <div className="font-semibold text-amber-300">Grand Entrance</div>
                <div className="text-[10px] text-zinc-400">Main Vestibule</div>
              </button>

              <button
                onClick={() => { onTeleport(0, 1.7, 0); onClose(); }}
                className="p-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-left border border-zinc-700 text-zinc-200 cursor-pointer"
              >
                <div className="font-semibold text-amber-300">Central Rotunda</div>
                <div className="text-[10px] text-zinc-400">Wing Circulation</div>
              </button>

              {MUSEUM_HALLS.map(hall => (
                <button
                  key={hall.id}
                  onClick={() => {
                    onTeleport(hall.center[0], 1.7, hall.center[2]);
                    onClose();
                  }}
                  className="p-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-left border border-zinc-700 text-zinc-200 transition-all cursor-pointer"
                >
                  <div className="font-semibold text-amber-300">{hall.code}: {hall.title}</div>
                  <div className="text-[10px] text-zinc-400 truncate">{hall.subTitle}</div>
                </button>
              ))}

              <button
                onClick={() => { onTeleport(0, 1.7, -62); onClose(); }}
                className="p-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-left border border-zinc-700 text-zinc-200 cursor-pointer"
              >
                <div className="font-semibold text-amber-300">Final Gallery</div>
                <div className="text-[10px] text-zinc-400">Culmination View</div>
              </button>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
