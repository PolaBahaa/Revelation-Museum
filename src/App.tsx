import React, { useEffect, useRef, useState } from 'react';
import { MuseumScene } from './museum/MuseumScene';
import { StartScreen } from './components/StartScreen';
import { PlayerState, Artwork, PrewarmState } from './types';

interface InspectPresentationProps {
  artwork: Artwork;
  onClose: () => void;
}

function InspectPresentation({ artwork, onClose }: InspectPresentationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setIsVisible(true));
    return () => cancelAnimationFrame(raf);
  }, [artwork.number]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 350);
  };

  const numStr = String(artwork.number).padStart(2, '0');
  const imagePath = `/paintings/${numStr}.png`;

  return (
    <div
      onClick={handleClose}
      className={`fixed inset-0 z-50 flex items-center justify-center bg-[#070709] cursor-pointer select-none transition-opacity duration-400 ease-out ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ transitionDuration: '400ms' }}
    >
      <img
        src={imagePath}
        alt=""
        className={`max-w-[92vw] max-h-[92vh] object-contain pointer-events-none select-none transition-all duration-400 ease-out ${
          isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
        style={{ transitionDuration: '400ms' }}
      />
    </div>
  );
}

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<MuseumScene | null>(null);

  const [hasEntered, setHasEntered] = useState(false);
  const [playerState, setPlayerState] = useState<PlayerState | null>(null);
  const [prewarmState, setPrewarmState] = useState<PrewarmState>({
    loaded: 0,
    total: 36,
    isComplete: false,
    statusMessage: 'Preparing Exhibition...'
  });

  // Initialize Three.js Museum Scene on mount
  useEffect(() => {
    if (!containerRef.current) return;

    const museum = new MuseumScene(
      containerRef.current,
      (state) => {
        setPlayerState(state);
      },
      undefined,
      (pState) => {
        setPrewarmState(pState);
      }
    );
    sceneRef.current = museum;

    return () => {
      museum.dispose();
      sceneRef.current = null;
    };
  }, []);

  const handleEnterMuseum = () => {
    setHasEntered(true);

    // Request browser fullscreen if available
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }

    // Request pointer lock for first-person navigation
    if (sceneRef.current) {
      sceneRef.current.playerController.requestPointerLock();
    }
  };

  const handleExitInspect = () => {
    if (sceneRef.current) {
      sceneRef.current.playerController.exitInspectMode();
    }
  };

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-black select-none">
      {/* 3D WebGL Canvas Container - 100% full viewport */}
      <div
        ref={containerRef}
        className="fixed inset-0 w-full h-full cursor-default"
      />

      {/* Start Screen Overlay (Shown ONLY prior to entering) */}
      {!hasEntered && (
        <StartScreen
          onEnter={handleEnterMuseum}
          prewarmState={prewarmState}
        />
      )}

      {/* Clean Fullscreen Artwork Presentation View (Inspect Mode) */}
      {hasEntered && playerState?.isInspectMode && playerState.inspectArtwork && (
        <InspectPresentation
          artwork={playerState.inspectArtwork}
          onClose={handleExitInspect}
        />
      )}
    </div>
  );
}

