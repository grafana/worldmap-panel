export class LocationFormat {
  static readonly Table: string = 'Table';
  static readonly Timeseries: string = 'Timeseries';
  static readonly JSON: string = 'JSON';
}

export class LocationType {
  static readonly Generic: string = 'Generic';
  static readonly Table: string = 'Table with latitude/longitude or geohash fields';
  static readonly TimeseriesBuiltin: string = 'Time series, resolve location by matching metric name against';
  static readonly TimeseriesJson: string = 'Time series, resolve location from custom JSON';
}

export const LocationSources = [
  {
    id: null,
    label: '--- Select data format and location mapping ---',
  },

  {
    id: 'geohash',
    label: 'geohash field or tag from database',
    type: LocationType.Generic,
    format: [LocationFormat.Timeseries, LocationFormat.Table],
  },
  {
    id: 'json result',
    label: 'JSON from data source',
    type: LocationType.Generic,
    format: LocationFormat.JSON,
  },

  {
    id: 'table',
    label: 'Obtain label from database',
    type: LocationType.Table,
    format: LocationFormat.Table,
  },
  {
    id: 'table+json',
    label: 'Obtain label by JSON lookup with key value from database',
    type: LocationType.Table,
    format: LocationFormat.Table,
  },
  {
    id: 'table+jsonp',
    label: 'Obtain label by JSONP lookup with key value from database',
    type: LocationType.Table,
    format: LocationFormat.Table,
  },

  {
    id: 'json endpoint',
    label: 'Match metric name against key value of JSON record',
    type: LocationType.TimeseriesJson,
    format: LocationFormat.Timeseries,
  },
  {
    id: 'jsonp endpoint',
    label: 'Match metric name against key value of JSON record (JSONP)',
    type: LocationType.TimeseriesJson,
    format: LocationFormat.Timeseries,
  },

  {
    id: 'countries',
    label: '2-letter country codes',
    type: LocationType.TimeseriesBuiltin,
    format: LocationFormat.Timeseries,
  },
  {
    id: 'countries_3letter',
    label: '3-letter country codes',
    type: LocationType.TimeseriesBuiltin,
    format: LocationFormat.Timeseries,
  },
  {
    id: 'states',
    label: '2-letter US state codes',
    type: LocationType.TimeseriesBuiltin,
    format: LocationFormat.Timeseries,
  },
  {
    id: 'probes',
    label: 'Grafana worldPing probes',
    type: LocationType.TimeseriesBuiltin,
    format: LocationFormat.Timeseries,
  },
];

export class MapCenterType {
  static readonly Other: string = 'Others';
  static readonly Region: string = 'Regions';
  static readonly Country: string = 'Countries';
  static readonly City: string = 'Cities';
}

export const MapCenters = [
  {
    id: null,
    label: '--- Select map center and zoom level ---',
  },

  {
    id: 'custom',
    label: 'custom',
    type: MapCenterType.Other,
  },
  {
    id: '(0°, 0°)',
    label: 'World',
    type: MapCenterType.Other,
    data: { mapCenterLatitude: 0, mapCenterLongitude: 0, initialZoom: 1 },
  },
  {
    id: 'First GeoHash',
    label: 'First GeoHash',
    type: MapCenterType.Other,
  },
  {
    id: 'Last GeoHash',
    label: 'Last GeoHash',
    type: MapCenterType.Other,
  },

  {
    id: 'Europe',
    label: 'Europe',
    type: MapCenterType.Region,
    data: { mapCenterLatitude: 46, mapCenterLongitude: 14, initialZoom: 4 },
  },
  {
    id: 'North America',
    label: 'North America',
    type: MapCenterType.Region,
    data: { mapCenterLatitude: 40, mapCenterLongitude: -100, initialZoom: 3 },
  },
  {
    id: 'SE Asia',
    label: 'South-East Asia',
    type: MapCenterType.Region,
    data: { mapCenterLatitude: 10, mapCenterLongitude: 106, initialZoom: 4 },
  },
  {
    id: 'West Asia',
    label: 'West Asia',
    type: MapCenterType.Region,
    data: { mapCenterLatitude: 26, mapCenterLongitude: 53, initialZoom: 4 },
  },

  {
    id: 'Belgium',
    label: 'Belgium',
    type: MapCenterType.Country,
    data: { mapCenterLatitude: 50.53665, mapCenterLongitude: 4.39851, initialZoom: 7 },
  },
  {
    id: 'Germany',
    label: 'Germany',
    type: MapCenterType.Country,
    data: { mapCenterLatitude: 51.35149, mapCenterLongitude: 10.45412, initialZoom: 5 },
  },
  {
    id: 'Sweden',
    label: 'Sweden',
    type: MapCenterType.Country,
    data: { mapCenterLatitude: 62.91154, mapCenterLongitude: 17.38539, initialZoom: 4 },
  },

  {
    id: 'Berlin',
    label: 'Berlin',
    type: MapCenterType.City,
    data: { mapCenterLatitude: 52.51733, mapCenterLongitude: 13.38886, initialZoom: 10 },
  },
  {
    id: 'New York',
    label: 'New York',
    type: MapCenterType.City,
    data: { mapCenterLatitude: 40.69715, mapCenterLongitude: -73.97964, initialZoom: 10 },
  },
  {
    id: 'Stockholm',
    label: 'Stockholm',
    type: MapCenterType.City,
    data: { mapCenterLatitude: 59.32549, mapCenterLongitude: 18.07109, initialZoom: 11 },
  },
];

export const ColorModes = {
  threshold: {
    id: 'threshold',
    label: 'threshold',
  },
  categories: {
    id: 'categories',
    label: 'categories',
  },
};
