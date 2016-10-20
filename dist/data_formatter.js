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
              (function () {
                var highestValue = 0;
                var lowestValue = Number.MAX_VALUE;

                _this.ctrl.series.forEach(function (serie) {
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
              })();
            }
          }
        }, {
          key: 'setGeohashValues',
          value: function setGeohashValues(dataList, data) {
            var _this2 = this;

            if (!this.ctrl.panel.esGeoPoint || !this.ctrl.panel.esMetric) return;

            if (dataList && dataList.length > 0) {
              (function () {
                var highestValue = 0;
                var lowestValue = Number.MAX_VALUE;

                dataList[0].datapoints.forEach(function (datapoint) {
                  var encodedGeohash = datapoint[_this2.ctrl.panel.esGeoPoint];
                  var decodedGeohash = decodeGeoHash(encodedGeohash);

                  var dataValue = {
                    key: encodedGeohash,
                    locationName: _this2.ctrl.panel.esLocationName ? datapoint[_this2.ctrl.panel.esLocationName] : encodedGeohash,
                    locationLatitude: decodedGeohash.latitude,
                    locationLongitude: decodedGeohash.longitude,
                    value: datapoint[_this2.ctrl.panel.esMetric],
                    valueFormatted: datapoint[_this2.ctrl.panel.esMetric],
                    valueRounded: 0
                  };

                  if (dataValue.value > highestValue) highestValue = dataValue.value;
                  if (dataValue.value < lowestValue) lowestValue = dataValue.value;

                  dataValue.valueRounded = _this2.kbn.roundValue(dataValue.value, _this2.ctrl.panel.decimals || 0);
                  data.push(dataValue);
                });

                data.highestValue = highestValue;
                data.lowestValue = lowestValue;
                data.valueRange = highestValue - lowestValue;
              })();
            }
          }
        }, {
          key: 'setTableValues',
          value: function setTableValues(tableData, data) {
            var _this3 = this;

            if (tableData && tableData.length > 0) {
              (function () {
                var highestValue = 0;
                var lowestValue = Number.MAX_VALUE;

                tableData[0].forEach(function (datapoint) {
                  if (!datapoint.geohash) {
                    return;
                  }

                  var encodedGeohash = datapoint.geohash;
                  var decodedGeohash = decodeGeoHash(encodedGeohash);

                  var dataValue = {
                    key: encodedGeohash,
                    locationName: datapoint[_this3.ctrl.panel.tableLabel] || 'n/a',
                    locationLatitude: decodedGeohash.latitude,
                    locationLongitude: decodedGeohash.longitude,
                    value: datapoint.metric,
                    valueFormatted: datapoint.metric,
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
              })();
            }
          }
        }], [{
          key: 'tableHandler',
          value: function tableHandler(tableData) {
            var datapoints = [];

            if (tableData.type === 'table') {
              (function () {
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
              })();
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
