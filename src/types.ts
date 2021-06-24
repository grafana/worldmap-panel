export interface DataPoint {
  key: string;
  locationName: string;
  locationLatitude: number;
  locationLongitude: number;
  value: number;
  valueRounded: number;
}

export interface DataPoints extends Array<DataPoint> {
  highestValue: number;
  lowestValue: number;
  valueRange: number;
  thresholds: number[];
}

export interface LegacyTable {
  columns: { text: string }[];
  type: string;
  refId: string;
  meta: any;
  rows: any[][];
}

export interface LegacyTimeSeries {
  alias: string;
  target: string;
  datapoints: any[];
  refId: string;
  meta: any;
}

export interface FrameMapInfo {
  timeColumn: number;
  columnMap: Map<string, LegacyTimeSeries>;
  refId: string;
  meta: any;
}
