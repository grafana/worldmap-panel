'use strict';

System.register(['app/plugins/sdk', 'lodash', 'app/core/time_series2', 'app/core/utils/kbn', './map_renderer', './data_formatter', './geohash', './css/worldmap-panel.css!'], function (_export, _context) {
  "use strict";

  var MetricsPanelCtrl, _, TimeSeries, kbn, mapRenderer, DataFormatter, decodeGeoHash, _createClass, panelDefaults, mapCenters, WorldmapCtrl;

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
    }, function (_data_formatter) {
      DataFormatter = _data_formatter.default;
    }, function (_geohash) {
      decodeGeoHash = _geohash.default;
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
        maxDataPoints: 1,
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
        unitPlural: '',
        showLegend: true,
        esMetric: 'Count',
        decimals: 0
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

          _this.dataFormatter = new DataFormatter(_this, kbn);

          _this.events.on('init-edit-mode', _this.onInitEditMode.bind(_this));
          _this.events.on('data-received', _this.onDataReceived.bind(_this));
          _this.events.on('panel-teardown', _this.onPanelTeardown.bind(_this));
          _this.events.on('data-snapshot-load', _this.onDataSnapshotLoad.bind(_this));

          _this.loadLocationDataFromFile();
          return _this;
        }

        _createClass(WorldmapCtrl, [{
          key: 'setMapProvider',
          value: function setMapProvider(contextSrv) {
            this.tileServer = contextSrv.user.lightTheme ? 'CartoDB Positron' : 'CartoDB Dark';
            this.setMapSaturationClass();
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
          value: function loadLocationDataFromFile(reload) {
            var _this2 = this;

            if (this.map && !reload) return;

            if (this.panel.snapshotLocationData) {
              this.locations = this.panel.snapshotLocationData;
              return;
            }

            if (this.panel.locationData === 'jsonp endpoint') {
              if (!this.panel.jsonpUrl || !this.panel.jsonpCallback) return;

              window.$.ajax({
                type: 'GET',
                url: this.panel.jsonpUrl + '?callback=?',
                contentType: 'application/json',
                jsonpCallback: this.panel.jsonpCallback,
                dataType: 'jsonp',
                success: function success(res) {
                  _this2.locations = res;
                  _this2.render();
                }
              });
            } else if (this.panel.locationData === 'json endpoint') {
              if (!this.panel.jsonUrl) return;

              window.$.getJSON(this.panel.jsonUrl).then(function (res) {
                return _this2.reloadLocations.bind(_this2, res);
              });
            } else if (this.panel.locationData === 'influx') {
              // .. Do nothing
            } else if (this.panel.locationData !== 'geohash') {
                window.$.getJSON('public/plugins/grafana-worldmap-panel/data/' + this.panel.locationData + '.json').then(this.reloadLocations.bind(this));
              }
          }
        }, {
          key: 'reloadLocations',
          value: function reloadLocations(res) {
            this.locations = res;
            this.refresh();
          }
        }, {
          key: 'onPanelTeardown',
          value: function onPanelTeardown() {
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
            if (!dataList) return;

            if (this.dashboard.snapshot && this.locations) {
              this.panel.snapshotLocationData = this.locations;
            }

            this.series = dataList.map(this.seriesHandler.bind(this));
            var data = [];

            if (this.panel.locationData === 'geohash') {
              this.setGeohashValues(data);
            } else if (this.panel.locationData === 'table') {
              this.series = dataList.map(this.tableHandler.bind(this));
              this.setTableValues(data);
            } else {
              this.dataFormatter.setValues(data);
            }
            this.data = data;

            this.updateThresholdData();

            this.render();
          }
        }, {
          key: 'onDataSnapshotLoad',
          value: function onDataSnapshotLoad(snapshotData) {
            this.onDataReceived(snapshotData);
          }
        }, {
          key: 'setGeohashValues',
          value: function setGeohashValues(data) {
            var _this3 = this;

            if (!this.panel.esGeoPoint || !this.panel.esMetric) return;

            if (this.series && this.series.length > 0) {
              (function () {
                var highestValue = 0;
                var lowestValue = Number.MAX_VALUE;

                _this3.series[0].datapoints.forEach(function (datapoint) {
                  var encodedGeohash = datapoint[_this3.panel.esGeoPoint];
                  var decodedGeohash = decodeGeoHash(encodedGeohash);

                  var dataValue = {
                    key: encodedGeohash,
                    locationName: _this3.panel.esLocationName ? datapoint[_this3.panel.esLocationName] : encodedGeohash,
                    locationLatitude: decodedGeohash.latitude,
                    locationLongitude: decodedGeohash.longitude,
                    value: datapoint[_this3.panel.esMetric],
                    valueFormatted: datapoint[_this3.panel.esMetric],
                    valueRounded: 0
                  };

                  if (dataValue.value > highestValue) highestValue = dataValue.value;
                  if (dataValue.value < lowestValue) lowestValue = dataValue.value;

                  dataValue.valueRounded = kbn.roundValue(dataValue.value, _this3.panel.decimals || 0);
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
          value: function setTableValues(data) {
            var _this4 = this;

            if (this.series && this.series.length > 0) {
              (function () {
                var highestValue = 0;
                var lowestValue = Number.MAX_VALUE;

                _this4.series[0].datapoints.forEach(function (datapoint) {
                  if (!datapoint.geohash) {
                    return;
                  }

                  var encodedGeohash = datapoint.geohash;
                  var decodedGeohash = decodeGeoHash(encodedGeohash);

                  var dataValue = {
                    key: encodedGeohash,
                    locationName: datapoint[_this4.panel.influxLabel] || 'n/a',
                    locationLatitude: decodedGeohash.latitude,
                    locationLongitude: decodedGeohash.longitude,
                    value: datapoint.metric,
                    valueFormatted: datapoint.metric,
                    valueRounded: 0
                  };

                  if (dataValue.value > highestValue) highestValue = dataValue.value;
                  if (dataValue.value < lowestValue) lowestValue = dataValue.value;

                  dataValue.valueRounded = kbn.roundValue(dataValue.value, _this4.panel.decimals || 0);
                  data.push(dataValue);
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
          key: 'tableHandler',
          value: function tableHandler(tableData) {
            var datapoints = [];
            var alias = null;

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

            var series = new TimeSeries({ datapoints: datapoints, alias: alias });
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
          key: 'toggleLegend',
          value: function toggleLegend() {
            if (!this.panel.showLegend) {
              this.map.removeLegend();
            }
            this.render();
          }
        }, {
          key: 'changeThresholds',
          value: function changeThresholds() {
            this.updateThresholdData();
            this.map.legend.update();
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
            this.loadLocationDataFromFile(true);

            if (this.panel.locationData === 'geohash') {
              this.render();
            }
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
