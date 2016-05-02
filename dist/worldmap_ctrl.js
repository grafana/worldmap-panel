'use strict';

System.register(['app/plugins/sdk', 'lodash', 'app/core/time_series2', 'app/core/utils/kbn', './map_renderer', './css/worldmap-panel.css!'], function (_export, _context) {
  var MetricsPanelCtrl, _, TimeSeries, kbn, mapRenderer, _createClass, panelDefaults, tileServers, mapCenters, WorldmapCtrl;

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
    }, function (_appCoreTime_series) {
      TimeSeries = _appCoreTime_series.default;
    }, function (_appCoreUtilsKbn) {
      kbn = _appCoreUtilsKbn.default;
    }, function (_map_renderer) {
      mapRenderer = _map_renderer.default;
    }, function (_cssWorldmapPanelCss) {}],
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
        mapCenter: '(0°, 0°)',
        mapCenterLatitude: 0,
        mapCenterLongitude: 0,
        initialZoom: 1,
        valueName: 'total',
        circleMinSize: 2,
        circleMaxSize: 30,
        locationData: 'countries',
        thresholds: '0,10',
        colors: ['rgba(245, 54, 54, 0.9)', 'rgba(237, 129, 40, 0.89)', 'rgba(50, 172, 45, 0.97)'],
        unitSingle: '',
        unitPlural: ''
      };
      tileServers = {
        'CartoDB Positron': { url: 'http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>', subdomains: 'abcd' },
        'CartoDB Dark': { url: 'http://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>', subdomains: '1234' }
      };
      mapCenters = {
        '(0°, 0°)': { mapCenterLatitude: 0, mapCenterLongitude: 0 },
        'North America': { mapCenterLatitude: 40, mapCenterLongitude: -100 },
        'Europe': { mapCenterLatitude: 46, mapCenterLongitude: 14 },
        'West Asia': { mapCenterLatitude: 26, mapCenterLongitude: 53 },
        'SE Asia': { mapCenterLatitude: 10, mapCenterLongitude: 106 }
      };

      _export('WorldmapCtrl', WorldmapCtrl = function (_MetricsPanelCtrl) {
        _inherits(WorldmapCtrl, _MetricsPanelCtrl);

        function WorldmapCtrl($scope, $injector, contextSrv) {
          _classCallCheck(this, WorldmapCtrl);

          var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(WorldmapCtrl).call(this, $scope, $injector));

          _this.setMapProvider(contextSrv);
          _.defaults(_this.panel, panelDefaults);

          _this.events.on('init-edit-mode', _this.onInitEditMode.bind(_this));
          _this.events.on('data-received', _this.onDataReceived.bind(_this));
          _this.events.on('panel-teardown', _this.onPanelTeardown.bind(_this));

          _this.loadLocationDataFromFile();
          return _this;
        }

        _createClass(WorldmapCtrl, [{
          key: 'setMapProvider',
          value: function setMapProvider(contextSrv) {
            this.tileServer = contextSrv.user.lightTheme ? 'CartoDB Positron' : 'CartoDB Dark';

            this.setMapSaturationClass();
            this.tileServers = tileServers;
          }
        }, {
          key: 'setMapSaturationClass',
          value: function setMapSaturationClass() {
            if (this.tileServer === 'CartoDB Dark') {
              this.saturationClass = 'map-darken';
            } else {
              this.saturationClass = '';
            }
          }
        }, {
          key: 'loadLocationDataFromFile',
          value: function loadLocationDataFromFile() {
            var _this2 = this;

            if (!this.map) {
              window.$.getJSON('public/plugins/grafana-worldmap-panel/' + this.panel.locationData + '.json').then(function (res) {
                _this2.locations = res;
                _this2.render();
              });
            }
          }
        }, {
          key: 'onPanelTeardown',
          value: function onPanelTeardown() {
            this.circles = [];
            if (this.circlesLayer) this.map.removeLayer(this.circlesLayer);
            if (this.legend) this.legend.removeFrom(this.map);
            this.legend = null;
            if (this.map) this.map.remove();
          }
        }, {
          key: 'onInitEditMode',
          value: function onInitEditMode() {
            this.addEditorTab('Worldmap', 'public/plugins/grafana-worldmap-panel/editor.html', 2);
          }
        }, {
          key: 'onDataReceived',
          value: function onDataReceived(dataList) {
            this.series = dataList.map(this.seriesHandler.bind(this));
            var data = [];
            this.setValues(data);
            this.data = data;

            this.updateThresholdData();

            this.render();
          }
        }, {
          key: 'setValues',
          value: function setValues(data) {
            var _this3 = this;

            if (this.series && this.series.length > 0) {
              (function () {
                var highestValue = 0;
                var lowestValue = Number.MAX_VALUE;

                _this3.series.forEach(function (serie) {
                  var lastPoint = _.last(serie.datapoints);
                  var lastValue = _.isArray(lastPoint) ? lastPoint[0] : null;

                  if (_.isString(lastValue)) {
                    data.push({ key: serie.alias, value: 0, valueFormatted: lastValue, valueRounded: 0 });
                  } else {
                    var dataValue = {
                      key: serie.alias,
                      value: serie.stats[_this3.panel.valueName],
                      flotpairs: serie.flotpairs,
                      valueFormatted: lastValue,
                      valueRounded: 0
                    };

                    if (dataValue.value > highestValue) highestValue = dataValue.value;
                    if (dataValue.value < lowestValue) lowestValue = dataValue.value;

                    dataValue.valueRounded = kbn.roundValue(dataValue.value, 0);
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
          key: 'setNewMapCenter',
          value: function setNewMapCenter() {
            if (this.panel.mapCenter !== 'custom') {
              this.panel.mapCenterLatitude = mapCenters[this.panel.mapCenter].mapCenterLatitude;
              this.panel.mapCenterLongitude = mapCenters[this.panel.mapCenter].mapCenterLongitude;
            }
            this.mapCenterMoved = true;
            this.render();
          }
        }, {
          key: 'setZoom',
          value: function setZoom() {
            this.map.setZoom(this.panel.initialZoom);
          }
        }, {
          key: 'changeThresholds',
          value: function changeThresholds() {
            this.updateThresholdData();
            this.legend.update();
            this.render();
          }
        }, {
          key: 'updateThresholdData',
          value: function updateThresholdData() {
            this.data.thresholds = this.panel.thresholds.split(',').map(function (strValue) {
              return Number(strValue.trim());
            });
          }
        }, {
          key: 'changeLocationData',
          value: function changeLocationData() {
            var _this4 = this;

            window.$.getJSON('public/plugins/grafana-worldmap-panel/' + this.panel.locationData + '.json').then(function (res) {
              _this4.locations = res;
              _this4.render();
            });
          }
        }, {
          key: 'link',
          value: function link(scope, elem, attrs, ctrl) {
            mapRenderer(scope, elem, attrs, ctrl);
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
