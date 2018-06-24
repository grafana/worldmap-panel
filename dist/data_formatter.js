'use strict';

System.register(['lodash', './geohash'], function (_export, _context) {
  "use strict";

  var _, decodeGeoHash, _createClass, DataFormatter;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  return {
    setters: [function (_lodash) {
      _ = _lodash.default;
    }, function (_geohash) {
      decodeGeoHash = _geohash.default;
    }],
    execute: function () {
      _createClass = function () {
        function defineProperties(target, props) {
          for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || false;
            descriptor.configurable = true;
            if ("value" in descriptor) descriptor.writable = true;
            Object.defineProperty(target, descriptor.key, descriptor);
          }
        }

        return function (Constructor, protoProps, staticProps) {
          if (protoProps) defineProperties(Constructor.prototype, protoProps);
          if (staticProps) defineProperties(Constructor, staticProps);
          return Constructor;
        };
      }();

      DataFormatter = function () {
        function DataFormatter(ctrl, kbn) {
          _classCallCheck(this, DataFormatter);

          this.ctrl = ctrl;
          this.kbn = kbn;
        }

        _createClass(DataFormatter, [{
          key: 'setValues',
          value: function setValues(data) {
            var _this = this;

            if (this.ctrl.series && this.ctrl.series.length > 0) {
              var highestValue = 0;
              var lowestValue = Number.MAX_VALUE;

              this.ctrl.series.forEach(function (serie) {
                var lastPoint = _.last(serie.datapoints);
                var lastValue = _.isArray(lastPoint) ? lastPoint[0] : null;
                var location = _.find(_this.ctrl.locations, function (loc) {
                  return loc.key.toUpperCase() === serie.alias.toUpperCase();
                });

                if (!location) return;

                if (_.isString(lastValue)) {
                  data.push({ key: serie.alias, value: 0, valueFormatted: lastValue, valueRounded: 0 });
                } else {
                  var dataValue = {
                    key: serie.alias,
                    locationName: location.name,
                    locationLatitude: location.latitude,
                    locationLongitude: location.longitude,
                    value: serie.stats[_this.ctrl.panel.valueName],
                    valueFormatted: lastValue,
                    valueRounded: 0
                  };

                  if (dataValue.value > highestValue) highestValue = dataValue.value;
                  if (dataValue.value < lowestValue) lowestValue = dataValue.value;

                  dataValue.valueRounded = _this.kbn.roundValue(dataValue.value, parseInt(_this.ctrl.panel.decimals, 10) || 0);
                  data.push(dataValue);
                }
              });

              data.highestValue = highestValue;
              data.lowestValue = lowestValue;
              data.valueRange = highestValue - lowestValue;
            }
          }
        }, {
          key: 'createDataValue',
          value: function createDataValue(encodedGeohash, decodedGeohash, locationName, value) {
            var dataValue = {
              key: encodedGeohash,
              locationName: locationName,
              locationLatitude: decodedGeohash.latitude,
              locationLongitude: decodedGeohash.longitude,
              value: value,
              valueFormatted: value,
              valueRounded: 0
            };

            dataValue.valueRounded = this.kbn.roundValue(dataValue.value, this.ctrl.panel.decimals || 0);
            return dataValue;
          }
        }, {
          key: 'setGeohashValues',
          value: function setGeohashValues(dataList, data) {
            var _this2 = this;

            if (!this.ctrl.panel.esGeoPoint || !this.ctrl.panel.esMetric) return;

            if (dataList && dataList.length > 0) {
              var highestValue = 0;
              var lowestValue = Number.MAX_VALUE;

              dataList.forEach(function (result) {
                if (result.type === 'table') {
                  var columnNames = {};

                  result.columns.forEach(function (column, columnIndex) {
                    columnNames[column.text] = columnIndex;
                  });

                  result.rows.forEach(function (row) {
                    var encodedGeohash = row[columnNames[_this2.ctrl.panel.esGeoPoint]];
                    var decodedGeohash = decodeGeoHash(encodedGeohash);
                    var locationName = _this2.ctrl.panel.esLocationName ? row[columnNames[_this2.ctrl.panel.esLocationName]] : encodedGeohash;
                    var value = row[columnNames[_this2.ctrl.panel.esMetric]];

                    var dataValue = _this2.createDataValue(encodedGeohash, decodedGeohash, locationName, value, highestValue, lowestValue);
                    if (dataValue.value > highestValue) highestValue = dataValue.value;
                    if (dataValue.value < lowestValue) lowestValue = dataValue.value;
                    data.push(dataValue);
                  });

                  data.highestValue = highestValue;
                  data.lowestValue = lowestValue;
                  data.valueRange = highestValue - lowestValue;
                } else {
                  result.datapoints.forEach(function (datapoint) {
                    var encodedGeohash = datapoint[_this2.ctrl.panel.esGeoPoint];
                    var decodedGeohash = decodeGeoHash(encodedGeohash);
                    var locationName = _this2.ctrl.panel.esLocationName ? datapoint[_this2.ctrl.panel.esLocationName] : encodedGeohash;
                    var value = datapoint[_this2.ctrl.panel.esMetric];

                    var dataValue = _this2.createDataValue(encodedGeohash, decodedGeohash, locationName, value, highestValue, lowestValue);
                    if (dataValue.value > highestValue) highestValue = dataValue.value;
                    if (dataValue.value < lowestValue) lowestValue = dataValue.value;
                    data.push(dataValue);
                  });

                  data.highestValue = highestValue;
                  data.lowestValue = lowestValue;
                  data.valueRange = highestValue - lowestValue;
                }
              });
            }
          }
        }, {
          key: 'setTableValues',
          value: function setTableValues(tableData, data) {
            var _this3 = this;

            if (tableData && tableData.length > 0) {
              var highestValue = 0;
              var lowestValue = Number.MAX_VALUE;

              tableData[0].forEach(function (datapoint) {
                var key = void 0;
                var longitude = void 0;
                var latitude = void 0;

                if (_this3.ctrl.panel.tableQueryOptions.queryType === 'geohash') {
                  var encodedGeohash = datapoint[_this3.ctrl.panel.tableQueryOptions.geohashField];
                  var decodedGeohash = decodeGeoHash(encodedGeohash);

                  latitude = decodedGeohash.latitude;
                  longitude = decodedGeohash.longitude;
                  key = encodedGeohash;
                } else {
                  latitude = datapoint[_this3.ctrl.panel.tableQueryOptions.latitudeField];
                  longitude = datapoint[_this3.ctrl.panel.tableQueryOptions.longitudeField];
                  key = latitude + '_' + longitude;
                }

                var dataValue = {
                  key: key,
                  locationName: datapoint[_this3.ctrl.panel.tableQueryOptions.labelField] || 'n/a',
                  locationLatitude: latitude,
                  locationLongitude: longitude,
                  value: datapoint[_this3.ctrl.panel.tableQueryOptions.metricField],
                  valueFormatted: datapoint[_this3.ctrl.panel.tableQueryOptions.metricField],
                  valueRounded: 0
                };

                if (dataValue.value > highestValue) highestValue = dataValue.value;
                if (dataValue.value < lowestValue) lowestValue = dataValue.value;

                dataValue.valueRounded = _this3.kbn.roundValue(dataValue.value, _this3.ctrl.panel.decimals || 0);
                data.push(dataValue);
              });

              data.highestValue = highestValue;
              data.lowestValue = lowestValue;
              data.valueRange = highestValue - lowestValue;
            }
          }
        }, {
          key: 'setJsonValues',
          value: function setJsonValues(data) {
            if (this.ctrl.series && this.ctrl.series.length > 0) {
              var highestValue = 0;
              var lowestValue = Number.MAX_VALUE;

              this.ctrl.series.forEach(function (point) {
                var dataValue = {
                  key: point.key,
                  locationName: point.name,
                  locationLatitude: point.latitude,
                  locationLongitude: point.longitude,
                  value: point.value !== undefined ? point.value : 1,
                  valueRounded: 0
                };
                if (dataValue.value > highestValue) highestValue = dataValue.value;
                if (dataValue.value < lowestValue) lowestValue = dataValue.value;
                dataValue.valueRounded = Math.round(dataValue.value);
                data.push(dataValue);
              });
              data.highestValue = highestValue;
              data.lowestValue = lowestValue;
              data.valueRange = highestValue - lowestValue;
            }
          }
        }], [{
          key: 'tableHandler',
          value: function tableHandler(tableData) {
            var datapoints = [];

            if (tableData.type === 'table') {
              var columnNames = {};

              tableData.columns.forEach(function (column, columnIndex) {
                columnNames[columnIndex] = column.text;
              });

              tableData.rows.forEach(function (row) {
                var datapoint = {};

                row.forEach(function (value, columnIndex) {
                  var key = columnNames[columnIndex];
                  datapoint[key] = value;
                });

                datapoints.push(datapoint);
              });
            }

            return datapoints;
          }
        }]);

        return DataFormatter;
      }();

      _export('default', DataFormatter);
    }
  };
});
//# sourceMappingURL=data_formatter.js.map
