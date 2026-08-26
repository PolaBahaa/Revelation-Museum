import React, { useState, useEffect } from 'react';
import { PlayerState, Artwork } from '../types';
import { MUSEUM_HALLS, FINAL_ARTWORKS, MAX_ARTWORKS } from '../museum/MuseumData';
import { X, Navigation, Eye, Sparkles, Compass, MapPin } from 'lucide-react';

interface MapModalProps {
  playerState: PlayerState;
  onClose: () => void;
  onTeleport: (x: number, y: number, z: number) => void;
  onNavigateToArtwork?: (artwork: Artwork) => void;
}

export const MapModal: React.FC<MapModalProps> = ({
  playerState,
  onClose,
  onTeleport,
  onNavigateToArtwork
}) => {
  const [hoveredArtwork, setHoveredArtwork] = useState<Artwork | null>(null);
  const [selectedHallId, setSelectedHallId] = useState<string | null>(null);

  const [px, , pz] = playerState.position;
  const yaw = playerState.rotation[1];

  // Close on ESC or M keypress
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.code === 'KeyM' || e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // World bounds: X [-45, 45] (90m), Z [-92, 60] (152m)
  // SVG viewBox: 0 0 540 820 with 30px padding
  const svgPadX = 30;
  const svgPadY = 30;
  const svgW = 480;
  const svgH = 760;

  const toSvgCoords = (worldX: number, worldZ: number) => {
    const sx = svgPadX + ((worldX + 45) / 90) * svgW;
    // Z=60 is at bottom (Entrance), Z=-92 is at top (Exit Terrace)
    const sy = svgPadY + ((60 - worldZ) / 152) * svgH;
    return { x: sx, y: sy };
  };

  const getSvgRect = (cx: number, cz: number, w: number, d: number) => {
    const topLeft = toSvgCoords(cx - w / 2, cz + d / 2);
    const rectW = (w / 90) * svgW;
    const rectH = (d / 152) * svgH;
    return { x: topLeft.x, y: topLeft.y, width: rectW, height: rectH };
  };

  const playerSvgPos = toSvgCoords(px, pz);

  // Architectural palace zones
  const rooms = [
    { id: 'entrance', name: 'Royal Entrance', cx: 0, cz: 50, w: 16, d: 12, fill: '#18141c', stroke: '#d4af37', label: 'Entrance Vestibule' },
    { id: 'lobby', name: 'Ceremonial Lobby', cx: 0, cz: 32, w: 24, d: 24, fill: '#141226', stroke: '#f59e0b', label: 'Grand Reception Lobby' },
    { id: 'corridor_south', name: 'Processional Gallery', cx: 0, cz: 15.5, w: 12, d: 9, fill: '#1e1824', stroke: '#71717a', label: 'South Gallery' },
    { id: 'rotunda', name: 'Central Rotunda', cx: 0, cz: 0, w: 26, d: 22, fill: '#231e2b', stroke: '#fbbf24', label: 'Central Rotunda' },
    { id: 'corridor_west', name: 'West Corridor', cx: -16.5, cz: -2.5, w: 7, d: 45, fill: '#1a1622', stroke: '#52525b', label: 'West Corridor' },
    { id: 'corridor_east', name: 'East Corridor', cx: 16.5, cz: -2.5, w: 7, d: 45, fill: '#1a1622', stroke: '#52525b', label: 'East Corridor' },
    { id: 'hall_01', name: 'Hall 01: Classical Masterworks', cx: -30, cz: 10, w: 20, d: 20, fill: '#151d3b', stroke: '#3b82f6', label: 'Hall 01: Masterworks', hallId: 'hall_01' },
    { id: 'hall_02', name: 'Hall 02: Historic Heritage', cx: -30, cz: -15, w: 20, d: 20, fill: '#2a1624', stroke: '#ec4899', label: 'Hall 02: Heritage', hallId: 'hall_02' },
    { id: 'hall_03', name: 'Hall 03: Grand Luminary', cx: 30, cz: 10, w: 20, d: 20, fill: '#151d3b', stroke: '#3b82f6', label: 'Hall 03: Luminary', hallId: 'hall_03' },
    { id: 'hall_04', name: 'Hall 04: Sovereign Heritage', cx: 30, cz: -15, w: 20, d: 20, fill: '#2a1624', stroke: '#ec4899', label: 'Hall 04: Sovereign', hallId: 'hall_04' },
    { id: 'corridor_north', name: 'North Hallway', cx: 0, cz: -20, w: 12, d: 18, fill: '#1e1824', stroke: '#71717a', label: 'North Hallway' },
    { id: 'hall_05', name: 'Hall 05: Royal Masterpiece', cx: -15, cz: -38, w: 22, d: 18, fill: '#151d3b', stroke: '#3b82f6', label: 'Hall 05: Royal', hallId: 'hall_05' },
    { id: 'hall_06', name: 'Hall 06: Imperial Dawn', cx: 15, cz: -38, w: 22, d: 18, fill: '#2a1624', stroke: '#ec4899', label: 'Hall 06: Imperial', hallId: 'hall_06' },
    { id: 'passage_final', name: 'Grand Sovereign Corridor', cx: 0, cz: -53, w: 12, d: 12, fill: '#1e1824', stroke: '#71717a', label: 'Sovereign Corridor' },
    { id: 'final_hall', name: 'The Grand Sovereign Hall', cx: 0, cz: -68, w: 24, d: 18, fill: '#281c30', stroke: '#fbbf24', label: 'Grand Sovereign Hall', hallId: 'final_hall' },
    { id: 'exit_terrace', name: 'Garden Terrace', cx: 0, cz: -83, w: 20, d: 12, fill: '#161c1e', stroke: '#10b981', label: 'Palace Terrace & Vista' }
  ];

  return (
    <div
      id="prophetia-map-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/90 backdrop-blur-md text-amber-50 p-4 sm:p-6 overflow-y-auto select-none"
    >
      <div className="relative max-w-5xl w-full bg-zinc-900/95 border border-amber-500/40 rounded-2xl shadow-2xl p-5 sm:p-6 space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg sm:text-xl font-serif font-bold text-amber-200 tracking-wider">
                PROPHETIA MUSEUM — ARCHITECTURAL FLOORPLAN
              </h2>
            </div>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">
              Current Location: <span className="text-amber-300 font-semibold">{playerState.currentHallName}</span> (X: {px.toFixed(1)}m, Z: {pz.toFixed(1)}m)
            </p>
          </div>

          <button
            id="close-map-btn"
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-300 transition-all cursor-pointer border border-zinc-700"
            title="Close Map (M / ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Content: Map Floorplan + Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* 2D Architectural Floorplan View (7 cols on lg) */}
          <div className="lg:col-span-7 bg-[#0c0a12] p-3 sm:p-4 rounded-xl border border-amber-600/30 flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
            
            <svg
              viewBox="0 0 540 820"
              className="w-full h-auto max-h-[68vh] object-contain drop-shadow-md"
            >
              <defs>
                {/* Gold Glow filter */}
                <filter id="gold-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <linearGradient id="rotundaGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#31223b" />
                  <stop offset="100%" stopColor="#1a1220" />
                </linearGradient>
              </defs>

              {/* Background Outer Border */}
              <rect x="10" y="10" width="520" height="800" fill="#08070d" stroke="#27272a" strokeWidth="2" rx="12" />

              {/* Grid Lines */}
              <g stroke="#18181b" strokeWidth="1" opacity="0.6">
                {Array.from({ length: 11 }).map((_, i) => (
                  <line key={`gx-${i}`} x1={30 + i * 48} y1="30" x2={30 + i * 48} y2="790" />
                ))}
                {Array.from({ length: 16 }).map((_, i) => (
                  <line key={`gy-${i}`} x1="30" y1={30 + i * 48} x2="510" y2={30 + i * 48} />
                ))}
              </g>

              {/* Palace Rooms */}
              {rooms.map((room) => {
                const rect = getSvgRect(room.cx, room.cz, room.w, room.d);
                const isHall = !!room.hallId;
                const isSelected = selectedHallId === room.hallId;

                return (
                  <g
                    key={room.id}
                    onClick={() => {
                      if (room.hallId) {
                        const hall = MUSEUM_HALLS.find(h => h.id === room.hallId);
                        if (hall) onTeleport(hall.center[0], 1.7, hall.center[2]);
                      } else {
                        onTeleport(room.cx, 1.7, room.cz);
                      }
                    }}
                    className="cursor-pointer transition-all hover:opacity-90"
                  >
                    <rect
                      x={rect.x}
                      y={rect.y}
                      width={rect.width}
                      height={rect.height}
                      fill={room.id === 'rotunda' ? 'url(#rotundaGrad)' : room.fill}
                      stroke={isSelected ? '#fde047' : room.stroke}
                      strokeWidth={isSelected ? '2.5' : isHall ? '1.8' : '1.2'}
                      rx={room.id === 'rotunda' ? 12 : 4}
                      className="transition-all"
                    />

                    {/* Room Label */}
                    <text
                      x={rect.x + rect.width / 2}
                      y={rect.y + rect.height / 2 + 3}
                      fill={isHall ? '#fef08a' : '#a1a1aa'}
                      fontSize={isHall ? 10.5 : 9}
                      fontWeight={isHall ? 'bold' : 'normal'}
                      fontFamily="serif"
                      textAnchor="middle"
                      pointerEvents="none"
                    >
                      {room.label}
                    </text>
                  </g>
                );
              })}

              {/* Canonical Artwork Pins derived dynamically from FINAL_ARTWORKS 3D world positions */}
              {FINAL_ARTWORKS.map((art) => {
                if (!art.position) return null;
                const pinPos = toSvgCoords(art.position[0], art.position[2]);
                const isHovered = hoveredArtwork?.id === art.id;

                return (
                  <g
                    key={art.id}
                    transform={`translate(${pinPos.x}, ${pinPos.y})`}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredArtwork(art)}
                    onMouseLeave={() => setHoveredArtwork(null)}
                    onClick={() => {
                      if (onNavigateToArtwork) {
                        onNavigateToArtwork(art);
                        onClose();
                      } else {
                        onTeleport(art.position![0], 1.7, art.position![2]);
                        onClose();
                      }
                    }}
                  >
                    {/* Pulsing ring on hover */}
                    {isHovered && (
                      <circle r="14" fill="none" stroke="#f59e0b" strokeWidth="2" className="animate-ping" opacity="0.75" />
                    )}

                    {/* Outer marker pin */}
                    <circle
                      r={isHovered ? 10 : 7.8}
                      fill={isHovered ? '#fbbf24' : '#d97706'}
                      stroke="#fef08a"
                      strokeWidth={isHovered ? 2 : 1.2}
                      filter={isHovered ? 'url(#gold-glow)' : undefined}
                    />

                    {/* Number label inside pin */}
                    <text
                      y={2.6}
                      fill="#09090b"
                      fontSize={art.number >= 10 ? '6.8' : '7.5'}
                      fontWeight="900"
                      fontFamily="sans-serif"
                      textAnchor="middle"
                      pointerEvents="none"
                    >
                      {art.number}
                    </text>
                  </g>
                );
              })}

              {/* Real-time Player Beacon & View Angle Cone */}
              <g transform={`translate(${playerSvgPos.x}, ${playerSvgPos.y})`}>
                {/* View Angle Cone */}
                <path
                  d={`M 0 0 L ${-Math.sin(yaw - 0.4) * 26} ${Math.cos(yaw - 0.4) * 26} A 26 26 0 0 1 ${-Math.sin(yaw + 0.4) * 26} ${Math.cos(yaw + 0.4) * 26} Z`}
                  fill="rgba(251, 191, 36, 0.25)"
                  stroke="rgba(254, 240, 138, 0.6)"
                  strokeWidth="0.8"
                />

                {/* Pulsing Aura */}
                <circle r="12" fill="none" stroke="#f59e0b" strokeWidth="1.5" className="animate-ping" opacity="0.6" />
                
                {/* Player Core Beacon */}
                <circle r="6" fill="#f59e0b" stroke="#ffffff" strokeWidth="2" filter="url(#gold-glow)" />
                <circle r="2" fill="#ffffff" />
              </g>

            </svg>

            {/* Map Legend */}
            <div className="flex flex-wrap items-center justify-between w-full pt-2 px-2 text-[10px] text-zinc-400 font-sans border-t border-zinc-800/60 mt-2">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-white inline-block" />
                  Player Location
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-600 border border-amber-300 inline-block" />
                  Installed Artworks ({FINAL_ARTWORKS.length} / {MAX_ARTWORKS} Slots)
                </span>
              </div>
              <span className="text-zinc-500 italic">Click any room or artwork to navigate</span>
            </div>

          </div>

          {/* Directory & Artwork Inspector Sidebar (5 cols on lg) */}
          <div className="lg:col-span-5 flex flex-col gap-4 h-full">
            
            {/* Artwork Quick Details Card */}
            <div className="p-3.5 rounded-xl bg-zinc-950 border border-amber-600/30 min-h-[140px] flex flex-col justify-center">
              {hoveredArtwork ? (
                <div className="space-y-1.5 animate-fadeIn">
                  <div className="flex items-center justify-between text-xs text-amber-400 font-mono">
                    <span>EXHIBITION #{hoveredArtwork.number} (OF {MAX_ARTWORKS} CAPACITY)</span>
                    <span className="text-zinc-400">{hoveredArtwork.hallName}</span>
                  </div>
                  <h4 className="text-sm font-serif font-bold text-amber-200">
                    {hoveredArtwork.title}
                  </h4>
                  {hoveredArtwork.subTitle && (
                    <p className="text-xs text-zinc-300 italic font-serif">
                      {hoveredArtwork.subTitle}
                    </p>
                  )}
                  <p className="text-[11px] text-amber-300/80 font-mono">
                    {hoveredArtwork.scripture}
                  </p>
                  <button
                    onClick={() => {
                      if (onNavigateToArtwork) {
                        onNavigateToArtwork(hoveredArtwork);
                        onClose();
                      } else if (hoveredArtwork.position) {
                        onTeleport(hoveredArtwork.position[0], 1.7, hoveredArtwork.position[2]);
                        onClose();
                      }
                    }}
                    className="mt-1 w-full py-1.5 px-3 rounded-lg bg-amber-600 hover:bg-amber-500 text-zinc-950 font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Navigation className="w-3.5 h-3.5" /> Travel to Artwork #{hoveredArtwork.number}
                  </button>
                </div>
              ) : (
                <div className="text-center text-zinc-500 text-xs py-2 space-y-1">
                  <Sparkles className="w-4 h-4 mx-auto text-amber-500/60" />
                  <p>Hover over any numbered artwork pin to view details and fast travel.</p>
                </div>
              )}
            </div>

            {/* Hall Directory Quick Travel */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5" /> Exhibition Halls & Landmark Zones
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => { onTeleport(0, 1.7, 50); onClose(); }}
                  className="p-2.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-left border border-zinc-700/80 text-zinc-200 cursor-pointer transition-all hover:border-amber-500/50"
                >
                  <div className="font-semibold text-amber-300">Grand Entrance</div>
                  <div className="text-[10px] text-zinc-400">Main Vestibule (Z: 50m)</div>
                </button>

                <button
                  onClick={() => { onTeleport(0, 1.7, 0); onClose(); }}
                  className="p-2.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-left border border-zinc-700/80 text-zinc-200 cursor-pointer transition-all hover:border-amber-500/50"
                >
                  <div className="font-semibold text-amber-300">Central Rotunda</div>
                  <div className="text-[10px] text-zinc-400">Sovereign Dome (Z: 0m)</div>
                </button>

                {MUSEUM_HALLS.map((hall) => (
                  <button
                    key={hall.id}
                    onMouseEnter={() => setSelectedHallId(hall.id)}
                    onMouseLeave={() => setSelectedHallId(null)}
                    onClick={() => {
                      onTeleport(hall.center[0], 1.7, hall.center[2]);
                      onClose();
                    }}
                    className={`p-2.5 rounded-lg text-left border transition-all cursor-pointer ${
                      selectedHallId === hall.id
                        ? 'bg-zinc-700 border-amber-400 text-white'
                        : 'bg-zinc-800/80 hover:bg-zinc-700 border-zinc-700/80 text-zinc-200'
                    }`}
                  >
                    <div className="font-semibold text-amber-300 flex items-center justify-between">
                      <span>{hall.code}: {hall.title}</span>
                      <span className="text-[10px] font-mono text-amber-400/80">
                        {FINAL_ARTWORKS.filter((a) => a.hallId === hall.id).length} Artworks
                      </span>
                    </div>
                    <div className="text-[10px] text-zinc-400 truncate">{hall.subTitle}</div>
                  </button>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
