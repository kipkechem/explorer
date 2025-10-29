
import React, { useState, useEffect } from 'react';
import { Map } from './components/Map';
import { CountyInfoPanel } from './components/CountyInfoPanel';
import { kenyaCountiesGeoJSON } from './data/kenya-counties';
import type { CountyFeature } from './types';
import type { FeatureCollection, Position } from 'geojson';

/**
 * Calculates the Haversine distance between two geographic coordinates.
 * @param p1 First coordinate as [longitude, latitude].
 * @param p2 Second coordinate as [longitude, latitude].
 * @returns The distance in kilometers.
 */
const getDistance = (p1: Position, p2: Position): number => {
    const R = 6371; // Radius of the Earth in km
    const [lon1, lat1] = p1;
    const [lon2, lat2] = p2;

    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

/**
 * Simplifies a GeoJSON FeatureCollection by removing coordinates that are too close to the previously kept point.
 * @param geojson The input GeoJSON FeatureCollection.
 * @param minDistance The minimum distance in kilometers for a point to be kept.
 * @returns A new, simplified GeoJSON FeatureCollection.
 */
const simplifyCoordinates = (geojson: FeatureCollection, minDistance: number): FeatureCollection => {
    const newFeatures = geojson.features.map(feature => {
        // Deep copy to avoid mutating original data
        const newGeometry = JSON.parse(JSON.stringify(feature.geometry));

        const processRing = (ring: Position[]): Position[] => {
            if (ring.length < 4) return ring;
            
            const newRing: Position[] = [ring[0]];
            for (let i = 1; i < ring.length; i++) {
                // Keep the point only if it's further than minDistance from the last point that was added to the new ring.
                if (getDistance(newRing[newRing.length - 1], ring[i]) > minDistance) {
                    newRing.push(ring[i]);
                }
            }
            
            // Ensure the polygon ring is closed by adding the first point if it's not already closed.
            const firstPoint = newRing[0];
            const lastPoint = newRing[newRing.length - 1];
            if (newRing.length > 0 && (firstPoint[0] !== lastPoint[0] || firstPoint[1] !== lastPoint[1])) {
                 newRing.push(firstPoint);
            }

            // If the simplification results in a degenerate polygon (less than 4 points), revert to the original ring.
            if (newRing.length < 4) {
                return ring;
            }

            return newRing;
        };

        if (newGeometry.type === 'Polygon') {
            newGeometry.coordinates = newGeometry.coordinates.map(processRing);
        } else if (newGeometry.type === 'MultiPolygon') {
            newGeometry.coordinates = newGeometry.coordinates.map((polygon: Position[][]) =>
                polygon.map(processRing)
            );
        }

        return { ...feature, geometry: newGeometry };
    });

    return { ...geojson, features: newFeatures as CountyFeature[] };
};


const App: React.FC = () => {
  const [counties, setCounties] = useState<FeatureCollection | null>(null);
  const [selectedCounty, setSelectedCounty] = useState<CountyFeature | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
        // Apply simplification to remove coordinates less than 350m (0.35km) apart
        const simplifiedGeoJSON = simplifyCoordinates(kenyaCountiesGeoJSON as FeatureCollection, 0.35);
        setCounties(simplifiedGeoJSON);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const handleCountySelect = (county: CountyFeature | null) => {
    setSelectedCounty(county);
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800">
      <main className="relative z-10 p-4 sm:p-6 md:p-8 min-h-screen flex flex-col items-center justify-center">
          <h1 
            className="text-4xl md:text-5xl font-bold text-white text-center mb-4"
            style={{textShadow: '0 2px 4px rgba(0,0,0,0.5)'}}
          >
              Kenya County Explorer
          </h1>
          <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row gap-6">
            <div className="flex-grow lg:w-2/3">
                <Map 
                    counties={counties}
                    selectedCounty={selectedCounty}
                    onCountySelect={handleCountySelect}
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
