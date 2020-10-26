import { loadPluginCss, MetricsPanelCtrl } from 'grafana/app/plugins/sdk';

import * as _ from 'lodash';
import './styles/worldmap-panel.css';
import './styles/leaflet.css';
import PluginSettings from './settings';
import WorldMap from './worldmap';
import { ColorModes, LocationSources, MapCenters } from './model';
import { WorldmapCore } from './core';
import { WorldmapChrome } from './chrome';
import { ErrorManager } from './errors';
import DataFormatter from './data_formatter';
import appEvents from 'grafana/app/core/app_events';

const panelDefaults = {
  maxDataPoints: 1,
  mapFitData: false,
  mapCenter: '(0°, 0°)',
  mapCenterLatitude: 0,
  mapCenterLongitude: 0,
  initialZoom: 1,
  maximumZoom: null,
  mapZoomByRadius: null,
  valueName: 'total',
  circleMinSize: 2,
  circleMaxSize: 30,
  circleOptions: {
    strokeEnabled: true,
    strokeWeight: 3,
  },
  locationData: null,
  thresholds: '0,10',
  colors: ['rgba(245, 54, 54, 0.9)', 'rgba(237, 129, 40, 0.89)', 'rgba(50, 172, 45, 0.97)'],
  categories: 'a,b',
  colorMode: ColorModes.threshold.id,
  unitSingular: '',
  unitPlural: '',
  showLegend: true,
  legendContainerSelector: null,
  showZoomControl: true,
  showAttribution: true,
  customAttribution: false,
  customAttributionText: null,
  mouseWheelZoom: false,
  dragging: true,
  doubleClickZoom: true,
  esGeoPoint: null,
  // Todo: Investigate: Is "Count" a reasonable default here
  //  or does it confuse the operator?
  esMetric: 'Count',
  esLocationName: null,
  esLink: null,
  decimals: 0,
  hideEmpty: false,
  hideZero: false,
  ignoreEmptyGeohashValues: false,
  ignoreInvalidGeohashValues: false,
  stickyLabels: false,
  clickthroughUrl: '',
  clickthroughOptions: {
    windowName: null,
  },
  autoPanLabels: true,
  autoWidthLabels: true,
  tableQueryOptions: {
    queryType: 'geohash',
    geohashField: 'geohash',
    latitudeField: 'latitude',
    longitudeField: 'longitude',
    metricField: 'metric',
    labelField: null,
    labelLocationKeyField: null,
    linkField: null,
  },
  ignoreEscapeKey: false,
  hideTimepickerNavigation: false,
};

export default class WorldmapCtrl extends MetricsPanelCtrl {
  static templateUrl = 'partials/module.html';

  locations: any;
  tileServer = '';
  saturationClass = '';
  map: any;
  series: any;
  data: any = [];
  dataInfo: any;
  mapCenterMoved = false;

  contextSrv: any;
  $location: any;
  $element: any;
  $document: any;

  settings: any;
  core: WorldmapCore;
  chrome: WorldmapChrome;
  errors: ErrorManager;

  initializing: boolean;

  /** @ngInject */
  constructor($scope, $injector, $element, $document, contextSrv, templateSrv, $location) {
    super($scope, $injector);

    this.$element = $element;
    this.$document = $document;
    this.contextSrv = contextSrv;

    this.loadCss();

    this.initializing = true;

    this.errors = new ErrorManager();
    this.errors.registerDomains('data', 'location');

    this.settings = undefined;
    this.loadSettings();

    this.core = new WorldmapCore(this);
    this.chrome = new WorldmapChrome(this);

    this.setupMap();
    this.setupGlobal();
    this.setupEvents();

    this.loadLocationData();
  }

  loadCss() {
    loadPluginCss({
      dark: `plugins/${this.pluginId}/styles/dark.css`,
      light: `plugins/${this.pluginId}/styles/light.css`,
    });
  }

