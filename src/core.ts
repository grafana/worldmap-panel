import $ from "jquery";
import * as _ from "lodash";
import WorldmapCtrl from "./worldmap_ctrl";
import DataFormatter, {DataFormat} from "./data_formatter";
import {ErrorManager} from "./errors";


export class WorldmapCore {
  /*
   * The core data plane and transformation machinery of the Grafana Worldmap Panel.
   *
   * It acquires and ingests information from data- and location-sources
   * and transforms and remixes them according to the selected data format
   * and mapping settings.
   *
   */

  settings: any;
  errors: ErrorManager;
  dataFormatter: DataFormatter;

  constructor(private ctrl: WorldmapCtrl) {
    this.settings = ctrl.settings;
    this.errors = ctrl.errors;
    this.dataFormatter = new DataFormatter(ctrl);
  }

  acquireLocations() {
    /*
     * Acquire location information from different sources.
     *
     * Essentially, this requests a JSON resource over HTTP, optionally using JSONP.
     * Either, it reaches out to a configured URL or it will use the builtin
     * JSON location sources like `countries.json` or `states.json`.
     *
     * In case of `locationData in ['table', 'geohash', 'json result']` this is
     * just a noop as location information is coming from the data source itself.
     */

    console.info('Acquiring location data');

    // Acquire locations by JSONP HTTP request.
    if (this.settings.locationData === "jsonp endpoint" || this.settings.locationData === "table+jsonp") {

      if (!this.settings.jsonpUrl || !this.settings.jsonpCallback) {
        throw new LocationError('Loading locations from JSONP endpoint requires URL and callback');
      }

      $.ajax({
        type: "GET",
        url: this.settings.jsonpUrl + "?callback=?",
        contentType: "application/json",
        jsonpCallback: this.settings.jsonpCallback,
        dataType: "jsonp",
        beforeSend: function (jqXHR, settings) {
          jqXHR.url = settings.url;
        },
      }).then(
        this.setLocations.bind(this),
        this.signalLocationRequestError.bind(this));

    // Acquire locations by JSON HTTP request.
    } else if (this.settings.locationData === "json endpoint" || this.settings.locationData === "table+json") {

      if (!this.settings.jsonUrl) {
        throw new LocationError('Loading locations from JSON endpoint requires URL');
      }

      // Use `$.ajax` over `$.getJSON` to unify error handling.
      $.ajax({
        dataType: "json",
        url: this.settings.jsonUrl,
        beforeSend: function (jqXHR, settings) {
          jqXHR.url = settings.url;
        },
      }).then(
        this.setLocations.bind(this),
        this.signalLocationRequestError.bind(this));

    // Locations are coming from data source itself, so this is a noop.
    } else if (_.includes(['table', 'geohash', 'json result'], this.settings.locationData)) {
      // Do nothing as location data is coming from the data source itself.
      this.setLocations();

    // Acquire locations from builtin JSON documents.
    } else if (this.settings.locationData) {

      // Compute URL to builtin JSON resource.
      const url =
        `public/plugins/${this.ctrl.pluginId}/data/` +
        this.settings.locationData +
        ".json";

      // Use `$.ajax` over `$.getJSON` to unify error handling.
      $.ajax({
        dataType: "json",
        url: url,
        beforeSend: function (jqXHR, settings) {
          jqXHR.url = settings.url;
        },
      }).then(
        this.setLocations.bind(this),
        this.signalLocationRequestError.bind(this));

    // Bail out if panel operator did not specify mapping yet.
    } else {
      throw new LocationError('Data format and location mapping not specified');
    }

  }

  setLocations(locations: any[] = []) {
    //console.log('Setting locations:', locations);
    this.ctrl.setLocations(locations);
  }

