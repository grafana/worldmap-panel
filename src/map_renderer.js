import _ from 'lodash';
import L from './leaflet';
import './css/leaflet.css!';

export default function link(scope, elem, attrs, ctrl) {
  const mapContainer = elem.find('.mapcontainer');

  ctrl.events.on('render', () => {
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
    ctrl.map = window.L.map(mapContainer[0], {worldCopyJump: true, center: [ctrl.panel.mapCenterLatitude, ctrl.panel.mapCenterLongitude]})
      .fitWorld()
      .zoomIn(ctrl.panel.initialZoom);

    const selectedTileServer = ctrl.tileServers[ctrl.panel.tileServer];
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
    ctrl.legend = window.L.control({position: 'bottomleft'});
    ctrl.legend.onAdd = () => {
      ctrl.legend._div = window.L.DomUtil.create('div', 'info legend');
      ctrl.legend.update();
      return ctrl.legend._div;
    };

    ctrl.legend.update = () => {
      const thresholds = ctrl.data.thresholds;
      let legendHtml = '';
      legendHtml += '<i style="background:' + ctrl.panel.colors[0] + '"></i> ' +
          '&lt; ' + thresholds[0] + '<br>';
      for (let index = 0; index < thresholds.length; index++) {
        legendHtml +=
          '<i style="background:' + getColor(thresholds[index] + 1) + '"></i> ' +
          thresholds[index] + (thresholds[index + 1] ? '&ndash;' + thresholds[index + 1] + '<br>' : '+');
      }
      ctrl.legend._div.innerHTML = legendHtml;
    };

    ctrl.legend.addTo(ctrl.map);
  }

  function getColor(value) {
    for (let index = ctrl.data.thresholds.length; index > 0; index--) {
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

    const circles = [];
    ctrl.data.forEach(dataPoint => {
      const location = _.find(ctrl.locations, (loc) => { return loc.key === dataPoint.key; });

      if (!location) return;

      const circle = _.find(ctrl.circles, cir => { return cir.options.location === location.key; });

      if (circle) {
        circle.setRadius(Math.min(30, Math.max(2, (dataPoint.value || 0) * ctrl.panel.circleSize)));
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
    const circle = window.L.circleMarker([location.latitude, location.longitude], {
      radius: Math.min(30, Math.max(2, (dataPoint.value || 0) * ctrl.panel.circleSize)),
      color: getColor(dataPoint.value),
      fillColor: getColor(dataPoint.value),
      fillOpacity: 0.5,
      location: location.key
    });

    createPopup(circle, location.name, dataPoint.valueRounded);
    return circle;
  }

  function createPopup(circle, locationName, value) {
    circle.bindPopup(locationName + ': ' + value, {'offset': window.L.point(0, -2), 'className': 'worldmap-popup'});

    circle.on('mouseover', function (evt) {
      const layer = evt.target;
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
