import * as _ from 'lodash';
import * as L from './libs/leaflet';
import WorldmapCtrl from './worldmap_ctrl';

const tileServers = {
  'CartoDB Positron': {
    url:
      'https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> ' +
      '&copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
    subdomains: 'abcd'
  },
  'CartoDB Dark': {
    url:
      'https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> ' +
      '&copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
    subdomains: 'abcd'
  }
};

export default class WorldMap {
  ctrl: WorldmapCtrl;
  mapContainer: any;
  circles: any[];
  map: any;
  legend: any;
  circlesLayer: any;
  aggregations: any;
  templateSrv: any;

  constructor(ctrl, mapContainer, templateSrv?) {
    this.ctrl = ctrl;
    this.mapContainer = mapContainer;
    this.circles = [];
    this.templateSrv = templateSrv;
  }

  createMap() {
    const mapCenter = (<any>window).L.latLng(
      parseFloat(this.ctrl.panel.mapCenterLatitude),
      parseFloat(this.ctrl.panel.mapCenterLongitude)
    );
    this.map = L.map(this.mapContainer, {
      worldCopyJump: true,
      preferCanvas: true,
      center: mapCenter,
      zoom: parseInt(this.ctrl.panel.initialZoom, 10) || 1
    });
    this.setMouseWheelZoom();

    const selectedTileServer = tileServers[this.ctrl.tileServer];
    (<any>window).L.tileLayer(selectedTileServer.url, {
      maxZoom: 18,
      subdomains: selectedTileServer.subdomains,
      reuseTiles: true,
      detectRetina: true,
      attribution: selectedTileServer.attribution
    }).addTo(this.map);
  }

  createLegend() {
    this.legend = (<any>window).L.control({ position: 'bottomleft' });
    this.legend.onAdd = () => {
      this.legend._div = (<any>window).L.DomUtil.create('div', 'info legend');
      this.legend.update();
      return this.legend._div;
    };

    this.legend.update = () => {
      const thresholds = this.ctrl.data.thresholds;
      let legendHtml = '';
      legendHtml +=
        '<div class="legend-item"><i style="background:' +
        this.ctrl.panel.colors[0] +
        '"></i> ' +
        '&lt; ' +
        thresholds[0] +
        '</div>';
      for (let index = 0; index < thresholds.length; index += 1) {
        legendHtml +=
          '<div class="legend-item"><i style="background:' +
          this.ctrl.panel.colors[index + 1] +
          '"></i> ' +
          thresholds[index] +
          (thresholds[index + 1]
            ? '&ndash;' + thresholds[index + 1] + '</div>'
            : '+');
      }
      this.legend._div.innerHTML = legendHtml;
    };
    this.legend.addTo(this.map);
  }

  createAggregations() {
    this.aggregations = (<any>window).L.control({ position: 'bottomright' });
    this.aggregations.onAdd = () => {
      this.aggregations._div = (<any>window).L.DomUtil.create(
        'div',
        'info aggregations'
      );
      this.aggregations.update();
      return this.aggregations._div;
    };

    this.aggregations.update = () => {
      const aggregations = this.ctrl.data.aggregations || {};
      let aggregationsHtml = '';
      if (Object.keys(aggregations).length <= 1 && aggregations.unknown === 0) {
        aggregationsHtml = '<div>No Data Available</div>';
      } else if (
        this.ctrl.data.aggregationSortedList &&
        this.ctrl.data.aggregationSortedList.length &&
        Object.keys(aggregations).length > 1
      ) {
        this.ctrl.data.aggregationSortedList.forEach(agg => {
          if (aggregations[agg] !== 0) {
            aggregationsHtml = `${aggregationsHtml}
          <div class="agg-item">
            <div>
              <div class="agg-label" title=${agg}>${agg}</div>
              <b>${(100 * (aggregations[agg] / this.ctrl.data.length))
                .toFixed(2)
                .replace(/[.,]00$/, '')}%</b>
            </div>
            <div class="agg-bar">
              <div class="agg-bar-progress" style="width: ${100 *
              (aggregations[agg] / this.ctrl.data.length)}%">
                progress
              </div>
            </div>
          </div>`;
          }
        });
      } else {
        aggregationsHtml = `Invalid mapping for aggregations`;
      }
      this.aggregations._div.innerHTML = `<div class="agg-container">${aggregationsHtml}</div>`;
    };
    this.aggregations.addTo(this.map);
  }

  needToRedrawCircles(data) {
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
    return _.filter(data, o => {
      return (
        !(this.ctrl.panel.hideEmpty && _.isNil(o.value)) &&
        !(this.ctrl.panel.hideZero && o.value === 0)
      );
    });
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
    this.clearCircles();
    this.createCircles(data);
    /*if (this.needToRedrawCircles(data)) {
      this.clearCircles();
      this.createCircles(data);
    } else {
      this.updateCircles(data);
    }*/
    // Update Aggregations
    if (this.aggregations && this.aggregations !== null) {
      this.aggregations.update();
    }
  }

  createCircles(data) {
    const circles: any[] = [];
    data.forEach(dataPoint => {
      if (!dataPoint.locationName) {
        return;
      }
      circles.push(this.createCircle(dataPoint, data));
    });
    this.circlesLayer = this.addCircles(circles);
    this.circles = circles;
  }

