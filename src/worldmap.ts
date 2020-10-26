import * as _ from 'lodash';
import $ from 'jquery';
import * as L from './libs/leaflet';
import WorldmapCtrl from './worldmap_ctrl';
import { ColorModes } from './model';

const tileServers = {
  'CartoDB Positron': {
    url: 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> ' + '&copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
    subdomains: 'abcd',
  },
  'CartoDB Dark': {
    url: 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> ' + '&copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
    subdomains: 'abcd',
  },
};

export default class WorldMap {
  ctrl: WorldmapCtrl;
  mapContainer: any;
  circles: any[];
  map: any;
  legend: any;
  circlesLayer: any;

  constructor(ctrl, mapContainer) {
    this.ctrl = ctrl;
    this.mapContainer = mapContainer;
    this.circles = [];
  }

  createMap() {
    const center = this.ctrl.settings.center;
    const mapCenter = (window as any).L.latLng(center.mapCenterLatitude, center.mapCenterLongitude);

    const zoomLevel = this.getEffectiveZoomLevel(center.mapZoomLevel);

    this.map = L.map(this.mapContainer, {
      worldCopyJump: true,
      preferCanvas: true,
      center: mapCenter,
      zoom: zoomLevel,
      zoomControl: this.ctrl.settings.showZoomControl,
      attributionControl: this.ctrl.settings.showAttribution,
    });
    this.setMouseWheelZoom();
    this.setDragging();
    this.setDoubleClickZoom();

    const selectedTileServer = tileServers[this.ctrl.tileServer];
    (window as any).L.tileLayer(selectedTileServer.url, {
      maxZoom: 18,
      subdomains: selectedTileServer.subdomains,
      reuseTiles: true,
      detectRetina: true,
      attribution: selectedTileServer.attribution,
    }).addTo(this.map);
  }

  renderMapFirst() {
    const _this = this;
    this.map.whenReady((ctx, options) => {
      _this.renderMap({ animate: false });
    });
  }

  renderMap(options?: {}) {
    options = options || {};
    _.defaults(options, { animate: true });

    if (!this.legend && this.ctrl.settings.showLegend) {
      this.createLegend();
    }

    console.info('Drawing circles');
    this.drawCircles();

    this.drawCustomAttribution();

    setTimeout(() => {
      this.drawMap(options);
    }, 1);
  }

  drawMap(options?: {}) {
    console.info('Drawing map');
    this.resize();
    if (this.ctrl.mapCenterMoved) {
      this.panToMapCenter(options);
    }
    //this.ctrl.updatePanelCorner();
  }

  getEffectiveZoomLevel(zoomLevel) {
    if (this.ctrl.settings.maximumZoom) {
      zoomLevel = Math.min(parseInt(this.ctrl.settings.maximumZoom, 10), zoomLevel);
    }
    return zoomLevel;
  }

  private getLegendUpdateFunction() {
    switch (this.ctrl.settings.colorMode) {
      case ColorModes.categories.id:
        return () => {
          const legendHtml = this.ctrl.data.categories.reduce((html, cat, idx) => {
            return html + '<div class="legend-item"><i style="background:' + this.ctrl.settings.colors[idx + 1] + '"></i> ' + cat + '</div>';
          }, '<div class="legend-item"><i style="background:' + this.ctrl.settings.colors[0] + '"></i> *</div>');
          this.legend._div.innerHTML = legendHtml;
        };
      case ColorModes.threshold.id:
      default:
        return () => {
          const thresholds = this.ctrl.data.thresholds;
          let legendHtml = '';
          legendHtml +=
            '<div class="legend-item"><i style="background:' + this.ctrl.settings.colors[0] + '"></i> ' + '&lt; ' + thresholds[0] + '</div>';
          for (let index = 0; index < thresholds.length; index += 1) {
            legendHtml +=
              '<div class="legend-item"><i style="background:' +
              this.ctrl.settings.colors[index + 1] +
              '"></i> ' +
              thresholds[index] +
              (thresholds[index + 1] ? '&ndash;' + thresholds[index + 1] + '</div>' : '+');
          }
          this.legend._div.innerHTML = legendHtml;
        };
    }
  }

