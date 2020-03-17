import DataFormatter from './data_formatter';
import { ErrorManager } from './errors';
import * as jQuery from 'jquery';

describe('DataFormatter', () => {
  let ctrl;
  let dataFormatter;
  let formattedData: any[] = [];

  beforeEach(() => {
    const errors = new ErrorManager();
    errors.registerDomains('data', 'location');
    ctrl = {
      errors: errors,
    };
  });

  describe('when latitude and longitude are given in table data and query type is coordinates', () => {
    beforeEach(() => {
      jQuery.extend(ctrl, {
        panel: {
          tableQueryOptions: {
            queryType: 'coordinates',
            latitudeField: 'latitude',
            longitudeField: 'longitude',
          },
        },
      });
      dataFormatter = new DataFormatter(ctrl);
    });

    it('should use latitude and longitude coordinates', () => {
      const tableData = [
        [
          {
            latitude: 1,
            longitude: 2,
          },
          {
            latitude: 3,
            longitude: 4,
          },
        ],
      ];
      const data: any[] = [];

      dataFormatter.setTableValues(tableData, data);

      expect(data[0].locationLatitude).toEqual(1);
      expect(data[0].locationLongitude).toEqual(2);
      expect(data[1].locationLatitude).toEqual(3);
      expect(data[1].locationLongitude).toEqual(4);
    });
  });

  describe('when geohash in table data and query type is geohash', () => {
    beforeEach(() => {
      const ctrl = {
        panel: {
          tableQueryOptions: {
            queryType: 'geohash',
            geohashField: 'geohash',
          },
        },
      };
      dataFormatter = new DataFormatter(ctrl);
    });

    it('should use the geohash field for the query', () => {
      const tableData = [
        [
          {
            latitude: 1,
            longitude: 2,
            geohash: 'stq4s3x', // 29.9796, 31.1345
          },
          {
            latitude: 3,
            longitude: 4,
            geohash: 'p05010r', // -89.997, 139.273
          },
        ],
      ];
      const data: any[] = [];

      dataFormatter.setTableValues(tableData, data);

      expect(data[0].locationLatitude).toBeCloseTo(29.9796);
      expect(data[0].locationLongitude).toBeCloseTo(31.1345);
      expect(data[1].locationLatitude).toBeCloseTo(-89.998);
      expect(data[1].locationLongitude).toBeCloseTo(139.272);
    });
  });

  describe('when location information is from table+json and labelField and geohashField are in table data', () => {
    /*
     * Hybrid "table+json(p)" Location Data
     *
     * We are testing the "table+json" and "table+jsonp" location data
     * sources here. They are used when basic location information is
     * coming from table data but humanized labels are resolved from a
     * JSON/JSONP data source by appropriate field name mapping.
     *
     * See also:
     * - https://github.com/grafana/worldmap-panel/pull/177
     * - https://community.hiveeyes.org/t/erneuerung-der-luftdatenpumpe/1199
     * - https://community.hiveeyes.org/t/ldi-data-plane-v2/1412
     * - https://community.hiveeyes.org/t/grafana-worldmap-panel-ng/1824/2
     */
    beforeEach(() => {
      const ctrl = {
        panel: {
          locationData: 'table+json',
          tableQueryOptions: {
            queryType: 'geohash',
            geohashField: 'geohash',
            labelLocationKeyField: 'station_id',
          },
        },
        // Location enrichment data is ingested from a JSON(P) response.
        locations: [
          {
            key: '28',
            name: 'Ulmer Stra\u00dfe, Wangen, Stuttgart, Baden-W\u00fcrttemberg, DE',
          },
          {
            key: '1071',
            name: 'Gerichtstra\u00dfe, Gesundbrunnen, Mitte, Berlin, DE',
          },
        ],
      };
      dataFormatter = new DataFormatter(ctrl);
    });

    it("should use the value from table's labelLocationKeyField as a key to lookup the designated locationName from the JSON/JSONP result", () => {
      // Main Location Data is coming from table data.
      // However, the humanized string is resolved by mapping e.g.
      // "station_id == 28" to "key == 28", in turn yielding the
      // designated "name" for display. Easy, isn't it?
      const tableData = [
        [
          {
            station_id: '28',
            geohash: 'u0wt6pv2qqhz',
          },
          {
            station_id: '1071',
            geohash: 'u33dbm6duz90',
          },
        ],
      ];
      const data: any[] = [];

      dataFormatter.setTableValues(tableData, data);

      expect(data[0].locationLatitude).toBeCloseTo(48.7779);
      expect(data[0].locationLongitude).toBeCloseTo(9.236);
      expect(data[0].locationName).toEqual('Ulmer Straße, Wangen, Stuttgart, Baden-Württemberg, DE');

      expect(data[1].locationLatitude).toBeCloseTo(52.544);
      expect(data[1].locationLongitude).toBeCloseTo(13.374);
      expect(data[1].locationName).toEqual('Gerichtstraße, Gesundbrunnen, Mitte, Berlin, DE');
    });
  });

  describe('when some fields are given in table data', () => {

    const data: any[] = [];

    beforeEach(() => {

      jQuery.extend(ctrl, {
        panel: {
          tableQueryOptions: {
          },
        },
      });

      const tableData = [
        [
          {
            foo: "42.42",
            bar: 42.42,
          },
          {
            foo: "43.43",
            bar: 43.43,
          },
        ],
      ];

      const dataFormatter = new DataFormatter(ctrl);
      dataFormatter.setTableValues(tableData, data);

    });

    it('the fields should be available within transformed data', () => {
      expect(data[0].__field_foo).toEqual("42.42");
      expect(data[0].__field_bar).toEqual(42.42);
      expect(data[1].__field_foo).toEqual("43.43");
      expect(data[1].__field_bar).toEqual(43.43);
    });

  });

  describe('when the time series data matches the location', () => {
    beforeEach(() => {
      jQuery.extend(ctrl, {
        panel: {
          valueName: 'total',
        },
        locations: [
          { key: 'IE', name: 'Ireland', latitude: 1, longitude: 1 },
          { key: 'SE', name: 'Sweden', latitude: 2, longitude: 2 },
        ],
        series: [
          { alias: 'IE', datapoints: [1, 2], stats: { total: 3 } },
          { alias: 'SE', datapoints: [2, 3], stats: { total: 5 } },
        ],
      });
      dataFormatter = new DataFormatter(ctrl);
      dataFormatter.setTimeseriesValues(ctrl.series, formattedData);
    });

    it('should format the data and match the serie to a location', () => {
      expect(formattedData[0].key).toEqual('IE');
      expect(formattedData[0].locationName).toEqual('Ireland');
      expect(formattedData[0].locationLatitude).toEqual(1);
      expect(formattedData[0].locationLongitude).toEqual(1);
      expect(formattedData[0].value).toEqual(3);

      expect(formattedData[1].key).toEqual('SE');
      expect(formattedData[1].locationName).toEqual('Sweden');
      expect(formattedData[1].locationLatitude).toEqual(2);
      expect(formattedData[1].locationLongitude).toEqual(2);
      expect(formattedData[1].value).toEqual(5);
    });
  });

  describe('when the time series data has lowercase country codes', () => {
    beforeEach(() => {
      jQuery.extend(ctrl, {
        panel: {
          valueName: 'total',
        },
        locations: [
          { key: 'IE', name: 'Ireland', latitude: 1, longitude: 1 },
          { key: 'SE', name: 'Sweden', latitude: 2, longitude: 2 },
        ],
        series: [
          { alias: 'ie', datapoints: [1, 2], stats: { total: 3 } },
          { alias: 'se', datapoints: [2, 3], stats: { total: 5 } },
        ],
      });
      dataFormatter = new DataFormatter(ctrl);
      dataFormatter.setTimeseriesValues(ctrl.series, formattedData);
    });

    it('should format the data and match the serie to a location', () => {
      expect(formattedData[0].key).toEqual('ie');
      expect(formattedData[0].locationName).toEqual('Ireland');
      expect(formattedData[0].locationLatitude).toEqual(1);
      expect(formattedData[0].locationLongitude).toEqual(1);
      expect(formattedData[0].value).toEqual(3);

      expect(formattedData[1].key).toEqual('se');
      expect(formattedData[1].locationName).toEqual('Sweden');
      expect(formattedData[1].locationLatitude).toEqual(2);
      expect(formattedData[1].locationLongitude).toEqual(2);
      expect(formattedData[1].value).toEqual(5);
    });
  });

  describe('when the time series data does not match any location', () => {
    beforeEach(() => {
      jQuery.extend(ctrl, {
        panel: {
          valueName: 'total',
        },
        locations: [{ key: 'IE', name: 'Ireland', latitude: 1, longitude: 1 }],
        series: [
          { alias: 'SX', datapoints: [1, 2], stats: { total: 3 } },
          { alias: 'IE', datapoints: [1, 2], stats: { total: 3 } },
        ],
      });
      dataFormatter = new DataFormatter(ctrl);
      dataFormatter.setTimeseriesValues(ctrl.series, formattedData);
    });

    it('should ignore the serie', () => {
      expect(formattedData.length).toEqual(1);
    });
  });

  describe('when the time series data has decimals', () => {
    describe('and decimals are specified as an integer', () => {
      beforeEach(() => {
        jQuery.extend(ctrl, {
          panel: {
            valueName: 'total',
            decimals: 2,
          },
          locations: [
            { key: 'IE', name: 'Ireland', latitude: 1, longitude: 1 },
            { key: 'SE', name: 'Sweden', latitude: 2, longitude: 2 },
          ],
          series: [
            { alias: 'IE', datapoints: [1.11, 2.22], stats: { total: 3.33 } },
            { alias: 'SE', datapoints: [2.221, 3.331], stats: { total: 5.552 } },
          ],
        });
        dataFormatter = new DataFormatter(ctrl);
        dataFormatter.setTimeseriesValues(ctrl.series, formattedData);
      });

      it('should format the value with 2 decimals', () => {
        expect(formattedData[1].valueRounded).toEqual(5.55);
      });
    });

    describe('and decimals are specified as a string', () => {
      beforeEach(() => {
        jQuery.extend(ctrl, {
          panel: {
            valueName: 'total',
            decimals: '2',
          },
          locations: [
            { key: 'IE', name: 'Ireland', latitude: 1, longitude: 1 },
            { key: 'SE', name: 'Sweden', latitude: 2, longitude: 2 },
          ],
          series: [
            { alias: 'IE', datapoints: [1.11, 2.22], stats: { total: 3.33 } },
            { alias: 'SE', datapoints: [2.221, 3.331], stats: { total: 5.552 } },
          ],
        });
        dataFormatter = new DataFormatter(ctrl);
        dataFormatter.setTimeseriesValues(ctrl.series, formattedData);
      });

      it('should format the value with 2 decimals', () => {
        expect(formattedData[1].valueRounded).toEqual(5.55);
      });
    });
  });

  describe('when elasticsearch geohash query result is in table format', () => {

    const data: any[] = [];

    beforeEach(() => {

      jQuery.extend(ctrl, {
        panel: {
          esGeoPoint: 'geopoint',
          esMetric: 'metric',
          //esLocationName: 'location',
          //esLink: 'link',
        },
      });

      const esdata = [
        {
          'type': 'table',
          'columns': [
            {text: 'geopoint'},
            {text: 'metric'},
            {text: 'foo'},
            {text: 'bar'},
          ],
          'rows': [
            [
              'u0wt6pv2qqhz',
              123.45,
              "42.42",
              42.42,
            ],
            [
              'u33dbm6duz90',
              67.890,
              "43.43",
              43.43,
            ],
          ],
        },
      ];

      const dataFormatter = new DataFormatter(ctrl);
      dataFormatter.setGeohashValues(esdata, data);

    });

    it('the fields should be available within transformed data', () => {
      expect(data[0].value).toEqual(123.45);
      expect(data[0].__field_foo).toEqual("42.42");
      expect(data[0].__field_bar).toEqual(42.42);
      expect(data[1].value).toEqual(67.890);
      expect(data[1].__field_foo).toEqual("43.43");
      expect(data[1].__field_bar).toEqual(43.43);
    });

  });

  describe('when elasticsearch geohash query result is in timeseries format', () => {

    const data: any[] = [];

    beforeEach(() => {

      jQuery.extend(ctrl, {
        panel: {
          esGeoPoint: 'geopoint',
          esMetric: 'metric',
          //esLocationName: 'location',
          //esLink: 'link',
        },
      });

      const esdata = [
        {
          'datapoints': [
            {
              geopoint: 'u0wt6pv2qqhz',
              metric: 123.45,
              foo: "42.42",
              bar: 42.42,
            },
            {
              geopoint: 'u33dbm6duz90',
              metric: 67.890,
              foo: "43.43",
              bar: 43.43,
            },
          ],
        },
      ];

      const dataFormatter = new DataFormatter(ctrl);
      dataFormatter.setGeohashValues(esdata, data);

    });

    it('the fields should be available within transformed data', () => {
      expect(data[0].value).toEqual(123.45);
      expect(data[0].__field_foo).toEqual("42.42");
      expect(data[0].__field_bar).toEqual(42.42);
      expect(data[1].value).toEqual(67.890);
      expect(data[1].__field_foo).toEqual("43.43");
      expect(data[1].__field_bar).toEqual(43.43);
    });

  });

  afterEach(() => {
    formattedData = [];
  });

});
