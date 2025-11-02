import React, { useRef, useEffect } from 'react';
import type { FeatureCollection } from 'geojson';
import type { CountyFeature } from '../types';

declare const L: any; // Using Leaflet from CDN

interface MapProps {
    counties: FeatureCollection | null;
    selectedCounty: CountyFeature | null;
    onCountySelect: (county: CountyFeature | null) => void;
    showConstituencies: boolean;
    setShowConstituencies: (value: boolean) => void;
    showSubCounties: boolean;
    setShowSubCounties: (value: boolean) => void;
    showWards: boolean;
    setShowWards: (value: boolean) => void;
}

const colors = {
    base: '#FAFAFA',      // Main plastic color (slightly off-white)
    hover: '#FFFFFF',     // Pure white for hover
    selected: '#FFFFFF',  // Pure white for selection
};

const baseStyle = {
    fillColor: colors.base,
    weight: 2.5,
    opacity: 1,
    color: '#BDBDBD',
    fillOpacity: 1,
};

const hoverStyle = {
    weight: 4,
    fillColor: colors.hover,
    color: '#9E9E9E',
    fillOpacity: 1,
};

const selectedStyle = {
    fillColor: colors.selected,
    weight: 3.5,
    color: '#9E9E9E',
    fillOpacity: 1,
};

const extrusionStyle = {
    fillColor: '#2d3748',
    weight: 0,
    fillOpacity: 0.6,
};

const selectedExtrusionStyle = {
    ...extrusionStyle,
    fillColor: '#1a202c',
    fillOpacity: 0.75,
};

// Styles for optional placeholder layers
const constituenciesStyle = { color: '#f56565', weight: 2, dashArray: '5, 5', fill: false, interactive: false };
const subCountiesStyle = { color: '#48bb78', weight: 2, dashArray: '10, 5', fill: false, interactive: false };
const wardsStyle = { color: '#4299e1', weight: 1.5, dashArray: '2, 3', fill: false, interactive: false };


const CheckboxRow: React.FC<{ label: string; color: string; checked: boolean; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; }> = ({ label, color, checked, onChange }) => (
    <label className="flex items-center space-x-3 cursor-pointer p-2 rounded-md hover:bg-green-500/20 transition-colors">
        <div className="relative">
            <input type="checkbox" className="sr-only" checked={checked} onChange={onChange} />
            <div className={`w-5 h-5 rounded border-2 ${checked ? `border-${color}-400 bg-${color}-500` : 'border-green-600/50 bg-green-900/30'} transition-all`}></div>
            {checked && (
                <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
            )}
        </div>
        <span className="text-white/90 text-sm">{label}</span>
    </label>
);


