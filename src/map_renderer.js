import _ from 'lodash';
import L from './leaflet';
import './css/leaflet.css!';
import decodeGeoHash from './geohash';

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

    if (!ctrl.legend && ctrl.panel.showLegend) createLegend();

    drawCircles();
  }

  function createMap() {
    const mapCenter = window.L.latLng(ctrl.panel.mapCenterLatitude, ctrl.panel.mapCenterLongitude);
    ctrl.map = window.L.map(mapContainer[0], {worldCopyJump: true, center: mapCenter})
      .fitWorld()
      .zoomIn(ctrl.panel.initialZoom);
    ctrl.map.panTo(mapCenter);

    const selectedTileServer = ctrl.tileServers[ctrl.tileServer];
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

  function needToRedrawCircles() {
    if (ctrl.circles.length === 0) return false;
    if (ctrl.circles.length > 0 && ctrl.circles.length !== ctrl.data.length) return true;
    const locations = _.map(_.map(ctrl.circles, 'options'), 'location').sort();
    const dataPoints = _.map(ctrl.data, 'key').sort();
    return !_.isEqual(locations, dataPoints);
  }

  function clearCircles() {
    ctrl.circlesLayer.clearLayers();
    ctrl.map.removeLayer(ctrl.circlesLayer);
    ctrl.circles = [];
  }

  function drawCircles() {
    if (needToRedrawCircles()) {
      clearCircles();
    }

    const circles = [];
    ctrl.data.forEach(dataPoint => {
      const location = _.find(ctrl.locations, (loc) => { return loc.key === dataPoint.key; });

      if (!location && ctrl.panel.locationData !== 'geohash') return;

      const circle = _.find(ctrl.circles, cir => { return cir.options.location === dataPoint.key; });

      if (circle) {
        circle.setRadius(calcCircleSize(dataPoint.value || 0));
        circle.setStyle({
          color: getColor(dataPoint.value),
          fillColor: getColor(dataPoint.value),
          fillOpacity: 0.5,
          location: dataPoint.key
        });
        circle.unbindPopup();
        createPopup(circle, location ? location.name : dataPoint.locationName, dataPoint.valueRounded);
      } else {
        circles.push(createCircle(location, dataPoint));
      }
    });
    ctrl.circlesLayer = window.L.layerGroup(circles).addTo(ctrl.map);
    ctrl.circles = ctrl.circles.concat(circles);
  }

  function createCircle(location, dataPoint) {
    const circle = window.L.circleMarker(getLatLng(location, dataPoint.key), {
      radius: calcCircleSize(dataPoint.value || 0),
      color: getColor(dataPoint.value),
      fillColor: getColor(dataPoint.value),
      fillOpacity: 0.5,
      location: dataPoint.key
    });

    createPopup(circle, location ? location.name : dataPoint.locationName, dataPoint.valueRounded);
    return circle;
  }

  function getLatLng(location, key) {
    if (ctrl.panel.locationData === 'geohash') {
      const decodedGeohash = decodeGeoHash(key);
      return [decodedGeohash.latitude, decodedGeohash.longitude];
    }

    return [location.latitude, location.longitude];
  }

  function calcCircleSize(dataPointValue) {
    if (ctrl.data.valueRange === 0) {
      return ctrl.panel.circleMinSize;
    }

    const dataFactor = (dataPointValue - ctrl.data.lowestValue) / ctrl.data.valueRange;
    const circleSizeRange = ctrl.panel.circleMaxSize - ctrl.panel.circleMinSize;

    return (circleSizeRange * dataFactor) + ctrl.panel.circleMinSize;
  }

  function createPopup(circle, locationName, value) {
    const unit = value && value === 1 ? ctrl.panel.unitSingular : ctrl.panel.unitPlural;
    circle.bindPopup(locationName + ': ' + value + ' ' + unit, {'offset': window.L.point(0, -2), 'className': 'worldmap-popup'});

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
