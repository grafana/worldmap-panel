'use strict';

System.register(['app/plugins/sdk', 'lodash', './leaflet', 'app/core/time_series2', 'app/core/utils/kbn'], function (_export, _context) {
  var MetricsPanelCtrl, _, L, TimeSeries, kbn, _createClass, panelDefaults, WorldmapCtrl;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _possibleConstructorReturn(self, call) {
    if (!self) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return call && (typeof call === "object" || typeof call === "function") ? call : self;
  }

  function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
    }

    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
  }

  return {
    setters: [function (_appPluginsSdk) {
      MetricsPanelCtrl = _appPluginsSdk.MetricsPanelCtrl;
    }, function (_lodash) {
      _ = _lodash.default;
    }, function (_leaflet) {
      L = _leaflet.default;
    }, function (_appCoreTime_series) {
      TimeSeries = _appCoreTime_series.default;
    }, function (_appCoreUtilsKbn) {
      kbn = _appCoreUtilsKbn.default;
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

      panelDefaults = {
        mapCenterLatitude: 0,
        mapCenterLongitude: 0,
        initialZoom: 1,
        valueName: 'avg',
        circleSize: 100
      };

      _export('WorldmapCtrl', WorldmapCtrl = function (_MetricsPanelCtrl) {
        _inherits(WorldmapCtrl, _MetricsPanelCtrl);

        function WorldmapCtrl($scope, $injector) {
          _classCallCheck(this, WorldmapCtrl);

          var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(WorldmapCtrl).call(this, $scope, $injector));

          _.defaults(_this.panel, panelDefaults);

          _this.events.on('init-edit-mode', _this.onInitEditMode.bind(_this));
          _this.events.on('data-received', _this.onDataReceived.bind(_this));
          return _this;
        }

        _createClass(WorldmapCtrl, [{
          key: 'onInitEditMode',
          value: function onInitEditMode() {
            this.addEditorTab('Options', 'public/plugins/grafana-worldmap-panel/editor.html', 2);
          }
        }, {
          key: 'onDataReceived',
          value: function onDataReceived(dataList) {
            var _this2 = this;

            this.series = dataList.map(this.seriesHandler.bind(this));
            var data = [];
            this.setValues(data);
            this.data = data;

            if (!this.map) {
              window.$.getJSON('public/plugins/grafana-worldmap-panel/countries.json').then(function (res) {
                _this2.countries = res;
                _this2.createMap();
              });
            }

            this.render();
          }
        }, {
          key: 'setValues',
          value: function setValues(data) {
            var _this3 = this;

            if (this.series && this.series.length > 0) {
              this.series.forEach(function (serie) {
                var lastPoint = _.last(serie.datapoints);
                var lastValue = _.isArray(lastPoint) ? lastPoint[0] : null;

                if (_.isString(lastValue)) {
                  data.push({ countryCode: serie.alias, value: 0, valueFormatted: lastValue, valueRounded: 0 });
                } else {
                  var dataValue = {
                    countryCode: serie.alias,
                    value: serie.stats[_this3.panel.valueName],
                    flotpairs: serie.flotpairs,
                    valueFormatted: lastValue,
                    valueRounded: 0
                  };

                  dataValue.valueRounded = kbn.roundValue(dataValue.value, 0);
                  data.push(dataValue);
                }
              });
            }
          }
        }, {
          key: 'seriesHandler',
          value: function seriesHandler(seriesData) {
            var series = new TimeSeries({
              datapoints: seriesData.datapoints,
              alias: seriesData.target
            });

            series.flotpairs = series.getFlotPairs(this.panel.nullPointMode);
            return series;
          }
        }, {
          key: 'createMap',
          value: function createMap() {
            this.map = window.L.map('mapid_' + this.panel.id, { worldCopyJump: true, center: [this.panel.mapCenterLatitude, this.panel.mapCenterLongitude] }).fitWorld().zoomIn(this.panel.initialZoom);

            window.L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              maxZoom: 18,
              subdomains: 'abc',
              reuseTiles: true,
              detectRetina: true,
              attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>'
            }).addTo(this.map);

            this.drawCircles();
          }
        }, {
          key: 'drawCircles',
          value: function drawCircles() {
            var _this4 = this;

            var circles = [];
            this.data.forEach(function (dataPoint) {
              var country = _.find(_this4.countries, function (cou) {
                return cou.country === dataPoint.countryCode;
              });
              var circle = window.L.circle([country.latitude, country.longitude], dataPoint.value * _this4.panel.circleSize, {
                color: 'red',
                fillColor: '#f03',
                fillOpacity: 0.5
              });

              circle.bindPopup(country.name + ': ' + dataPoint.valueRounded);
              circles.push(circle);
            }, this);
            this.circles = window.L.layerGroup(circles).addTo(this.map);
          }
        }, {
          key: 'setNewMapCenter',
          value: function setNewMapCenter() {
            this.mapCenterMoved = true;
            this.panToMapCenter();
          }
        }, {
          key: 'panToMapCenter',
          value: function panToMapCenter() {
            this.map.panTo([this.panel.mapCenterLatitude, this.panel.mapCenterLongitude]);
          }
        }, {
          key: 'setZoom',
          value: function setZoom() {
            this.map.setZoom(this.panel.initialZoom);
          }
        }, {
          key: 'render',
          value: function render() {
            if (!this.data || !this.map || !this.circles) {
              return;
            }

            if (this.mapCenterMoved) {
              this.panToMapCenter();
              this.mapCenterMoved = false;
            }

            if (this.circles.getLayers().length > 0) {
              this.circles.clearLayers();
            }
            this.drawCircles();
          }
        }]);

        return WorldmapCtrl;
      }(MetricsPanelCtrl));

      _export('WorldmapCtrl', WorldmapCtrl);

      WorldmapCtrl.templateUrl = 'module.html';
    }
  };
});
//# sourceMappingURL=worldmap_ctrl.js.map
