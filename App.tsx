
import React, { useState, useEffect, useRef } from 'react';
import { MapPerspective, ArtStyle, LocationResult, ImageQuality } from './types';
import { findLocationData, generateMapVisual, getStyleRecommendation } from './services/geminiService';
import MapDisplay from './components/MapDisplay';
import { Button, Card, Loader } from './components/UIComponents';

function App() {
  const [query, setQuery] = useState('');
  const [analyzedQuery, setAnalyzedQuery] = useState('');
  
  const [perspective, setPerspective] = useState<MapPerspective>(MapPerspective.ISOMETRIC);
  const [artStyle, setArtStyle] = useState<ArtStyle>(ArtStyle.REALISTIC);
  const [imageQuality, setImageQuality] = useState<ImageQuality>(ImageQuality.HIGH);
  const [customStyle, setCustomStyle] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  
  const [locationData, setLocationData] = useState<LocationResult | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number, lon: number} | undefined>(undefined);
  const [systemLogs, setSystemLogs] = useState<string[]>(['> GeoGen 3D System initialized.']);

  const addLog = (msg: string) => setSystemLogs(prev => [`> ${msg}`, ...prev]);

  // Initialize Geolocation
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
          addLog('GPS Uplink established.');
        },
        (err) => {
          console.warn("Geolocation permission denied or failed", err);
        }
      );
    }
  }, []);

  // Initialize from URL Params (Deep Linking)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const loc = params.get('loc');
    const per = params.get('per');
    const sty = params.get('sty');
    const qual = params.get('qual');
    const cust = params.get('cust');

    let loadedParams = false;

    if (loc) {
      setQuery(loc);
      loadedParams = true;
    }
    if (per && Object.values(MapPerspective).includes(per as MapPerspective)) {
      setPerspective(per as MapPerspective);
    }
    if (sty && Object.values(ArtStyle).includes(sty as ArtStyle)) {
      setArtStyle(sty as ArtStyle);
    }
    if (qual && Object.values(ImageQuality).includes(qual as ImageQuality)) {
      setImageQuality(qual as ImageQuality);
    }
    if (cust) {
      setCustomStyle(cust);
    }

    if (loadedParams) {
      addLog('Mission parameters loaded from shared Uplink.');
    }
  }, []);

  const handleShare = () => {
    const params = new URLSearchParams();
    if (query) params.set('loc', query);
    params.set('per', perspective);
    params.set('sty', artStyle);
    params.set('qual', imageQuality);
    if (customStyle) params.set('cust', customStyle);
    
    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    
    navigator.clipboard.writeText(url).then(() => {
      addLog('SECURE UPLINK COPIED TO CLIPBOARD.');
      alert('Link copied! Share this URL to replicate your map settings.');
    }).catch(() => {
      addLog('ERROR: Could not access clipboard.');
    });
  };

  const fetchLocationData = async (searchQuery: string) => {
    setLoadingStep('SCANNING GLOBAL NETWORK');
    const data = await findLocationData(searchQuery, userLocation?.lat, userLocation?.lon);
    setLocationData(data);
    setAnalyzedQuery(searchQuery);
    addLog(`Target acquired: ${data.name}`);
    if (data.groundingChunks.length > 0) {
      addLog(`${data.groundingChunks.length} data sources acquired.`);
    }
    return data;
  };

  const handleAutoConfigure = async () => {
    if (!query.trim()) return;
    setLoading(true);
    
    try {
      // Reuse data if query hasn't changed, otherwise fetch
      let currentData = locationData;
      if (!currentData || query !== analyzedQuery) {
        currentData = await fetchLocationData(query);
      }

      setLoadingStep('ANALYZING VISUAL COMPOSITION');
      const rec = await getStyleRecommendation(currentData.name, currentData.rawText);
      
      setPerspective(rec.perspective);
      setArtStyle(rec.style);
      addLog(`AI Recommendation: ${rec.perspective} + ${rec.style}`);
      addLog(`Reasoning: ${rec.reasoning}`);

    } catch (error) {
      console.error(error);
      addLog('Error during auto-configuration.');
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setGeneratedImage(null);

    try {
      // Step 1: Get Location Data (if not already fresh)
      let currentData = locationData;
      if (!currentData || query !== analyzedQuery) {
        currentData = await fetchLocationData(query);
      }

      if (!currentData) throw new Error("No location data found");

      // Step 2: Generate Visual
      setLoadingStep(`RENDERING ${perspective.toUpperCase()} VISUAL`);
      const image = await generateMapVisual(
        currentData.name, 
        currentData.description, 
        perspective, 
        artStyle, 
        customStyle,
        imageQuality
      );
      setGeneratedImage(image);
      addLog('Visual rendering complete.');

    } catch (error) {
      console.error(error);
      alert('Failed to generate map data. Please check your API Key or try a different location.');
      addLog('Mission failed: Generation error.');
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-[#0f172a] to-black text-slate-200 p-4 md:p-8 pb-20">
      
      {/* Header */}
      <header className="max-w-7xl mx-auto mb-12 flex flex-col md:flex-row justify-between items-center border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-tech font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500 tracking-tighter">
            GEOGEN <span className="text-white">3D</span>
          </h1>
          <p className="text-slate-400 text-sm tracking-wider mt-2">AI-POWERED SEARCH & VISUALIZATION</p>
        </div>
        <div className="mt-4 md:mt-0 flex flex-col md:items-end space-y-2">
          {/* Top Status Row */}
          <div className="flex items-center space-x-4 text-xs font-tech text-cyan-500/70">
            <div className="flex items-center">
              <div className={`w-2 h-2 rounded-full mr-2 ${userLocation ? 'bg-green-500 shadow-[0_0_10px_lime]' : 'bg-red-500'}`}></div>
              GPS: {userLocation ? 'LOCKED' : 'OFFLINE'}
            </div>
            <div className="flex items-center">
               <div className="w-2 h-2 bg-cyan-500 rounded-full mr-2 shadow-[0_0_10px_cyan]"></div>
               SYSTEM: ONLINE
            </div>
          </div>
          
          {/* Share Button */}
          <button 
            onClick={handleShare}
            className="flex items-center space-x-2 bg-slate-800/50 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-3 py-1 rounded text-xs font-tech tracking-widest transition-all group"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
            <span className="group-hover:text-cyan-300">SHARE UPLINK</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Control Panel */}
        <div className="lg:col-span-4 space-y-6">
          <Card title="Mission Parameters">
            <form onSubmit={handleSearch} className="space-y-6">
              
              {/* Location Input */}
              <div>
                <label className="block text-xs font-tech text-cyan-400 mb-2 uppercase tracking-widest">Target Location</label>
                <div className="relative">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="e.g., Golden Gate Bridge, Shibuya Crossing..."
                    className="w-full bg-slate-950/50 border border-slate-600 text-white px-4 py-3 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none font-mono placeholder-slate-600"
                  />
                  <div className="absolute right-3 top-3 text-slate-500">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </div>
                </div>
              </div>

              {/* AI Recommend Button */}
              <button
                type="button"
                onClick={handleAutoConfigure}
                disabled={loading || !query.trim()}
                className="w-full py-2 px-4 bg-fuchsia-900/30 border border-fuchsia-500/50 hover:bg-fuchsia-900/50 hover:border-fuchsia-400 text-fuchsia-300 text-xs font-tech uppercase tracking-widest transition-all flex items-center justify-center space-x-2 group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4 group-hover:animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                <span>AI Auto-Configure</span>
              </button>

              {/* Perspective Selector */}
              <div>
                <label className="block text-xs font-tech text-cyan-400 mb-2 uppercase tracking-widest">Visual Perspective</label>
                <div className="grid grid-cols-1 gap-2">
                  {(Object.values(MapPerspective) as MapPerspective[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPerspective(p)}
                      className={`text-xs p-2 border transition-all font-tech uppercase tracking-wider text-left px-4 ${
                        perspective === p 
                        ? 'bg-cyan-500/10 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.2)]' 
                        : 'border-slate-700 text-slate-500 hover:border-slate-500'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 {/* Art Style Selector */}
                <div>
                  <label className="block text-xs font-tech text-cyan-400 mb-2 uppercase tracking-widest">Render Style</label>
                  <select
                    value={artStyle}
                    onChange={(e) => setArtStyle(e.target.value as ArtStyle)}
                    className="w-full bg-slate-950/50 border border-slate-600 text-white px-4 py-2 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none font-mono text-xs"
                  >
                    {Object.values(ArtStyle).map((style) => (
                      <option key={style} value={style} className="bg-slate-900">{style}</option>
                    ))}
                  </select>
                </div>

                {/* Quality Selector */}
                <div>
                  <label className="block text-xs font-tech text-cyan-400 mb-2 uppercase tracking-widest">Quality / Model</label>
                  <select
                    value={imageQuality}
                    onChange={(e) => setImageQuality(e.target.value as ImageQuality)}
                    className="w-full bg-slate-950/50 border border-slate-600 text-white px-4 py-2 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none font-mono text-xs"
                  >
                    {Object.values(ImageQuality).map((q) => (
                      <option key={q} value={q} className="bg-slate-900">{q}</option>
                    ))}
                  </select>
                </div>
              </div>

              {artStyle === ArtStyle.CUSTOM && (
                <input
                  type="text"
                  value={customStyle}
                  onChange={(e) => setCustomStyle(e.target.value)}
                  placeholder="Describe style (e.g., 'Lego bricks', 'Watercolor')"
                  className="w-full bg-slate-950/50 border border-slate-600 text-white px-4 py-2 focus:border-cyan-500 outline-none font-mono text-sm placeholder-slate-600 animate-fadeIn"
                />
              )}

              <Button type="submit" disabled={loading} className="w-full flex items-center justify-center">
                {loading && loadingStep.includes('RENDERING') ? 'GENERATING...' : 'INITIATE GENERATION'}
              </Button>
            </form>
          </Card>

          <div className="hidden lg:block p-4 border border-slate-800 rounded bg-slate-900/50 text-xs text-slate-500 font-mono">
            <p className="mb-2 text-cyan-500/50">SYSTEM LOGS:</p>
            <div className="space-y-1 h-32 overflow-y-auto custom-scrollbar">
               {systemLogs.map((log, i) => {
                 // Simple coloring based on log content
                 let colorClass = 'text-slate-400';
                 if (log.includes('Error')) colorClass = 'text-red-400';
                 if (log.includes('Recommendation')) colorClass = 'text-fuchsia-400';
                 if (log.includes('complete') || log.includes('acquired') || log.includes('COPIED')) colorClass = 'text-green-400';
                 
                 return <p key={i} className={colorClass}>{log}</p>;
               })}
               {loading && <p className="text-cyan-400 animate-pulse">> Executing: {loadingStep}...</p>}
            </div>
          </div>
        </div>

        {/* Right Display Panel */}
        <div className="lg:col-span-8">
          {loading && loadingStep.includes('RENDERING') ? (
             <Loader text={loadingStep} />
          ) : (
            <MapDisplay imageUrl={generatedImage} locationData={locationData} />
          )}
        </div>

      </main>
    </div>
  );
}

export default App;