  createLegend() {
    this.legend = (window as any).L.control({ position: 'bottomleft' });
    this.legend.onAdd = () => {
      this.legend._div = (window as any).L.DomUtil.create('div', 'info legend');
      this.legend.update();
      return this.legend._div;
    };

    this.legend.update = this.getLegendUpdateFunction();
    this.legend.addTo(this.map);

    // Optionally display legend in different DOM element.
    if (this.ctrl.settings.legendContainerSelector) {
      $(this.ctrl.settings.legendContainerSelector).append(this.legend._div);
    }
  }

  needToRedrawCircles(data) {
    console.info(`Data points ${data.length}. Circles on map ${this.circles.length}.`);

    if (this.circles.length === 0 && data.length > 0) {
      return true;
    }

    if (this.circles.length !== data.length) {
      return true;
    }

    const locations = _.map(_.map(this.circles, 'options'), 'location').sort();
    const dataPoints = _.map(data, 'key').sort();
    return !_.isEqual(locations, dataPoints);
  }

  filterEmptyAndZeroValues(data) {
    const countBefore = data.length;
    data = _.filter(data, o => {
      return !(this.ctrl.settings.hideEmpty && _.isNil(o.value)) && !(this.ctrl.settings.hideZero && o.value === 0);
    });
    const countAfter = data.length;
    const countFiltered = countAfter - countBefore;
    if (countFiltered > 0) {
      console.info(`Filtered ${countFiltered} records`);
    }
    return data;
  }

  clearCircles() {
    if (this.circlesLayer) {
      this.circlesLayer.clearLayers();
      this.removeCircles();
      this.circles = [];
    }
  }

  drawCircles() {
    const data = this.filterEmptyAndZeroValues(this.ctrl.data);
    if (this.needToRedrawCircles(data)) {
      console.info('Creating circles');
      this.clearCircles();
      this.createCircles(data);
    } else {
      console.info('Updating circles');
      this.updateCircles(data);
    }
  }

  createCircles(data) {
    console.log('createCircles: begin');
    const circles: any[] = [];
    const circlesByKey = {};
    data.forEach(dataPoint => {
      // Todo: Review: Is a "locationName" really required
      //       just for displaying a circle on a map?
      if (!dataPoint.locationName) {
        return;
      }
      let circle;

      if (circlesByKey[dataPoint.key] === undefined) {
        // Create circle.
        circle = this.createCircle(dataPoint);
        circles.push(circle);
        circlesByKey[dataPoint.key] = circle;
      } else {
        // Amend popup content if circle has been created already.
        circle = circlesByKey[dataPoint.key];
        this.extendPopupContent(circle, dataPoint);
      }
    });
    this.circlesLayer = this.addCircles(circles);
    this.circles = circles;
    console.log('createCircles: end');
  }

  updateCircles(data) {
    const circlesByKey = {};
    data.forEach(dataPoint => {
      // Todo: Review: Is a "locationName" really required
      //       just for displaying a circle on a map?
      if (!dataPoint.locationName) {
        return;
      }

      if (circlesByKey[dataPoint.key] === undefined) {
        // Update circle.
        const circle = this.updateCircle(dataPoint);
        if (circle) {
          circlesByKey[dataPoint.key] = circle;
        }
      } else {
        // Amend popup content if circle has been updated already.
        const circle = circlesByKey[dataPoint.key];
        this.extendPopupContent(circle, dataPoint);
      }
    });
  }

  createCircle(dataPoint) {
    const circle = (window as any).L.circleMarker([dataPoint.locationLatitude, dataPoint.locationLongitude], {
      radius: this.calcCircleSize(dataPoint.value || 0),
      color: this.getColor(dataPoint),
      fillColor: this.getColor(dataPoint),
      fillOpacity: 0.5,
      location: dataPoint.key,
      stroke: Boolean(this.ctrl.settings.circleOptions.strokeEnabled),
      weight: parseInt(this.ctrl.settings.circleOptions.strokeWeight, 10) || 3,
    });

    this.createClickthrough(circle, dataPoint);
    const content = this.getPopupContent(dataPoint.locationName, dataPoint.valueRounded);
    this.createPopup(circle, content);
    return circle;
  }