  updateCircles(data) {
    data.forEach(dataPoint => {
      if (!dataPoint.locationName) {
        return;
      }

      const circle = _.find(this.circles, cir => {
        return cir.options.location === dataPoint.key;
      });

      if (circle) {
        circle.options.dataset = data;
        circle.setRadius(this.calcCircleSize(dataPoint.value || 0));
        circle.setStyle({
          color: this.getColor(dataPoint.value),
          fillColor: this.getColor(dataPoint.value),
          fillOpacity: 0.5,
          location: dataPoint.key
        });
        circle.unbindPopup();
        this.createPopup(
          circle,
          dataPoint.locationName,
          dataPoint.valueRounded,
          dataPoint.isMetricFieldNaN
        );
      }
    });
    if (this.aggregations && this.aggregations !== null) {
      this.aggregations.update();
    }
  }

  createCircle(dataPoint, dataset?) {
    const circle = (<any>window).L.circleMarker(
      [dataPoint.locationLatitude, dataPoint.locationLongitude],
      {
        radius: this.calcCircleSize(dataPoint.value || 0),
        color: this.getColor(dataPoint.value),
        fillColor: this.getColor(dataPoint.value),
        fillOpacity: 0.5,
        location: dataPoint.key,
        dataset
      }
    );
    this.createPopup(
      circle,
      dataPoint.locationName,
      dataPoint.valueRounded,
      dataPoint.isMetricFieldNaN
    );
    return circle;
  }

  calcCircleSize(dataPointValue) {
    const circleMinSize = parseInt(this.ctrl.panel.circleMinSize, 10) || 10;
    const circleMaxSize = parseInt(this.ctrl.panel.circleMaxSize, 10) || 10;

    if (this.ctrl.data.valueRange === 0) {
      return circleMaxSize;
    }

    const dataFactor =
      (dataPointValue - this.ctrl.data.lowestValue) / this.ctrl.data.valueRange;
    const circleSizeRange = circleMaxSize - circleMinSize;

    return circleSizeRange * dataFactor + circleMinSize;
  }

  createPopup(circle, locationName, value, isMetricFieldNaN) {
    const unit =
      value && value === 1
        ? this.ctrl.panel.unitSingular
        : this.ctrl.panel.unitPlural;

    let formattedLocationList = '';
    circle.options.dataset
      .filter(data => data.key === circle.options.location)
      .forEach(location => {
        if (
          this.ctrl.panel.drilldownTarget &&
          this.ctrl.panel.drilldownTarget !== ''
        ) {
          const url = this.ctrl.panel.drilldownTarget
            ? this.ctrl.panel.drilldownTarget.split('${__locationName}').join(`${location.locationName}`) : '';
          const hrefUrl = this.templateSrv.replace(url);

          formattedLocationList = `${formattedLocationList}
            <div>
            ${`
            ${
              this.ctrl.panel.drillDownTab
                ? `<a href="${hrefUrl}" target="_blank">${location.locationName}</a> `
                : `<a href="${hrefUrl}">${location.locationName}</a>`
              }
            ${!isMetricFieldNaN ? `: ${location.value}` : ''}
            ${unit ? `(${unit})` : ''}`.trim()}
            </div>`;
        } else {
          formattedLocationList = `${formattedLocationList} <div>
           ${`${location.locationName} ${
              !isMetricFieldNaN ? `: ${location.value}` : ''
              }
           ${unit ? `(${unit})` : ''}`.trim()}
           </div>`;
        }
        const label = `<div class="tooltip-container">${formattedLocationList}</div>`;
        circle.bindPopup(label, {
          offset: (<any>window).L.point(0, -2),
          className: 'worldmap-popup',
          closeButton: this.ctrl.panel.stickyLabels
        });

        circle.on('mouseover', function onMouseOver(evt) {
          const layer = evt.target;
          layer.bringToFront();
          this.openPopup();
        });

        if (!this.ctrl.panel.stickyLabels) {
          circle.on('mouseout', function onMouseOut() {
            circle.closePopup();
          });
        }
      });
  }

  getColor(value) {
    for (let index = this.ctrl.data.thresholds.length; index > 0; index -= 1) {
      if (value >= this.ctrl.data.thresholds[index - 1]) {
        return this.ctrl.panel.colors[index];
      }
    }
    return _.first(this.ctrl.panel.colors);
  }

  resize() {
    this.map.invalidateSize();
  }

  panToMapCenter() {
    this.map.panTo([
      parseFloat(this.ctrl.panel.mapCenterLatitude),
      parseFloat(this.ctrl.panel.mapCenterLongitude)
    ]);
    this.ctrl.mapCenterMoved = false;
  }

  removeLegend() {
    this.legend.remove(this.map);
    this.legend = null;
  }

  removeAggregations() {
    this.aggregations.remove(this.map);
    this.aggregations = null;
  }

  setMouseWheelZoom() {
    if (!this.ctrl.panel.mouseWheelZoom) {
      this.map.scrollWheelZoom.disable();
    } else {
      this.map.scrollWheelZoom.enable();
    }
  }

  addCircles(circles) {
    return (<any>window).L.layerGroup(circles).addTo(this.map);
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
    if (this.aggregations) {
      this.removeAggregations();
    }
    this.map.remove();
  }
}