  loadSettings() {
    /*
     * Initialize the plugin setting subsystem to provide `this.settings`.
     */
    console.info('Loading settings');
    _.defaults(this.panel, panelDefaults);
    const query = this.$location.search();
    this.settings = new PluginSettings(this.panel, this.templateSrv, query);

    // Establish a virtual settings property accessible through `this.settings.center`.
    Object.defineProperty(this.settings, 'center', {
      get: () => this.core.getMapDimensions(),
      enumerable: true,
    });
  }

  setupGlobal() {
    /*
     * Initialize the plugin.
     */

    // Optionally ignore the escape key.
    if (this.settings.ignoreEscapeKey) {
      this.chrome.removeEscapeKeyBinding();
    } else {
      this.chrome.restoreEscapeKeyBinding();
    }

    // Optionally hide the timepicker navigation widget.
    if (this.settings.hideTimepickerNavigation) {
      this.chrome.removeTimePickerNav();
    } else {
      this.chrome.restoreTimePickerNav();
    }
  }

  setupEvents() {
    /*
     * Attach plugin event handlers.
     */
    this.events.on('refresh', this.onRefresh.bind(this));
    this.events.on('init-edit-mode', this.onInitEditMode.bind(this));
    this.events.on('data-received', this.onDataReceived.bind(this));
    this.events.on('panel-teardown', this.onPanelTeardown.bind(this));
    this.events.on('data-snapshot-load', this.onDataSnapshotLoad.bind(this));
  }

  setupMap() {
    /*
     * Setup the Leaflet map widget.
     */
    console.info('Setting up map');
    this.setMapProvider(this.contextSrv);
  }

  setMapProvider(contextSrv) {
    /*
     * Configure the Leaflet map widget.
     */
    this.tileServer = contextSrv.user.lightTheme ? 'CartoDB Positron' : 'CartoDB Dark';
    this.setMapSaturationClass();
  }

  setMapSaturationClass() {
    /*
     * Configure the Leaflet map widget.
     */
    if (this.tileServer === 'CartoDB Dark') {
      this.saturationClass = 'map-darken';
    } else {
      this.saturationClass = '';
    }
  }

  loadLocationData(reload?) {
    /*
     * Conditionally acquire location information from out-of-band data source.
     */

    if (this.map && !reload) {
      return;
    }

    // Load locations from snapshot.
    if (this.panel.snapshotLocationData) {
      this.locations = this.panel.snapshotLocationData;
      return;
    }

    try {
      this.core.acquireLocations();
    } catch (e) {
      this.errors.add(e, { domain: 'location' });
      this.setLocations();
    }
  }

  setLocations(res: any[] = []) {
    /*
     * Will be called when location information arrived.
     */
    console.info(`Setting ${res.length} locations`);
    this.locations = res;
    this.refreshSafe();
  }

  refreshSafe() {
    /*
     * Conditionally refresh the plugin, but not if it's still loading.
     */
    console.log('Still initializing:', this.initializing);
    if (!this.initializing) {
      this.refresh();
    }
  }

  onRefresh() {
    console.info('Refreshing panel. initializing=', this.initializing);
    this.errors.reset('data');

    if (!this.loading && !this.initializing && _.isEmpty(this.locations) && _.isEmpty(this.panel.snapshotLocationData)) {
      this.loadLocationData(true);
    }
  }

  onDataSnapshotLoad(snapshotData) {
    console.info('Received data from snapshot');
    this.onDataReceived(snapshotData);
  }

  onDataReceived(dataList) {
    /*
     * Obtain data from the Grafana data source,
     * decode appropriately and render the map.
     */
    console.info('Data received:', dataList);

    // Is this the right place to indicate the plugin has been initialized?
    this.initializing = false;

    try {
      if (this.dashboard.snapshot && this.locations) {
        this.panel.snapshotLocationData = this.locations;
      }

      this.processData(dataList);

      this.updateColorMode();

      const autoCenterMap = this.settings.mapCenter === 'First GeoHash' || this.settings.mapCenter === 'Last GeoHash' || this.settings.mapFitData;

      if (this.data.length && autoCenterMap) {
        this.updateMapCenter(false);
      }
    } catch (err) {
      this.errors.add(err, { domain: 'data' });
      appEvents.emit('alert-error', ['Data error', err.toString()]);
    } finally {
      // Propagate warnings and errors to tooltip in panel corner.
      this.propagateWarningsAndErrors();

      // Trigger the rendering process.
      this.render();
    }
  }