  updateCircle(dataPoint) {
    // Find back circle object by data point key.
    const circle = _.find(this.circles, cir => {
      return cir.options.location === dataPoint.key;
    });

    if (circle) {
      circle.setRadius(this.calcCircleSize(dataPoint.value || 0));
      circle.setStyle({
        color: this.getColor(dataPoint),
        fillColor: this.getColor(dataPoint),
        fillOpacity: 0.5,
        location: dataPoint.key,
      });

      // Re-create popup.
      circle.unbindPopup();
      const content = this.getPopupContent(dataPoint.locationName, dataPoint.valueRounded);
      this.createPopup(circle, content);

      // Re-create clickthrough-link.
      this.createClickthrough(circle, dataPoint);

      return circle;
    }
  }

  calcCircleSize(dataPointValue) {
    const circleMinSize = parseFloat(this.ctrl.settings.circleMinSize) || 1;
    const circleMaxSize = parseFloat(this.ctrl.settings.circleMaxSize) || 10;

    if (this.ctrl.settings.circleSizeAbsoluteEnabled) {
      const size = dataPointValue * (parseFloat(this.ctrl.settings.circleSizeAbsoluteFactor) || 1.0);
      return Math.min(circleMaxSize, Math.max(circleMinSize, size));
    }

    // If measurement value equals zero, use minimum circle size.
    if (dataPointValue === 0) {
      return circleMinSize;
    }

    if (this.ctrl.data.valueRange === 0) {
      return circleMaxSize;
    }

    const dataFactor = (dataPointValue - this.ctrl.data.lowestValue) / this.ctrl.data.valueRange;
    const circleSizeRange = circleMaxSize - circleMinSize;

    return circleSizeRange * dataFactor + circleMinSize;
  }

  createClickthrough(circle, dataPoint) {
    /*
     * Features:
     * - Unify functionality from #129 and #190
     * - Generic variable interpolation from dataPoint
     * - Generic variable interpolation from dashboard variables
     * - Optionally open url in new window
     */

    // First, use link value directly from `clickthroughUrl` setting.
    let linkUrl;
    if (this.ctrl.settings.clickthroughUrl) {
      linkUrl = this.ctrl.settings.interpolateVariable('clickthroughUrl', dataPoint);
    }

    // Next, use link value from the data itself by using the
    // table control option `linkField` for looking it up.
    if (dataPoint.link) {
      linkUrl = dataPoint.link;

      // Interpolate the dashboard and dataPoint variables.
      linkUrl = this.ctrl.settings.interpolateVariableValue(linkUrl, dataPoint);
    }

    // Deactivate all links first.
    circle.off('click');

    // Attach "onclick" event to data point linking.
    if (linkUrl) {
      const clickthroughOptions = this.ctrl.settings.clickthroughOptions;
      circle.on('click', evt => {
        if (clickthroughOptions && clickthroughOptions.windowName) {
          window.open(linkUrl, clickthroughOptions.windowName);
        } else {
          window.location.assign(linkUrl);
        }
      });
    }
  }

  createPopup(circle, label) {
    circle.bindPopup(label, {
      offset: (window as any).L.point(0, -2),
      className: 'worldmap-popup',
      closeButton: this.ctrl.settings.stickyLabels,
      autoPan: this.ctrl.settings.autoPanLabels,
      autoWidth: this.ctrl.settings.autoWidthLabels,
    });

    circle.on('mouseover', evt => {
      const layer = evt.target;
      layer.bringToFront();
      circle.openPopup();
    });

    if (!this.ctrl.settings.stickyLabels) {
      circle.on('mouseout', () => {
        circle.closePopup();
      });
    }
  }

  extendPopupContent(circle, dataPoint) {
    const popup = circle.getPopup();
    let popupContent = popup._content;
    popupContent += `\n${this.getPopupContent(dataPoint.locationName, dataPoint.valueRounded)}`;
    circle.setPopupContent(popupContent);
  }

  getPopupContent(locationName, value) {
    let unit;
    if (_.isNaN(value)) {
      value = 'n/a';
    } else {
      unit = value && value === 1 ? this.ctrl.settings.unitSingular : this.ctrl.settings.unitPlural;
    }
    const label = `${locationName}: ${value} ${unit || ''}`.trim();
    return label;
  }

  private getCategoryColor(label) {
    for (let index = 0; index !== this.ctrl.data.categories.length; index += 1) {
      if (this.ctrl.data.categories[index] === label) {
        return this.ctrl.settings.colors[index + 1];
      }
    }
    return _.first(this.ctrl.settings.colors);
  }

