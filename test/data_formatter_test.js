/* global describe it beforeEach expect afterEach */
import DataFormatter from '../src/data_formatter';

describe('DataFormatter', () => {
  let dataFormatter;
  let formattedData = [];

  describe('when latitude and longitude are given in table data and query type is coordinates', () => {
    beforeEach(() => {
      const ctrl = {
        panel: {
          tableQueryOptions: {
            queryType: 'coordinates',
            latitudeField: 'latitude',
            longitudeField: 'longitude'
          }
        }
      };
      dataFormatter = new DataFormatter(ctrl, {roundValue: () => {}});
    });

    it('should use latitude and longitude coordinates', () => {
      const tableData = [
        [
          {
            latitude: 1,
            longitude: 2
          },
          {
            latitude: 3,
            longitude: 4
          }
        ]
      ];
      const data = [];

      dataFormatter.setTableValues(tableData, data);

      expect(data[0].locationLatitude).to.equal(1);
      expect(data[0].locationLongitude).to.equal(2);
      expect(data[1].locationLatitude).to.equal(3);
      expect(data[1].locationLongitude).to.equal(4);
    });
  });

  describe('when geohash in table data and query type is geohash', () => {
    beforeEach(() => {
      const ctrl = {
        panel: {
          tableQueryOptions: {
            queryType: 'geohash',
            geohashField: 'geohash',
          }
        }
      };
      dataFormatter = new DataFormatter(ctrl, {roundValue: () => {}});
    });

    it('should use the geohash field for the query', () => {
      const tableData = [
        [
          {
            latitude: 1,
            longitude: 2,
            geohash: 'stq4s3x' // 29.9796, 31.1345
          },
          {
            latitude: 3,
            longitude: 4,
            geohash: 'p05010r' // -89.997, 139.273
          }
        ]
      ];
      const data = [];

      dataFormatter.setTableValues(tableData, data);

      expect(data[0].locationLatitude).to.be.within(29.9796, 29.9797);
      expect(data[0].locationLongitude).to.be.within(31.1345, 31.1346);
      expect(data[1].locationLatitude).to.be.within(-89.998, -89.997);
      expect(data[1].locationLongitude).to.be.within(139.272, 139.273);
    });
  });

  describe('when the time series data matches the location', () => {
    beforeEach(() => {
      const ctrl = {
        panel: {
          valueName: 'total'
        },
        locations: [
          {key: 'IE', name: 'Ireland', latitude: 1, longitude: 1},
          {key: 'SE', name: 'Sweden', latitude: 2, longitude: 2},
        ],
        series: [
          {alias: 'IE', datapoints: [1, 2], stats: {total: 3}},
          {alias: 'SE', datapoints: [2, 3], stats: {total: 5}},
        ]
      };
      dataFormatter = new DataFormatter(ctrl, {roundValue: () => {}});
      dataFormatter.setValues(formattedData);
    });

    it('should format the data and match the serie to a location', () => {
      expect(formattedData[0].key).to.equal('IE');
      expect(formattedData[0].locationName).to.equal('Ireland');
      expect(formattedData[0].locationLatitude).to.equal(1);
      expect(formattedData[0].locationLongitude).to.equal(1);
      expect(formattedData[0].value).to.equal(3);

      expect(formattedData[1].key).to.equal('SE');
      expect(formattedData[1].locationName).to.equal('Sweden');
      expect(formattedData[1].locationLatitude).to.equal(2);
      expect(formattedData[1].locationLongitude).to.equal(2);
      expect(formattedData[1].value).to.equal(5);
    });
  });

  describe('when the time series data has lowercase country codes', () => {
    beforeEach(() => {
      const ctrl = {
        panel: {
          valueName: 'total'
        },
        locations: [
          {key: 'IE', name: 'Ireland', latitude: 1, longitude: 1},
          {key: 'SE', name: 'Sweden', latitude: 2, longitude: 2},
        ],
        series: [
          {alias: 'ie', datapoints: [1, 2], stats: {total: 3}},
          {alias: 'se', datapoints: [2, 3], stats: {total: 5}},
        ]
      };
      dataFormatter = new DataFormatter(ctrl, {roundValue: () => {}});
      dataFormatter.setValues(formattedData);
    });

    it('should format the data and match the serie to a location', () => {
      expect(formattedData[0].key).to.equal('ie');
      expect(formattedData[0].locationName).to.equal('Ireland');
      expect(formattedData[0].locationLatitude).to.equal(1);
      expect(formattedData[0].locationLongitude).to.equal(1);
      expect(formattedData[0].value).to.equal(3);

      expect(formattedData[1].key).to.equal('se');
      expect(formattedData[1].locationName).to.equal('Sweden');
      expect(formattedData[1].locationLatitude).to.equal(2);
      expect(formattedData[1].locationLongitude).to.equal(2);
      expect(formattedData[1].value).to.equal(5);
    });
  });

  describe('when the time series data does not match any location', () => {
    beforeEach(() => {
      const ctrl = {
        panel: {
          valueName: 'total'
        },
        locations: [{key: 'IE', name: 'Ireland', latitude: 1, longitude: 1}],
        series: [
          {alias: 'SX', datapoints: [1, 2], stats: {total: 3}},
          {alias: 'IE', datapoints: [1, 2], stats: {total: 3}}
        ]
      };
      dataFormatter = new DataFormatter(ctrl, {roundValue: () => {}});
      dataFormatter.setValues(formattedData);
    });

    it('should ignore the serie', () => {
      expect(formattedData.length).to.equal(1);
    });
  });

  describe('when the time series data has decimals', () => {
    describe('and decimals are specified as an integer', () => {
      let numberOfDecimals;

      beforeEach(() => {
        const ctrl = {
          panel: {
            valueName: 'total',
            decimals: 2
          },
          locations: [
            {key: 'IE', name: 'Ireland', latitude: 1, longitude: 1},
            {key: 'SE', name: 'Sweden', latitude: 2, longitude: 2},
          ],
          series: [
            {alias: 'IE', datapoints: [1.11, 2.22], stats: {total: 3.33}},
            {alias: 'SE', datapoints: [2.221, 3.331], stats: {total: 5.552}},
          ]
        };
        dataFormatter = new DataFormatter(ctrl, {
          roundValue: (value, decimals) => {
            numberOfDecimals = decimals;
          }
        });
        dataFormatter.setValues(formattedData);
      });

      it('should format the value with 2 decimals', () => {
        expect(numberOfDecimals).to.equal(2);
      });
    });

    describe('and decimals are specified as a string', () => {
      let numberOfDecimals;

      beforeEach(() => {
        const ctrl = {
          panel: {
            valueName: 'total',
            decimals: '2'
          },
          locations: [
            {key: 'IE', name: 'Ireland', latitude: 1, longitude: 1},
            {key: 'SE', name: 'Sweden', latitude: 2, longitude: 2},
          ],
          series: [
            {alias: 'IE', datapoints: [1.11, 2.22], stats: {total: 3.33}},
            {alias: 'SE', datapoints: [2.221, 3.331], stats: {total: 5.552}},
          ]
        };
        dataFormatter = new DataFormatter(ctrl, {
          roundValue: (value, decimals) => {
            numberOfDecimals = decimals;
          }
        });
        dataFormatter.setValues(formattedData);
      });

      it('should format the value with 2 decimals', () => {
        expect(numberOfDecimals).to.equal(2);
      });
    });
  });

  afterEach(() => {
    formattedData = [];
  });
});