  processData(dataList) {
    /*
     * Decode data from the Grafana data source appropriately,
     * depending on the data format of the ingress data.
     */

    if (_.isEmpty(dataList)) {
      this.resetData();
      this.resetLocations();
      this.errors.add('No data received, please check data source and time range', { level: 'warning', domain: 'data' });
      return;
    }

    this.dataInfo = DataFormatter.analyzeData(dataList);
    console.info(`Received ${this.dataInfo.count} records in ${this.dataInfo.type} format`);

    // Save snapshot of locations.
    if (this.dashboard.snapshot && this.locations) {
      this.panel.snapshotLocationData = this.locations;
    }

    // Decode data coming from the primary data source according to its format and other parameters.
    try {
      const decodedData = this.core.decodeData(dataList, this.dataInfo.type);
      this.data = decodedData.data;
      if (decodedData.series) {
        this.series = decodedData.series;
      }
    } catch (ex) {
      //this.resetDataErrors();
      //this.resetLocationErrors();
      this.resetData();
      this.resetLocations();
      //this.render();
      throw ex;
    }
  }

  private adjustColorCount(target: any[]) {
    const targetSize = _.size(target) + 1; // +1 for catch-all case
    while (_.size(this.settings.colors) > targetSize) {
      // too many colors. remove the last one.
      this.settings.colors.pop();
    }
    while (_.size(this.settings.colors) < targetSize) {
      // not enough colors. add one.
      const newColor = 'rgba(50, 172, 45, 0.97)';
      this.settings.colors.push(newColor);
    }
  }

  updateThresholdData() {
    // FIXME: Isn't `this.data` actually an array?
    this.data.thresholds = this.settings.thresholds.split(',').map(strValue => {
      return Number(strValue.trim());
    });
    this.adjustColorCount(this.data.thresholds);
  }

  updateCategoricalData() {
    // FIXME: Isn't `this.data` actually an array?
    this.data.categories = this.settings.categories.split(',');
    this.adjustColorCount(this.data.categories);
  }

  updateColorMode() {
    switch (this.settings.colorMode) {
      case ColorModes.categories.id:
        this.updateCategoricalData();
        break;
      case ColorModes.threshold.id:
      default:
        // support existing legacy configurations (i.e. color mode is not set)
        this.updateThresholdData();
    }
  }

  onPanelTeardown() {
    this.teardownMap();
  }

  onInitEditMode() {
    this.addEditorTab('Worldmap', `public/plugins/${this.pluginId}/partials/editor.html`, 2);
  }

  propagateWarningsAndErrors() {
    /*
     * Propagate collected warnings and errors to tooltip in panel corner.
     * This is crucial for improved user-feedback when operating the
     * Worldmap Panel.
     *
     * This is a central place where the behavior can be relaxed in order
     * to display warning messages elsewhere in the future.
     *
     * Todo: Add a `suppressCornerWarnings` setting to improve flexibility.
     */

    // Effective list of warnings and errors from all error domains.
    const messages = this.errors.getMessages();

    // Update panel corner with error messages in the next event cycle.
    _.defer(this.chrome.updatePanelCorner.bind(this.chrome, messages));
  }

  link(scope, elem, attrs, ctrl) {
    let firstRender = true;

    ctrl.events.on('render', () => {
      render();
      ctrl.renderingCompleted();
    });

    function render() {
      if (!ctrl.data) {
        return;
      }

      // delay first render as the map panel sizing is bugged first render even though the element has correct height
      if (firstRender) {
        firstRender = false;
        setTimeout(render, 100);
        return;
      }

      const mapContainer = elem.find('.mapcontainer');

      if (mapContainer[0].id.indexOf('{{') > -1) {
        return;
      }

      if (!ctrl.map) {
        const map = new WorldMap(ctrl, mapContainer[0]);
        map.createMap();
        ctrl.map = map;
      }

      ctrl.map.resize();

      if (!ctrl.map.legend && ctrl.panel.showLegend) {
        ctrl.map.createLegend();
      }

      ctrl.map.drawCircles();

      if (ctrl.mapCenterMoved) {
        ctrl.map.panToMapCenter();
      }
    }
  }

