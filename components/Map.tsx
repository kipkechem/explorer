
import React, { useRef, useEffect } from 'react';
import type { FeatureCollection } from 'geojson';
import type { CountyFeature } from '../types';

declare const L: any; // Using Leaflet from CDN

interface MapProps {
    counties: FeatureCollection | null;
    selectedCounty: CountyFeature | null;
    onCountySelect: (county: CountyFeature | null) => void;
}

const colors = {
    base: '#FAFAFA',      // Main plastic color (slightly off-white)
    hover: '#FFFFFF',     // Pure white for hover
    selected: '#FFFFFF',  // Pure white for selection
};

// Updated to a very light grey for a more subtle shadow effect
const darkerColors = {
    base: '#F5F5F5',      // A very light grey shadow
    hover: '#FAFAFA',     // An even lighter shadow for hover
    selected: '#FAFAFA',  // An even lighter shadow for selected
};

const baseStyle = {
    fillColor: 'url(#baseGradient)',
    weight: 1.5,
    opacity: 1,
    color: '#BDBDBD',
    fillOpacity: 1,
};

const hoverStyle = {
    weight: 3,
    fillColor: 'url(#hoverGradient)',
    color: '#9E9E9E',
    fillOpacity: 1,
};

const selectedStyle = {
    fillColor: 'url(#selectedGradient)',
    weight: 2.5,
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

export const Map: React.FC<MapProps> = ({ counties, selectedCounty, onCountySelect }) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any | null>(null);
    const geojsonLayerRef = useRef<any | null>(null);
    const extrusionLayerRef = useRef<any | null>(null);
    const tooltipRef = useRef<any | null>(null);
    
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
            // Shadow moved to NW to match new SE light source
            extrusionPane.style.transform = 'translate(-3px, -5px)';
            extrusionPane.style.zIndex = 399;
        }

        mapRef.current.whenReady(() => {
            try {
                const svg = mapRef.current.getRenderer(mapRef.current);
                if (svg && svg._container) {
                    const defs = L.SVG.create('defs');

                    // Gradient from NW (dark) to SE (light)
                    const createGradient = (id: string, mainColor: string, shadowColor: string, highlightOpacity: number) => {
                        const gradient = L.SVG.create('linearGradient');
                        gradient.setAttribute('id', id);
                        gradient.setAttribute('x1', '0%');
                        gradient.setAttribute('y1', '0%');
                        gradient.setAttribute('x2', '100%');
                        gradient.setAttribute('y2', '100%');

                        const stop1 = L.SVG.create('stop');
                        stop1.setAttribute('offset', '0%');
                        stop1.setAttribute('style', `stop-color:${shadowColor}`); // Shadow starts (NW)
                        
                        const stop2 = L.SVG.create('stop');
                        stop2.setAttribute('offset', '68%');
                        stop2.setAttribute('style', `stop-color:${mainColor}`); // Main body color
                        
                        const stop3 = L.SVG.create('stop');
                        stop3.setAttribute('offset', '80%');
                        stop3.setAttribute('style', `stop-color:rgba(255,255,255,${highlightOpacity * 0.15})`);
                        
                        const stop4 = L.SVG.create('stop');
                        stop4.setAttribute('offset', '100%');
                        stop4.setAttribute('style', `stop-color:rgba(255,255,255,${highlightOpacity})`); // Highlight ends (SE)
                        
                        gradient.appendChild(stop1);
                        gradient.appendChild(stop2);
                        gradient.appendChild(stop3);
                        gradient.appendChild(stop4);
                        return gradient;
                    };

                    const baseGradient = createGradient('baseGradient', colors.base, darkerColors.base, 0.675);
                    const hoverGradient = createGradient('hoverGradient', colors.hover, darkerColors.hover, 0.7);
                    const selectedGradient = createGradient('selectedGradient', colors.selected, darkerColors.selected, 0.7);
                    
                    defs.appendChild(baseGradient);
                    defs.appendChild(hoverGradient);
                    defs.appendChild(selectedGradient);
                    
                    svg._container.appendChild(defs);
                }
            } catch (e) {
                console.error("Could not append SVG defs for gradients.", e);
            }
        });

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

    return (
        <div className="relative w-full h-[60vh] lg:h-full p-0 bg-gray-800 border border-gray-700 rounded-2xl shadow-lg overflow-hidden">
            <div ref={mapContainerRef} className="w-full h-full bg-transparent" />
            
            {!counties && (
                <div className="absolute inset-0 z-[1000] flex flex-col items-center justify-center bg-gray-900/80 transition-opacity duration-300">
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
                    className="absolute top-4 left-4 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white font-semibold hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-200 z-[1000]"
                    aria-label="Back to full map of Kenya"
                >
                    Back to Kenya Map
                </button>
            )}
        </div>
    );
};
