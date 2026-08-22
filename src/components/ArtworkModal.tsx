import React, { useState, useEffect } from 'react';
import { Artwork } from '../types';
import { X, Volume2, VolumeX, BookOpen, Sparkles, ShieldCheck } from 'lucide-react';

interface ArtworkModalProps {
  artwork: Artwork;
  onClose: () => void;
}

export const ArtworkModal: React.FC<ArtworkModalProps> = ({ artwork, onClose }) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [imageError, setImageError] = useState(false);
  const numStr = String(artwork.number).padStart(2, '0');
  const pngSrc = `/paintings/${numStr}.png`;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'f' || e.key === 'F') {
        stopAudio();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      stopAudio();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const stopAudio = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    }
  };

  const toggleSpeechNarration = () => {
    if (!('speechSynthesis' in window)) return;

    if (isPlayingAudio) {
      stopAudio();
    } else {
      window.speechSynthesis.cancel();
      const textToRead = `${artwork.title}. ${artwork.subTitle}. Scripture passage: ${artwork.scripture}. ${artwork.passage}. Commentary: ${artwork.description}`;
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;

      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);

      window.speechSynthesis.speak(utterance);
      setIsPlayingAudio(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/90 backdrop-blur-md text-amber-50 p-4 md:p-6 overflow-y-auto">
      
      <div className="relative max-w-4xl w-full bg-zinc-900 border border-amber-600/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row my-auto">
        
        {/* Close Button */}
        <button
          onClick={() => {
            stopAudio();
            onClose();
          }}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-zinc-950/80 hover:bg-zinc-800 text-amber-300 border border-amber-600/30 transition-all cursor-pointer"
          title="Close Inspection [Esc]"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Side: Painting Presentation Canvas */}
        <div className="w-full md:w-1/2 bg-zinc-950 p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-amber-600/20">
          <div className="relative p-3 rounded-lg bg-gradient-to-br from-amber-600 via-amber-800 to-yellow-900 shadow-2xl border border-amber-400/40 max-w-sm w-full">
            <div className="bg-zinc-900 p-4 rounded border border-amber-500/20 text-center space-y-4">
              <div className="inline-block px-3 py-1 bg-amber-500/10 text-amber-400 text-xs font-semibold uppercase tracking-widest border border-amber-500/30 rounded-full">
                Exhibition No. {artwork.number} of 36
              </div>

              {/* Real Artwork PNG or Decorative Fallback */}
              {!imageError ? (
                <div className="relative w-full rounded-lg overflow-hidden border border-amber-500/40 bg-zinc-950 flex items-center justify-center min-h-[18rem]">
                  <img
                    src={pngSrc}
                    alt={artwork.title}
                    referrerPolicy="no-referrer"
                    onError={() => setImageError(true)}
                    className="w-full max-h-80 object-contain shadow-2xl transition-transform duration-300 hover:scale-105"
                  />
                </div>
              ) : (
                <div
                  className="w-full h-72 rounded shadow-inner flex flex-col justify-between p-4 border border-amber-500/40"
                  style={{
                    background: `radial-gradient(circle, ${artwork.canvasColorSecondary || '#d97706'} 0%, ${artwork.canvasColorPrimary || '#1e293b'} 100%)`
                  }}
                >
                  <div className="text-amber-200/40 text-xs font-serif uppercase tracking-widest">
                    Royal Masterpiece
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-xl font-serif font-bold text-amber-100 drop-shadow">
                      {artwork.title}
                    </h3>
                    <p className="text-xs text-amber-200/90 italic">
                      {artwork.subTitle}
                    </p>
                  </div>

                  <div className="text-right text-[10px] text-amber-300/60 font-mono">
                    {artwork.hallName}
                  </div>
                </div>
              )}

              <div className="text-xs text-amber-300/80 font-serif italic">
                "{artwork.scripture}"
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Detailed Scriptural & Historical Commentary */}
        <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-between space-y-6">
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-400 tracking-wider uppercase font-mono">
                {artwork.hallName}
              </span>

              {/* Audio Guide Narration Button */}
              {'speechSynthesis' in window && (
                <button
                  onClick={toggleSpeechNarration}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    isPlayingAudio
                      ? 'bg-amber-500 text-zinc-950 shadow-lg animate-pulse'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-amber-300 border border-amber-600/30'
                  }`}
                >
                  {isPlayingAudio ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  {isPlayingAudio ? 'Stop Narration' : 'Audio Guide'}
                </button>
              )}
            </div>

            <h2 className="text-2xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-400">
              {artwork.title}
            </h2>

            {/* Scripture Box */}
            <div className="p-4 rounded-xl bg-zinc-950/70 border border-amber-600/30 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs font-serif">
                <BookOpen className="w-4 h-4" /> {artwork.scripture}
              </div>
              <p className="text-sm text-zinc-300 font-serif italic leading-relaxed">
                "{artwork.passage}"
              </p>
            </div>

            {/* Theological & Art Description */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Curatorial Commentary
              </h4>
              <p className="text-sm text-zinc-300 leading-relaxed font-sans">
                {artwork.description}
              </p>
            </div>

            {artwork.symbolism && (
              <div className="pt-2">
                <span className="text-xs text-zinc-400">Key Symbolism: </span>
                <span className="text-xs font-mono text-amber-300/90">{artwork.symbolism}</span>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-zinc-800 flex justify-end">
            <button
              onClick={() => {
                stopAudio();
                onClose();
              }}
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold font-serif text-sm transition-all shadow-md active:scale-95 cursor-pointer"
            >
              Resume Tour
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