  private getThresholdColor(value) {
    for (let index = this.ctrl.data.thresholds.length; index > 0; index -= 1) {
      if (value >= this.ctrl.data.thresholds[index - 1]) {
        return this.ctrl.settings.colors[index];
      }
    }
    return _.first(this.ctrl.settings.colors);
  }

  getColor(dataPoint) {
    switch (this.ctrl.settings.colorMode) {
      case ColorModes.categories.id:
        return this.getCategoryColor(dataPoint.locationName);
      case ColorModes.threshold.id:
      default:
        return this.getThresholdColor(dataPoint.value);
    }
  }

  resize() {
    this.map.invalidateSize();
  }

  panToMapCenter(options?: any) {
    console.log('panToMapCenter');

    // Get a bunch of metadata from settings and data which
    // controls the map centering and zoom level.
    const mapDimensions = this.ctrl.settings.center;

    let coordinates = [mapDimensions.mapCenterLatitude, mapDimensions.mapCenterLongitude];
    let zoomLevel = mapDimensions.mapZoomLevel;

    if (mapDimensions.mapFitData) {
      // Choose optimal map center and zoom level based on the data points displayed.
      // This is done by computing the boundaries of a Leaflet feature group created
      // from the contents of the circles layer.
      // https://leafletjs.com/reference-1.4.0.html#map-getboundszoom
      if (this.circlesLayer) {
        const group = L.featureGroup(this.circlesLayer.getLayers());
        const bounds = group.getBounds();
        if (!_.isEmpty(bounds)) {
          coordinates = bounds.getCenter();
          zoomLevel = this.map.getBoundsZoom(bounds);
        }
      }
    } else if (mapDimensions.mapZoomByRadius) {
      // Compute zoom level based on current coordinates and given radius in kilometers.
      // This is done by temporarily adding a circle with the respective radius and
      // computing its boundaries before removing it right away.
      // Note that adding and removing a Leaflet layer to/from a map within a single
      // frame will not trigger any animations, see
      // https://github.com/Leaflet/Leaflet/issues/5357#issuecomment-282023917
      const radius = mapDimensions.mapZoomByRadius * 1000.0;
      const circle = L.circle(coordinates, { radius: radius }).addTo(this.map);
      const bounds = circle.getBounds();
      circle.remove();
      coordinates = bounds.getCenter();
      zoomLevel = this.map.getBoundsZoom(bounds);
    }

    zoomLevel = this.getEffectiveZoomLevel(zoomLevel);

    // Apply coordinates and zoom level to Leaflet map.
    this.map.setView(coordinates, zoomLevel, options);

    // Resolve signal / release lock.
    this.ctrl.mapCenterMoved = false;
  }

  removeLegend() {
    this.legend.remove(this.map);
    this.legend = null;
  }

  setMouseWheelZoom() {
    if (!this.ctrl.settings.mouseWheelZoom) {
      this.map.scrollWheelZoom.disable();
    } else {
      this.map.scrollWheelZoom.enable();
    }
  }

  setDragging() {
    if (!this.ctrl.settings.dragging) {
      this.map.dragging.disable();
    } else {
      this.map.dragging.enable();
    }
  }

  setDoubleClickZoom() {
    if (!this.ctrl.settings.doubleClickZoom) {
      this.map.doubleClickZoom.disable();
    } else {
      this.map.doubleClickZoom.enable();
    }
  }

  addCircles(circles) {
    // Todo: Optionally add fixed custom attributions to the circle layer.
    const attribution = undefined;
    return (window as any).L.layerGroup(circles, { attribution: attribution }).addTo(this.map);
  }

  removeCircles() {
    this.map.removeLayer(this.circlesLayer);
  }

  setZoom(zoomFactor) {
    this.map.setZoom(parseInt(zoomFactor, 10));
  }

  remove() {
    this.circles = [];
    if (this.circlesLayer) {
      this.removeCircles();
    }
    if (this.legend) {
      this.removeLegend();
    }
    this.map.remove();
  }

  drawCustomAttribution() {
    // The operator wants a custom attribution.
    if (this.ctrl.settings.customAttribution) {
      // The custom attribution text.
      const attribution = this.ctrl.settings.customAttributionText;

      // Amend the Leaflet map by clearing out and setting the custom attribution text.
      const attributionControl = this.map.attributionControl;
      attributionControl._attributions = {};
      attributionControl.addAttribution(attribution);
    }
  }
}
