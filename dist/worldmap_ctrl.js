'use strict';

System.register(['app/plugins/sdk', 'lodash', 'app/core/time_series2', 'app/core/utils/kbn', './map_renderer', './css/worldmap-panel.css!'], function (_export, _context) {
  var MetricsPanelCtrl, _, TimeSeries, kbn, mapRenderer, _createClass, panelDefaults, tileServers, WorldmapCtrl;

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
        mapCenterLatitude: 0,
        mapCenterLongitude: 0,
        initialZoom: 1,
        valueName: 'avg',
        circleSize: 100,
        tileServer: 'Mapquest',
        locationData: 'countries',
        thresholds: '0,10',
        colors: ['rgba(245, 54, 54, 0.9)', 'rgba(237, 129, 40, 0.89)', 'rgba(50, 172, 45, 0.97)']
      };
      tileServers = {
        'Estri WorldGrey': { url: 'http://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ', subdomains: '' },
        'OpenStreetMap': { url: 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>', subdomains: 'abc' },
        'Mapquest': { url: 'http://otile{s}.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.png', attribution: 'Tiles by <a href="http://www.mapquest.com/">MapQuest</a> &mdash; ' + 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
          subdomains: '1234' },
        'CartoDB Positron': { url: 'http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>', subdomains: 'abcd' },
        'CartoDB Dark': { url: 'http://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>', subdomains: '1234' }
      };

      _export('WorldmapCtrl', WorldmapCtrl = function (_MetricsPanelCtrl) {
        _inherits(WorldmapCtrl, _MetricsPanelCtrl);

        function WorldmapCtrl($scope, $injector, contextSrv) {
          _classCallCheck(this, WorldmapCtrl);

          var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(WorldmapCtrl).call(this, $scope, $injector));

          if (_this.panel && !_this.panel.tileServer) {
            _this.panel.tileServer = contextSrv.user.lightTheme ? 'CartoDB Positron' : 'CartoDB Dark';
          }
          _.defaults(_this.panel, panelDefaults);
          _this.tileServers = tileServers;

          _this.events.on('init-edit-mode', _this.onInitEditMode.bind(_this));
          _this.events.on('data-received', _this.onDataReceived.bind(_this));
          _this.events.on('panel-teardown', _this.onPanelTeardown.bind(_this));

          if (!_this.map) {
            window.$.getJSON('public/plugins/grafana-worldmap-panel/' + _this.panel.locationData + '.json').then(function (res) {
              _this.locations = res;
              _this.render();
            });
          }
          return _this;
        }

        _createClass(WorldmapCtrl, [{
          key: 'onPanelTeardown',
          value: function onPanelTeardown() {
            this.circles = [];
            this.circlesLayer.removeFrom(this.map);
            this.legend.removeFrom(this.map);
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
            var _this2 = this;

            if (this.series && this.series.length > 0) {
              this.series.forEach(function (serie) {
                var lastPoint = _.last(serie.datapoints);
                var lastValue = _.isArray(lastPoint) ? lastPoint[0] : null;

                if (_.isString(lastValue)) {
                  data.push({ key: serie.alias, value: 0, valueFormatted: lastValue, valueRounded: 0 });
                } else {
                  var dataValue = {
                    key: serie.alias,
                    value: serie.stats[_this2.panel.valueName],
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
          key: 'setNewMapCenter',
          value: function setNewMapCenter() {
            this.mapCenterMoved = true;
            this.render();
          }
        }, {
          key: 'setZoom',
          value: function setZoom() {
            this.map.setZoom(this.panel.initialZoom);
          }
        }, {
          key: 'changeTileServer',
          value: function changeTileServer() {
            this.legend.removeFrom(this.map);
            this.legend = null;
            this.map.remove();
            this.map = null;
            this.render();
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
            var _this3 = this;

            window.$.getJSON('public/plugins/grafana-worldmap-panel/' + this.panel.locationData + '.json').then(function (res) {
              _this3.locations = res;
              _this3.render();
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
