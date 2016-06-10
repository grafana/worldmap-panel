'use strict';

System.register(['lodash', './leaflet'], function (_export, _context) {
  var _, L, _createClass, tileServers, WorldMap;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  return {
    setters: [function (_lodash) {
      _ = _lodash.default;
    }, function (_leaflet) {
      L = _leaflet.default;
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

      tileServers = {
        'CartoDB Positron': { url: 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png', attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>', subdomains: 'abcd' },
        'CartoDB Dark': { url: 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png', attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>', subdomains: 'abcd' }
      };

      WorldMap = function () {
        function WorldMap(ctrl, mapContainer) {
          _classCallCheck(this, WorldMap);

          this.ctrl = ctrl;
          this.mapContainer = mapContainer;
          this.createMap();
          this.circles = [];
        }

        _createClass(WorldMap, [{
          key: 'createMap',
          value: function createMap() {
            var mapCenter = window.L.latLng(parseInt(this.ctrl.panel.mapCenterLatitude, 10), parseInt(this.ctrl.panel.mapCenterLongitude, 10));
            this.map = window.L.map(this.mapContainer, { worldCopyJump: true, center: mapCenter }).fitWorld().zoomIn(parseInt(this.ctrl.panel.initialZoom, 10));
            this.map.panTo(mapCenter);

            var selectedTileServer = tileServers[this.ctrl.tileServer];
            window.L.tileLayer(selectedTileServer.url, {
              maxZoom: 18,
              subdomains: selectedTileServer.subdomains,
              reuseTiles: true,
              detectRetina: true,
              attribution: selectedTileServer.attribution
            }).addTo(this.map);
          }
        }, {
          key: 'createLegend',
          value: function createLegend() {
            var _this = this;

            this.legend = window.L.control({ position: 'bottomleft' });
            this.legend.onAdd = function () {
              _this.legend._div = window.L.DomUtil.create('div', 'info legend');
              _this.legend.update();
              return _this.legend._div;
            };

            this.legend.update = function () {
              var thresholds = _this.ctrl.data.thresholds;
              var legendHtml = '';
              legendHtml += '<i style="background:' + _this.ctrl.panel.colors[0] + '"></i> ' + '&lt; ' + thresholds[0] + '<br>';
              for (var index = 0; index < thresholds.length; index++) {
                legendHtml += '<i style="background:' + _this.getColor(thresholds[index] + 1) + '"></i> ' + thresholds[index] + (thresholds[index + 1] ? '&ndash;' + thresholds[index + 1] + '<br>' : '+');
              }
              _this.legend._div.innerHTML = legendHtml;
            };
            this.legend.addTo(this.map);
          }
        }, {
          key: 'needToRedrawCircles',
          value: function needToRedrawCircles() {
            if (this.circles.length === 0 && this.ctrl.data.length > 0) return true;
            if (this.circles.length !== this.ctrl.data.length) return true;
            var locations = _.map(_.map(this.circles, 'options'), 'location').sort();
            var dataPoints = _.map(this.ctrl.data, 'key').sort();
            return !_.isEqual(locations, dataPoints);
          }
        }, {
          key: 'clearCircles',
          value: function clearCircles() {
            if (this.circlesLayer) {
              this.circlesLayer.clearLayers();
              this.removeCircles(this.circlesLayer);
              this.circles = [];
            }
          }
        }, {
          key: 'drawCircles',
          value: function drawCircles() {
            if (this.needToRedrawCircles()) {
              this.clearCircles();
              this.createCircles();
            } else {
              this.updateCircles();
            }
          }
        }, {
          key: 'createCircles',
          value: function createCircles() {
            var _this2 = this;

            var circles = [];
            this.ctrl.data.forEach(function (dataPoint) {
              if (!dataPoint.locationName) return;
              circles.push(_this2.createCircle(dataPoint));
            });
            this.circlesLayer = this.addCircles(circles);
            this.circles = circles;
          }
        }, {
          key: 'updateCircles',
          value: function updateCircles() {
            var _this3 = this;

            this.ctrl.data.forEach(function (dataPoint) {
              if (!dataPoint.locationName) return;

              var circle = _.find(_this3.circles, function (cir) {
                return cir.options.location === dataPoint.key;
              });

              if (circle) {
                circle.setRadius(_this3.calcCircleSize(dataPoint.value || 0));
                circle.setStyle({
                  color: _this3.getColor(dataPoint.value),
                  fillColor: _this3.getColor(dataPoint.value),
                  fillOpacity: 0.5,
                  location: dataPoint.key
                });
                circle.unbindPopup();
                _this3.createPopup(circle, dataPoint.locationName, dataPoint.valueRounded);
              }
            });
          }
        }, {
          key: 'createCircle',
          value: function createCircle(dataPoint) {
            var circle = window.L.circleMarker([dataPoint.locationLatitude, dataPoint.locationLongitude], {
              radius: this.calcCircleSize(dataPoint.value || 0),
              color: this.getColor(dataPoint.value),
              fillColor: this.getColor(dataPoint.value),
              fillOpacity: 0.5,
              location: dataPoint.key
            });

            this.createPopup(circle, dataPoint.locationName, dataPoint.valueRounded);
            return circle;
          }
        }, {
          key: 'calcCircleSize',
          value: function calcCircleSize(dataPointValue) {
            var circleMinSize = parseInt(this.ctrl.panel.circleMinSize, 10);
            var circleMaxSize = parseInt(this.ctrl.panel.circleMaxSize, 10);

            if (this.ctrl.data.valueRange === 0) {
              return circleMaxSize;
            }

            var dataFactor = (dataPointValue - this.ctrl.data.lowestValue) / this.ctrl.data.valueRange;
            var circleSizeRange = this.ctrl.panel.circleMaxSize - circleMinSize;

            return circleSizeRange * dataFactor + circleMinSize;
          }
        }, {
          key: 'createPopup',
          value: function createPopup(circle, locationName, value) {
            var unit = value && value === 1 ? this.ctrl.panel.unitSingular : this.ctrl.panel.unitPlural;
            var label = (locationName + ': ' + value + ' ' + (unit || '')).trim();
            circle.bindPopup(label, { 'offset': window.L.point(0, -2), 'className': 'worldmap-popup', 'closeButton': false });

            circle.on('mouseover', function onMouseOver(evt) {
              var layer = evt.target;
              layer.bringToFront();
              this.openPopup();
            });
            circle.on('mouseout', function onMouseOut() {
              circle.closePopup();
            });
          }
        }, {
          key: 'getColor',
          value: function getColor(value) {
            for (var index = this.ctrl.data.thresholds.length; index > 0; index--) {
              if (value >= this.ctrl.data.thresholds[index - 1]) {
                return this.ctrl.panel.colors[index];
              }
            }
            return _.first(this.ctrl.panel.colors);
          }
        }, {
          key: 'resize',
          value: function resize() {
            this.map.invalidateSize();
          }
        }, {
          key: 'panToMapCenter',
          value: function panToMapCenter() {
            this.map.panTo([parseInt(this.ctrl.panel.mapCenterLatitude, 10), parseInt(this.ctrl.panel.mapCenterLongitude, 10)]);
            this.ctrl.mapCenterMoved = false;
          }
        }, {
          key: 'removeLegend',
          value: function removeLegend() {
            this.legend.removeFrom(this.map);
            this.legend = null;
          }
        }, {
          key: 'addCircles',
          value: function addCircles(circles) {
            return window.L.layerGroup(circles).addTo(this.map);
          }
        }, {
          key: 'removeCircles',
          value: function removeCircles() {
            this.map.removeLayer(this.circlesLayer);
          }
        }, {
          key: 'setZoom',
          value: function setZoom(zoomFactor) {
            this.map.setZoom(zoomFactor);
          }
        }, {
          key: 'remove',
          value: function remove() {
            this.circles = [];
            if (this.circlesLayer) this.removeCircles();
            if (this.legend) this.removeLegend();
            this.map.remove();
          }
        }]);

        return WorldMap;
      }();

      _export('default', WorldMap);
    }
  };
});
//# sourceMappingURL=worldmap.js.map
