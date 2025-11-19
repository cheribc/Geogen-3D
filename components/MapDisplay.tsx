
import React from 'react';
import { LocationResult } from '../types';
import { Card } from './UIComponents';

interface MapDisplayProps {
  imageUrl: string | null;
  locationData: LocationResult | null;
}

const MapDisplay: React.FC<MapDisplayProps> = ({ imageUrl, locationData }) => {
  const handleDownload = () => {
    if (!imageUrl) return;
    const link = document.createElement('a');
    link.href = imageUrl;
    // Create a safe filename
    const safeName = locationData?.name?.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'geogen_visual';
    link.download = `geogen_${safeName}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!imageUrl && !locationData) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center text-slate-600 border-2 border-dashed border-slate-800 bg-slate-900/30 rounded-lg min-h-[400px]">
        <svg className="w-16 h-16 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0121 18.382V7.618a1 1 0 01-1.447-.894L15 7m0 13V7m0 0L9.553 4.553A1 1 0 0115 7z" />
        </svg>
        <p className="font-tech text-xl tracking-wider">SYSTEM READY. AWAITING TARGET.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Visualizer Viewport */}
      <div 
        className="relative w-full aspect-video bg-black rounded-lg overflow-hidden border-2 border-slate-700 shadow-[0_0_30px_rgba(0,0,0,0.5)] group select-none"
      >
        {imageUrl ? (
          <div className="w-full h-full relative">
             <img 
               src={imageUrl} 
               alt="Generated Map" 
               className="w-full h-full object-contain"
             />
             
             {/* Holographic overlay effect */}
             <div className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(rgba(0,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.1)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
             <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/80 to-transparent pointer-events-none"></div>
          </div>
        ) : (
          <div className="w-full h-full bg-slate-900 animate-pulse flex items-center justify-center">
            <span className="text-slate-500 font-tech">INITIALIZING VISUAL FEED...</span>
          </div>
        )}

        {/* HUD Data Overlays */}
         {imageUrl && (
           <>
             <div className="absolute top-4 left-4 bg-black/60 backdrop-blur border border-cyan-500/50 px-3 py-1 text-xs text-cyan-400 font-tech pointer-events-none select-none z-10">
               LIVE_RENDER // {locationData?.name?.toUpperCase()}
             </div>

             {/* Download Button */}
             <button 
                onClick={handleDownload}
                className="absolute top-4 right-4 bg-black/60 backdrop-blur border border-cyan-500/50 hover:bg-cyan-500/20 text-cyan-400 px-3 py-1 flex items-center space-x-2 transition-all z-20 group cursor-pointer"
             >
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
               <span className="text-xs font-tech tracking-wider">SAVE_IMG</span>
             </button>
             
             <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur border border-cyan-500/50 px-3 py-1 text-[10px] text-slate-400 font-tech pointer-events-none select-none z-10 flex items-center">
               <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
               IMG_QUALITY: OPTIMAL
             </div>
           </>
         )}
      </div>

      {/* Data Analysis Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Location Data">
          <h2 className="text-2xl font-bold text-white mb-2">{locationData?.name || 'Unknown Location'}</h2>
          <div className="prose prose-invert prose-sm text-slate-300 max-h-40 overflow-y-auto pr-2 mb-4 custom-scrollbar">
             {locationData?.rawText}
          </div>
        </Card>

        <Card title="Intelligence Sources">
          {locationData?.groundingChunks && locationData.groundingChunks.length > 0 ? (
            <div className="space-y-3 max-h-40 overflow-y-auto custom-scrollbar pr-2">
              {locationData.groundingChunks.map((chunk, i) => {
                // Only showing Web sources now
                if (chunk.web) {
                  return (
                    <div key={`web-${i}`} className="flex flex-col space-y-1 border-l-2 border-cyan-500 pl-3 py-1 bg-cyan-500/5">
                      <span className="text-[10px] uppercase text-cyan-400 font-tech tracking-wider">Google Search</span>
                      <a 
                        href={chunk.web.uri} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-slate-200 hover:text-white font-medium truncate text-sm flex items-center"
                      >
                        {chunk.web.title || 'Web Source'}
                        <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                      </a>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          ) : (
             <p className="text-slate-500 text-sm italic">No intelligence sources retrieved.</p>
          )}
        </Card>
      </div>
    </div>
  );
};

export default MapDisplay;