  decodeData(dataList, dataFormat) {
    /*
     * Decode data coming from the data source according to the designated
     * data format and mapping settings. This is the main workhorse as it
     * accounts for different types of ingress data.
     *
     * For interpreting the data appropriately, this dispatches to different
     * decoding flavors.
     *
     * 1. geohash
     *    - The data source can yield data in table or timeseries formats.
     *    - Location information is picked from database fields.
     *
     * 2. table format
     *    - The data source should yield data in table format.
     *    - Location information is picked from database fields.
     *
     * 3. json result
     *    - The data source must directly yield location information.
     *
     * 4. timeseries format (default)
     *    - The data source should yield data in timeseries format.
     *    - The metric name is used to lookup location information from
     *      an out-of-band location source.
     */

    const data = [];
    let series;

    if (this.settings.locationData === "geohash") {
      console.info('Interpreting data as table or timeseries format');
      this.dataFormatter.setGeohashValues(dataList, data);

    // Todo: Get rid of `showTableOptions()` by refactoring the format/mapping type subsystem.
    } else if (this.ctrl.showTableOptions()) {
      this.assertDataFormat(dataFormat === DataFormat.Table, dataFormat, DataFormat.Table);
      console.info('Interpreting data as table format');
      const tableData = dataList.map(DataFormatter.tableHandler.bind(this));
      this.dataFormatter.setTableValues(tableData, data);

    } else if (this.settings.locationData === "json result") {
      this.assertDataFormat(dataFormat !== 'table', dataFormat,'JSON');
      console.info('Interpreting data as JSON format');
      // Todo: Don't misuse `this.series` for this as it is a completely different format.
      //  Better pass the payload to `setJsonValues()` like seen with `setTableValues()`.
      series = dataList;
      this.dataFormatter.setJsonValues(data);

    } else if (this.settings.locationData) {
      this.assertDataFormat(dataFormat === DataFormat.Timeseries, dataFormat, DataFormat.Timeseries);
      console.info('Interpreting data as timeseries format');
      series = dataList.map(this.dataFormatter.seriesHandler.bind(this));
      this.dataFormatter.setTimeseriesValues(series, data);

    } else {
      throw new DataError('No data format and mapping selected');
    }

    return {
      data: data,
      series: series,
    };

  }

  getMapDimensions() {
    /*
     * Compute optimal map center and zoom level
     * based on data and settings.
     */

    const center: any = {
      mapFitData: this.settings.mapFitData,
      mapCenter: this.settings.mapCenter,
      mapCenterLatitude: this.settings.mapCenterLatitude,
      mapCenterLongitude: this.settings.mapCenterLongitude,
      mapZoomLevel: this.settings.initialZoom,
      mapZoomByRadius: this.settings.mapZoomByRadius,
    };

    const mapCenter = this.ctrl.getSelectedMapCenter();

    if (this.ctrl.data.length && this.settings.mapCenter === "First GeoHash") {
      const first: any = _.first(this.ctrl.data);
      center.mapCenterLatitude = first.locationLatitude;
      center.mapCenterLongitude = first.locationLongitude;

    } else if (this.ctrl.data.length && this.settings.mapCenter === "Last GeoHash") {
      const last: any = _.last(this.ctrl.data);
      center.mapCenterLatitude = last.locationLatitude;
      center.mapCenterLongitude = last.locationLongitude;

    } else if (mapCenter) {
      center.mapCenterLatitude = mapCenter.mapCenterLatitude;
      center.mapCenterLongitude = mapCenter.mapCenterLongitude;
      center.mapZoomLevel = this.settings.initialZoom || mapCenter.initialZoom;
    }

    // Convert scalar types and apply reasonable defaults.
    center.mapCenterLatitude = parseFloat(center.mapCenterLatitude);
    center.mapCenterLongitude = parseFloat(center.mapCenterLongitude);
    center.mapZoomLevel = parseInt(center.mapZoomLevel) || 1;
    center.mapZoomByRadius = parseFloat(center.mapZoomByRadius) || null;

    return center;
  }

  assertDataFormat(condition, dataFormatIs, dataFormatShould) {
    /*
     * Sanity check the ingress data format against the designated
     * data format and emit appropriate error signal on mismatch
     * after clearing the location information.
     */
    if (!condition) {
      this.ctrl.resetLocations();   // Todo: Really?
      this.ctrl.render();
      const message = this.getDataFormatMismatchMessage(dataFormatIs, dataFormatShould);
      throw new DataError(message);
    }
  }

  getDataFormatMismatchMessage(dataFormatIs, dataFormatShould): any {
    const message =
      `Format mismatch: ${dataFormatIs} data ` +
      `can not be interpreted as ${dataFormatShould} format`;
    return message;
  }

  signalLocationError(message) {
    this.errors.add(message, {domain: 'location'});
    this.setLocations();
  }

  signalLocationRequestError(jqXHR, textStatus, errorThrown) {
    const message =
      `Unable to load locations in JSON format from "${jqXHR.url}".\n` +
      `The response status was "${jqXHR.status} ${jqXHR.statusText}"`;
    this.signalLocationError(message);
  }

}


export class DataError extends Error {
  constructor(public message: string) {
    super(message);
    this.name = 'DataError';
  }
}


export class LocationError extends Error {
  constructor(public message: string) {
    super(message);
    this.name = 'LocationError';
  }
}


export class MappingError extends Error {
  constructor(public message: string) {
    super(message);
    this.name = 'MappingError';
  }
}
