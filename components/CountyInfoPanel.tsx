import React from 'react';
import type { CountyFeature } from '../types';

interface CountyInfoPanelProps {
    county: CountyFeature;
    onClose: () => void;
}

const InfoRow: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
    <div className="flex justify-between items-baseline py-2 border-b border-gray-600">
        <span className="text-sm font-medium text-white/80">{label}</span>
        <span className="text-right font-semibold text-white">{value.toLocaleString()}</span>
    </div>
);

export const CountyInfoPanel: React.FC<CountyInfoPanelProps> = ({ county, onClose }) => {
    const { county_name, county_code, area_sq_km, sub_counties, population, capital } = county.properties;

    return (
        <div className="h-full bg-gray-800 border border-gray-700 rounded-2xl shadow-lg p-6 text-white flex flex-col">
            <div className="flex-shrink-0 flex justify-between items-center mb-4">
                <h2 className="text-3xl font-bold">
                    {county_name} <span className="text-2xl font-medium text-white/70">({String(county_code).padStart(3, '0')})</span>
                </h2>
                <button
                    onClick={onClose}
                    className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors duration-200"
                    aria-label="Back to Kenya Map"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div className="flex-shrink-0 space-y-2">
                <InfoRow label="Capital" value={capital} />
                <InfoRow label="Population (2019)" value={population} />
                <InfoRow label="Area (km²)" value={Number(area_sq_km).toLocaleString()} />
            </div>

            <div className="mt-6 pt-4 border-t border-gray-600 flex-1 flex flex-col min-h-0">
                <h3 className="text-lg font-semibold mb-2 flex-shrink-0">Sub-Counties</h3>
                <div className="overflow-y-auto pr-2 scroll-smooth">
                    <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-white/90 capitalize">
                        {sub_counties.map((subCounty) => (
                            <li key={subCounty}>{subCounty.toLowerCase()}</li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};