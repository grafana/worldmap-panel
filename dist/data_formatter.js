'use strict';

System.register(['lodash'], function (_export, _context) {
  "use strict";

  var _, _createClass, DataFormatter;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  return {
    setters: [function (_lodash) {
      _ = _lodash.default;
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
        }]);

        return DataFormatter;
      }();

      _export('default', DataFormatter);
    }
  };
});
//# sourceMappingURL=data_formatter.js.map
