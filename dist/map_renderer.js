'use strict';

System.register(['lodash', './leaflet', './css/leaflet.css!'], function (_export, _context) {
  var _, L;

  function link(scope, elem, attrs, ctrl) {
    var mapContainer = elem.find('.mapcontainer');

    ctrl.events.on('render', function () {
      render();
      ctrl.renderingCompleted();
    });

    function render() {
      if (!ctrl.data) return;

      if (!ctrl.map) createMap();
      resize();

      if (ctrl.mapCenterMoved) panToMapCenter();

      if (!ctrl.legend) createLegend();

      drawCircles();
    }

    function createMap() {
      ctrl.map = window.L.map(mapContainer[0], { worldCopyJump: true, center: [ctrl.panel.mapCenterLatitude, ctrl.panel.mapCenterLongitude] }).fitWorld().zoomIn(ctrl.panel.initialZoom);

      var selectedTileServer = ctrl.tileServers[ctrl.panel.tileServer];
      window.L.tileLayer(selectedTileServer.url, {
        maxZoom: 18,
        subdomains: selectedTileServer.subdomains,
        reuseTiles: true,
        detectRetina: true,
        attribution: selectedTileServer.attribution
      }).addTo(ctrl.map);

      ctrl.circles = [];
    }

    function createLegend() {
      ctrl.legend = window.L.control({ position: 'bottomleft' });
      ctrl.legend.onAdd = function () {
        ctrl.legend._div = window.L.DomUtil.create('div', 'info legend');
        ctrl.legend.update();
        return ctrl.legend._div;
      };

      ctrl.legend.update = function () {
        var thresholds = ctrl.data.thresholds;
        var legendHtml = '';
        legendHtml += '<i style="background:' + ctrl.panel.colors[0] + '"></i> ' + '&lt; ' + thresholds[0] + '<br>';
        for (var index = 0; index < thresholds.length; index++) {
          legendHtml += '<i style="background:' + getColor(thresholds[index] + 1) + '"></i> ' + thresholds[index] + (thresholds[index + 1] ? '&ndash;' + thresholds[index + 1] + '<br>' : '+');
        }
        ctrl.legend._div.innerHTML = legendHtml;
      };

      ctrl.legend.addTo(ctrl.map);
    }

    function getColor(value) {
      for (var index = ctrl.data.thresholds.length; index > 0; index--) {
        if (value >= ctrl.data.thresholds[index - 1]) {
          return ctrl.panel.colors[index];
        }
      }
      return _.first(ctrl.panel.colors);
    }

    function clearCircles() {
      ctrl.map.removeLayer(ctrl.circlesLayer);
      ctrl.circles = [];
    }

    function drawCircles() {
      if (ctrl.circles.length > 0 && ctrl.circles.length !== ctrl.data.length) {
        clearCircles();
      }

      var circles = [];
      ctrl.data.forEach(function (dataPoint) {
        var location = _.find(ctrl.locations, function (loc) {
          return loc.key === dataPoint.key;
        });

        if (!location) return;

        var circle = _.find(ctrl.circles, function (cir) {
          return cir.options.location === location.key;
        });

        if (circle) {
          circle.setRadius(Math.min(ctrl.panel.circleMaxSize, Math.max(ctrl.panel.circleMinSize, (dataPoint.value || 0) * ctrl.panel.circleSizeFactor)));
          circle.setStyle({
            color: getColor(dataPoint.value),
            fillColor: getColor(dataPoint.value),
            fillOpacity: 0.5,
            location: location.key
          });
          circle.unbindPopup();
          createPopup(circle, location.name, dataPoint.valueRounded);
        } else {
          circles.push(createCircle(location, dataPoint));
        }
      });
      ctrl.circlesLayer = window.L.layerGroup(circles).addTo(ctrl.map);
      ctrl.circles = ctrl.circles.concat(circles);
    }

    function createCircle(location, dataPoint) {
      var circle = window.L.circleMarker([location.latitude, location.longitude], {
        radius: Math.min(ctrl.panel.circleMaxSize, Math.max(ctrl.panel.circleMinSize, (dataPoint.value || 0) * ctrl.panel.circleSizeFactor)),
        color: getColor(dataPoint.value),
        fillColor: getColor(dataPoint.value),
        fillOpacity: 0.5,
        location: location.key
      });

      createPopup(circle, location.name, dataPoint.valueRounded);
      return circle;
    }

    function createPopup(circle, locationName, value) {
      var unit = value && value === 1 ? ctrl.panel.unitSingular : ctrl.panel.unitPlural;
      circle.bindPopup(locationName + ': ' + value + ' ' + unit, { 'offset': window.L.point(0, -2), 'className': 'worldmap-popup' });

      circle.on('mouseover', function (evt) {
        var layer = evt.target;
        layer.bringToFront();
        this.openPopup();
      });
      circle.on('mouseout', function () {
        circle.closePopup();
      });
    }

    function resize() {
      if (ctrl.map) ctrl.map.invalidateSize();
    }

    function panToMapCenter() {
      ctrl.map.panTo([ctrl.panel.mapCenterLatitude, ctrl.panel.mapCenterLongitude]);
      ctrl.mapCenterMoved = false;
    }
  }

  _export('default', link);

  return {
    setters: [function (_lodash) {
      _ = _lodash.default;
    }, function (_leaflet) {
      L = _leaflet.default;
    }, function (_cssLeafletCss) {}],
    execute: function () {}
  };
});
//# sourceMappingURL=map_renderer.js.map
