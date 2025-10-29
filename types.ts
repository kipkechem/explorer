import type { Feature, Geometry } from 'geojson';

export interface CountyProperties {
  county_name: string;
  county_code: number;
  area_sq_km: string;
  population: number;
  capital: string;
  sub_counties: string[];
}

export type CountyFeature = Feature<Geometry, CountyProperties>;