export const Map: React.FC<MapProps> = ({ 
    counties, 
    selectedCounty, 
    onCountySelect, 
    showConstituencies, 
    setShowConstituencies, 
    showSubCounties, 
    setShowSubCounties, 
    showWards, 
    setShowWards 
}) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any | null>(null);
    const geojsonLayerRef = useRef<any | null>(null);
    const extrusionLayerRef = useRef<any | null>(null);
    const tooltipRef = useRef<any | null>(null);

    // Refs for optional layers
    const constituenciesLayerRef = useRef<any | null>(null);
    const subCountiesLayerRef = useRef<any | null>(null);
    const wardsLayerRef = useRef<any | null>(null);
    
    const selectedCountyRef = useRef(selectedCounty);
    useEffect(() => {
        selectedCountyRef.current = selectedCounty;
    }, [selectedCounty]);

    const onCountySelectRef = useRef(onCountySelect);
    useEffect(() => {
        onCountySelectRef.current = onCountySelect;
    }, [onCountySelect]);

    useEffect(() => {
        if (mapRef.current || !mapContainerRef.current) return;

        mapRef.current = L.map(mapContainerRef.current, {
            center: [0.0236, 37.9062],
            zoom: 6,
            zoomControl: false,
            attributionControl: false,
        });
        
        mapRef.current.createPane('extrusionPane');
        const extrusionPane = mapRef.current.getPane('extrusionPane');
        if (extrusionPane) {
            extrusionPane.style.transform = 'translate(-3px, -5px)';
            extrusionPane.style.zIndex = 399;
        }

        tooltipRef.current = L.tooltip({
            sticky: true,
            direction: 'auto',
            opacity: 0.9
        });

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (!mapRef.current || !counties) return;
        
        if (geojsonLayerRef.current) mapRef.current.removeLayer(geojsonLayerRef.current);
        if (extrusionLayerRef.current) mapRef.current.removeLayer(extrusionLayerRef.current);
        
        extrusionLayerRef.current = L.geoJSON(counties, {
            style: extrusionStyle,
            interactive: false,
            pane: 'extrusionPane',
        }).addTo(mapRef.current);
        
        geojsonLayerRef.current = L.geoJSON(counties, {
            style: baseStyle,
            onEachFeature: (feature: CountyFeature, layer: any) => {
                layer.on({
                    mouseover: (e: any) => {
                        if (!selectedCountyRef.current) {
                            tooltipRef.current.setContent(feature.properties.county_name).setLatLng(e.latlng);
                            tooltipRef.current.addTo(mapRef.current);
                            e.target.setStyle(hoverStyle);
                            e.target.bringToFront();
                        }
                    },
                    mouseout: (e: any) => {
                         if (feature.properties.county_code !== selectedCountyRef.current?.properties.county_code) {
                            geojsonLayerRef.current.resetStyle(e.target);
                        }
                        if (mapRef.current.hasLayer(tooltipRef.current)) {
                            mapRef.current.removeLayer(tooltipRef.current);
                        }
                    },
                    mousemove: (e: any) => {
                        tooltipRef.current.setLatLng(e.latlng);
                    },
                    click: () => {
                        const clickedCountyCode = feature.properties.county_code;
                        if (selectedCountyRef.current && selectedCountyRef.current.properties.county_code === clickedCountyCode) {
                             onCountySelectRef.current(null);
                        } else {
                            onCountySelectRef.current(feature);
                        }
                    }
                });
            }
        }).addTo(mapRef.current);
    }, [counties]);

    useEffect(() => {
        const map = mapRef.current;
        const geojsonLayer = geojsonLayerRef.current;
        const extrusionLayer = extrusionLayerRef.current;
        if (!map || !geojsonLayer || !extrusionLayer) return;

        const animationOptions = {
            duration: 1.2,
            easeLinearity: 0.5,
        };

        if (selectedCounty) {
            map.dragging.disable();
            map.touchZoom.disable();
            map.doubleClickZoom.disable();
            map.scrollWheelZoom.disable();
            map.boxZoom.disable();

            if (map.hasLayer(tooltipRef.current)) {
                map.removeLayer(tooltipRef.current);
            }
            let selectedGeoJsonLayer: any = null;
            
            geojsonLayer.eachLayer((layer: any) => {
                if (layer.feature.properties.county_code === selectedCounty.properties.county_code) {
                    selectedGeoJsonLayer = layer;
                    layer.setStyle(selectedStyle);
                    layer.bringToFront();
                } else {
                    layer.setStyle({ fillOpacity: 0, opacity: 0, weight: 0 });
                    if (layer.getElement()) layer.getElement().style.pointerEvents = 'none';
                }
            });

             extrusionLayer.eachLayer((layer: any) => {
                if (layer.feature.properties.county_code === selectedCounty.properties.county_code) {
                    layer.setStyle(selectedExtrusionStyle);
                } else {
                    layer.setStyle({ fillOpacity: 0 });
                }
            });
            
            if (selectedGeoJsonLayer) {
                map.flyToBounds(selectedGeoJsonLayer.getBounds(), { padding: [50, 50], ...animationOptions });
            }
        } else {
            map.dragging.enable();
            map.touchZoom.enable();
            map.doubleClickZoom.enable();
            map.scrollWheelZoom.enable();
            map.boxZoom.enable();

            geojsonLayer.eachLayer((layer: any) => {
                geojsonLayer.resetStyle(layer);
                if (layer.getElement()) {
                    layer.getElement().style.pointerEvents = 'auto';
                }
            });
            extrusionLayer.eachLayer((layer: any) => extrusionLayer.resetStyle(layer));
            map.flyTo([0.0236, 37.9062], 6, animationOptions);
        }

    }, [selectedCounty]);

    // Effect for constituencies layer
    useEffect(() => {
        if (mapRef.current) {
            if (constituenciesLayerRef.current) {
                mapRef.current.removeLayer(constituenciesLayerRef.current);
            }
            if (showConstituencies && selectedCounty) {
                constituenciesLayerRef.current = L.geoJSON(selectedCounty, { style: constituenciesStyle }).addTo(mapRef.current);
            }
        }
    }, [showConstituencies, selectedCounty]);

    // Effect for sub-counties layer
    useEffect(() => {
        if (mapRef.current) {
            if (subCountiesLayerRef.current) {
                mapRef.current.removeLayer(subCountiesLayerRef.current);
            }
            if (showSubCounties && selectedCounty) {
                subCountiesLayerRef.current = L.geoJSON(selectedCounty, { style: subCountiesStyle }).addTo(mapRef.current);
            }
        }
    }, [showSubCounties, selectedCounty]);

    // Effect for wards layer
    useEffect(() => {
        if (mapRef.current) {
            if (wardsLayerRef.current) {
                mapRef.current.removeLayer(wardsLayerRef.current);
            }
            if (showWards && selectedCounty) {
                wardsLayerRef.current = L.geoJSON(selectedCounty, { style: wardsStyle }).addTo(mapRef.current);
            }
        }
    }, [showWards, selectedCounty]);


    return (
        <div className="relative w-full h-[60vh] lg:h-full p-0 bg-black/30 border border-green-700/50 rounded-2xl shadow-lg overflow-hidden">
            <div ref={mapContainerRef} className="w-full h-full bg-transparent" />
            
            {!counties && (
                <div className="absolute inset-0 z-[1000] flex flex-col items-center justify-center bg-black/80 transition-opacity duration-300">
                    <svg className="animate-spin h-10 w-10 text-white mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-white text-lg font-semibold">Loading Map Data...</p>
                </div>
            )}

            {selectedCounty && (
                <button
                    onClick={() => onCountySelect(null)}
                    className="absolute top-4 left-4 px-4 py-2 bg-green-700/50 border border-green-500/60 rounded-lg text-white font-semibold hover:bg-red-600 hover:border-red-400 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-200 z-[1000]"
                    aria-label="Back to full map of Kenya"
                >
                    Back to Kenya Map
                </button>
            )}

            {selectedCounty && (
                 <div className="absolute top-4 right-4 z-[1000] bg-black/50 backdrop-blur-lg border border-green-600/50 rounded-xl shadow-lg p-3 text-white">
                    <h3 className="text-md font-semibold mb-1 px-2 text-green-400">Divisions</h3>
                    <div className="space-y-0">
                        <CheckboxRow label="Sub-Counties" color="green" checked={showSubCounties} onChange={() => setShowSubCounties(!showSubCounties)} />
                        <CheckboxRow label="Wards" color="blue" checked={showWards} onChange={() => setShowWards(!showWards)} />
                        <CheckboxRow label="Constituencies" color="red" checked={showConstituencies} onChange={() => setShowConstituencies(!showConstituencies)} />
                    </div>
                </div>
            )}
        </div>
    );
};