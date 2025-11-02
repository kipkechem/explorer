import React, { useState, useEffect, useRef } from 'react';
import { Map } from './components/Map';
import { CountyInfoPanel } from './components/CountyInfoPanel';
import { kenyaCountiesGeoJSON } from './data/kenya-counties';
import type { CountyFeature } from './types';
import type { FeatureCollection } from 'geojson';

const App: React.FC = () => {
  const [counties, setCounties] = useState<FeatureCollection | null>(null);
  const [selectedCounty, setSelectedCounty] = useState<CountyFeature | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // State for optional layers
  const [showConstituencies, setShowConstituencies] = useState(false);
  const [showSubCounties, setShowSubCounties] = useState(false);
  const [showWards, setShowWards] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
        setCounties(kenyaCountiesGeoJSON as FeatureCollection);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Reset optional layers when selected county changes
  useEffect(() => {
    if (!selectedCounty) {
      setShowConstituencies(false);
      setShowSubCounties(false);
      setShowWards(false);
    }
  }, [selectedCounty]);


  const handleCountySelect = (county: CountyFeature | null) => {
    setSelectedCounty(county);
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-green-900 via-gray-900 to-black">
      <div ref={menuRef} className="absolute top-6 left-6 z-30">
        <button 
            className="p-2 rounded-lg bg-green-900/20 backdrop-blur-sm border border-green-400/30 text-white hover:bg-green-800/40 focus:outline-none focus:ring-2 focus:ring-green-400/50 transition-colors"
            onClick={() => setIsMenuOpen(prev => !prev)}
            aria-label="Toggle menu"
            aria-expanded={isMenuOpen}
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
        </button>

        {isMenuOpen && (
            <div 
              className="absolute top-full mt-2 w-56 origin-top-left rounded-xl shadow-lg bg-black/50 backdrop-blur-lg border border-green-600/50 ring-1 ring-black ring-opacity-5"
            >
                <div className="py-2" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                    <a href="#" className="block px-4 py-2 text-sm text-white/90 hover:bg-green-500/20 transition-colors rounded-md mx-2" role="menuitem">About Project</a>
                    <a href="#" className="block px-4 py-2 text-sm text-white/90 hover:bg-green-500/20 transition-colors rounded-md mx-2" role="menuitem">Data Sources</a>
                    <a href="#" className="block px-4 py-2 text-sm text-white/90 hover:bg-green-500/20 transition-colors rounded-md mx-2" role="menuitem">Contact Us</a>
                </div>
            </div>
        )}
      </div>
      
      <main className="relative z-10 p-4 sm:p-6 md:p-8 min-h-screen flex flex-col items-center justify-center">
          <h1 
            className="text-4xl md:text-5xl font-bold text-gray-100 text-center mb-4"
            style={{textShadow: '0 0 15px rgba(52, 211, 153, 0.4), 0 2px 4px rgba(0,0,0,0.5)'}}
          >
              <span className="text-green-400">Kenya</span> County Explorer
          </h1>
          <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row gap-6">
            <div className="flex-grow lg:w-2/3">
                <Map 
                    counties={counties}
                    selectedCounty={selectedCounty}
                    onCountySelect={handleCountySelect}
                    showConstituencies={showConstituencies}
                    setShowConstituencies={setShowConstituencies}
                    showSubCounties={showSubCounties}
                    setShowSubCounties={setShowSubCounties}
                    showWards={showWards}
                    setShowWards={setShowWards}
                />
            </div>
            <div className={`lg:w-1/3 transition-all duration-500 ease-in-out ${selectedCounty ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 lg:translate-y-0 lg:translate-x-10'}`}>
                {selectedCounty && (
                    <CountyInfoPanel
                        county={selectedCounty}
                        onClose={() => handleCountySelect(null)}
                    />
                )}
            </div>
          </div>
      </main>
    </div>
  );
};

export default App;