  /* Data format indicators */
  // Todo: Refactor them to improved LocationType system, see `model.ts`.

  showTableOptions() {
    return _.startsWith(this.settings.locationData, 'table');
  }

  showTableGeohashOptions() {
    return this.showTableOptions() && this.settings.tableQueryOptions.queryType === 'geohash';
  }

  showTableCoordinateOptions() {
    return this.showTableOptions() && this.settings.tableQueryOptions.queryType === 'coordinates';
  }

  /* Data accessors */
  reset() {
    console.info('Resetting everything.');
    this.errors.resetAll();
    this.resetData();
    this.resetLocations();
  }

  resetData() {
    this.data = [];
    //this.mapCenterMoved = true;
  }

  resetLocations() {
    //console.log('resetLocations');
    this.locations = [];
    this.panel.snapshotLocationData = undefined;
  }

  /* Actions with rendering */

  reload() {
    this.reset();
    //this.refresh();
    this.loadLocationData(true);
  }

  reloadLocations() {
    this.errors.resetAll();
    this.resetLocations();
    this.loadLocationData(true);
  }

  restart() {
    this.teardownMap();
    this.render();
  }

  updateMapCenter(render = true) {
    // Signal `panToMapCenter()` and trigger rendering.
    this.mapCenterMoved = true;
    if (render) {
      this.render();
    }
  }

  teardownMap() {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  toggleLegend() {
    if (!this.settings.showLegend) {
      this.map.removeLegend();
    }
    this.render();
  }

  toggleMouseWheelZoom() {
    this.map.setMouseWheelZoom();
    this.render();
  }

  toggleDragging() {
    this.map.setDragging();
    this.render();
  }

  toggleDoubleClickZoom() {
    this.map.setDoubleClickZoom();
    this.render();
  }

  toggleCustomAttribution() {
    if (this.settings.customAttribution) {
      const attributionControl = this.map.map.attributionControl;

      // When switching on custom attributions and the text is
      // empty yet, use the value which is currently active.
      if (!this.panel.customAttributionText) {
        // Collect active attributions.
        const entries: any[] = [];
        for (const key in attributionControl._attributions) {
          entries.push(key);
        }

        // Store in custom text.
        this.panel.customAttributionText = entries.join(', ');
      }

      // Clear out builtin attributions.
      attributionControl._attributions = {};
      attributionControl._update();
      this.render();
    } else {
      // The operator wants vanilla attributions again, so let's start over.
      this.restart();
    }
  }

  redrawCircles() {
    this.map.clearCircles();
    this.render();
  }

  changeColorMode() {
    this.updateColorMode();
    this.map.legend.update();
    this.render();
  }

  /* Form choice accessors */

  // Todo: Refactor to `model.ts`.

  getLocationDataChoices() {
    return LocationSources;
  }

  getSelectedLocationType() {
    const locationSource: any = _.find(LocationSources, { id: this.settings.locationData });
    return locationSource.type ? locationSource.type.replace('Format: ', '') : undefined;
  }

  getSelectedLocationFormat() {
    const locationSource: any = _.find(LocationSources, { id: this.settings.locationData });
    if (_.isArray(locationSource.format)) {
      return locationSource.format.join(' or ');
    } else {
      return locationSource.format;
    }
  }

  getMapCenterChoices() {
    return MapCenters;
  }

  getColorModeChoices() {
    return ColorModes;
  }

  getSelectedMapCenter() {
    const mapCenter: any = _.find(MapCenters, { id: this.settings.mapCenter });
    return mapCenter && mapCenter.data;
  }
}
