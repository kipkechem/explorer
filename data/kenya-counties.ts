import { countyFeatures } from './county-features';
import type { FeatureCollection } from 'geojson';

export const kenyaCountiesGeoJSON: FeatureCollection = {
  "type": "FeatureCollection",
  "features": countyFeatures
};
