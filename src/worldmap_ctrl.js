/* eslint import/no-extraneous-dependencies: 0 */
import {MetricsPanelCtrl} from 'app/plugins/sdk';
import TimeSeries from 'app/core/time_series2';
import kbn from 'app/core/utils/kbn';

import _ from 'lodash';
import mapRenderer from './map_renderer';
import DataFormatter from './data_formatter';
import './css/worldmap-panel.css!';

const panelDefaults = {
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
  decimals: 0,
  hideEmpty: false,
  hideZero: false,
  stickyLabels: false
};

const mapCenters = {
  '(0°, 0°)': {mapCenterLatitude: 0, mapCenterLongitude: 0},
  'North America': {mapCenterLatitude: 40, mapCenterLongitude: -100},
  'Europe': {mapCenterLatitude: 46, mapCenterLongitude: 14},
  'West Asia': {mapCenterLatitude: 26, mapCenterLongitude: 53},
  'SE Asia': {mapCenterLatitude: 10, mapCenterLongitude: 106},
  'Last GeoHash': {mapCenterLatitude: 0, mapCenterLongitude: 0}
};

export default class WorldmapCtrl extends MetricsPanelCtrl {
  constructor($scope, $injector, contextSrv) {
    super($scope, $injector);

    this.setMapProvider(contextSrv);
    _.defaults(this.panel, panelDefaults);

    this.dataFormatter = new DataFormatter(this, kbn);

    this.events.on('init-edit-mode', this.onInitEditMode.bind(this));
    this.events.on('data-received', this.onDataReceived.bind(this));
    this.events.on('panel-teardown', this.onPanelTeardown.bind(this));
    this.events.on('data-snapshot-load', this.onDataSnapshotLoad.bind(this));

    this.loadLocationDataFromFile();
  }

  setMapProvider(contextSrv) {
    this.tileServer = contextSrv.user.lightTheme ? 'CartoDB Positron' : 'CartoDB Dark';
    this.setMapSaturationClass();
  }

  setMapSaturationClass() {
    if (this.tileServer === 'CartoDB Dark') {
      this.saturationClass = 'map-darken';
    } else {
      this.saturationClass = '';
    }
  }

  loadLocationDataFromFile(reload) {
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
        success: (res) => {
          this.locations = res;
          this.render();
        }
      });
    } else if (this.panel.locationData === 'json endpoint') {
      if (!this.panel.jsonUrl) return;

      window.$.getJSON(this.panel.jsonUrl).then((res) => {
        this.locations = res;
        this.render();
      });
    } else if (this.panel.locationData === 'table') {
      // .. Do nothing
    } else if (this.panel.locationData !== 'geohash' && this.panel.locationData !== 'json result') {
      window.$.getJSON('public/plugins/grafana-worldmap-panel/data/' + this.panel.locationData + '.json')
        .then(this.reloadLocations.bind(this));
    }
  }

  reloadLocations(res) {
    this.locations = res;
    this.refresh();
  }

  onPanelTeardown() {
    if (this.map) this.map.remove();
  }

  onInitEditMode() {
    this.addEditorTab('Worldmap', 'public/plugins/grafana-worldmap-panel/partials/editor.html', 2);
  }

  onDataReceived(dataList) {
    if (!dataList) return;

    if (this.dashboard.snapshot && this.locations) {
      this.panel.snapshotLocationData = this.locations;
    }

    const data = [];

    if (this.panel.locationData === 'geohash') {
      this.dataFormatter.setGeohashValues(dataList, data);
    } else if (this.panel.locationData === 'table') {
      const tableData = dataList.map(DataFormatter.tableHandler.bind(this));
      this.dataFormatter.setTableValues(tableData, data);
    } else if (this.panel.locationData === 'json result') {
      this.series = dataList;
      this.dataFormatter.setJsonValues(data);
    } else {
      this.series = dataList.map(this.seriesHandler.bind(this));
      this.dataFormatter.setValues(data);
    }
    this.data = data;

    this.updateThresholdData();

    if (this.data.length && this.panel.mapCenter === 'Last GeoHash') {
      this.centerOnLastGeoHash();
    } else {
      this.render();
    }
  }

  centerOnLastGeoHash() {
    mapCenters[this.panel.mapCenter].mapCenterLatitude = _.last(this.data).locationLatitude;
    mapCenters[this.panel.mapCenter].mapCenterLongitude = _.last(this.data).locationLongitude;
    this.setNewMapCenter();
  }

  onDataSnapshotLoad(snapshotData) {
    this.onDataReceived(snapshotData);
  }

  seriesHandler(seriesData) {
    const series = new TimeSeries({
      datapoints: seriesData.datapoints,
      alias: seriesData.target,
    });

    series.flotpairs = series.getFlotPairs(this.panel.nullPointMode);
    return series;
  }

  setNewMapCenter() {
    if (this.panel.mapCenter !== 'custom') {
      this.panel.mapCenterLatitude = mapCenters[this.panel.mapCenter].mapCenterLatitude;
      this.panel.mapCenterLongitude = mapCenters[this.panel.mapCenter].mapCenterLongitude;
    }
    this.mapCenterMoved = true;
    this.render();
  }

  setZoom() {
    this.map.setZoom(this.panel.initialZoom || 1);
  }

  toggleLegend() {
    if (!this.panel.showLegend) {
      this.map.removeLegend();
    }
    this.render();
  }

  toggleStickyLabels() {
    this.map.clearCircles();
    this.render();
  }

  changeThresholds() {
    this.updateThresholdData();
    this.map.legend.update();
    this.render();
  }

  updateThresholdData() {
    this.data.thresholds = this.panel.thresholds.split(',').map((strValue) => {
      return Number(strValue.trim());
    });
    while (_.size(this.panel.colors) > _.size(this.data.thresholds) + 1) {
      // too many colors. remove the last one.
      this.panel.colors.pop();
    }
    while (_.size(this.panel.colors) < _.size(this.data.thresholds) + 1) {
      // not enough colors. add one.
      const newColor = 'rgba(50, 172, 45, 0.97)';
      this.panel.colors.push(newColor);
    }
  }

  changeLocationData() {
    this.loadLocationDataFromFile(true);

    if (this.panel.locationData === 'geohash') {
      this.render();
    }
  }

/* eslint class-methods-use-this: 0 */
  link(scope, elem, attrs, ctrl) {
    mapRenderer(scope, elem, attrs, ctrl);
  }
}

WorldmapCtrl.templateUrl = 'module.html';
