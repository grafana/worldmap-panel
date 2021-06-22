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
