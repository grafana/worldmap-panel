import DataBuilder from '../test/data_builder';
import { createBasicMap } from '../test/map_builder';
import $ from 'jquery';
import PluginSettings from './settings';
import { TemplateSrv } from 'grafana/app/features/templating/template_srv';
import DataFormatter from './data_formatter';

describe('Worldmap', () => {
  let worldMap;
  let ctrl;

  beforeEach(() => {
    worldMap = createBasicMap();
    ctrl = worldMap.ctrl;
    worldMap.createMap();
  });

  afterEach(() => {
    const fixture: HTMLElement = document.getElementById('fixture')!;
    document.body.removeChild(fixture);
  });

  describe('when a Worldmap is created', () => {
    it('should add Leaflet to the map div', () => {
      expect(document.getElementsByClassName('leaflet-container')[0]).not.toBe(null);
    });
  });

  describe('when the data has one point', () => {
    beforeEach(() => {
      ctrl.data = new DataBuilder()
        .withCountryAndValue('SE', 1)
        .withDataRange(1, 1, 0)
        .build();
      ctrl.panel.circleMaxSize = '10';
      worldMap.drawCircles();
    });

    it('should draw one circle on the map', () => {
      expect(worldMap.circles.length).toBe(1);
      expect(worldMap.circles[0]._latlng.lat).toBe(60);
      expect(worldMap.circles[0]._latlng.lng).toBe(18);
    });

    it('should create a circle with max circle size', () => {
      expect(worldMap.circles[0].options.radius).toBe(10);
    });

    it('should create a circle popup with the data point value', () => {
      expect(worldMap.circles[0]._popup._content).toBe('Sweden: 1');
    });
  });

  describe('when the data has two points', () => {
    beforeEach(() => {
      ctrl.data = new DataBuilder()
        .withCountryAndValue('SE', 1)
        .withCountryAndValue('IE', 2)
        .withDataRange(1, 2, 1)
        .build();
      ctrl.panel.circleMinSize = '2';
      ctrl.panel.circleMaxSize = '10';
      worldMap.drawCircles();
    });

    it('should draw two circles on the map', () => {
      expect(worldMap.circles.length).toBe(2);
    });

    it('should create a circle with min circle size for smallest value size', () => {
      expect(worldMap.circles[0].options.radius).toBe(2);
    });

    it('should create a circle with max circle size for largest value size', () => {
      expect(worldMap.circles[1].options.radius).toBe(10);
    });

    it('should create two circle popups with the data point values', () => {
      expect(worldMap.circles[0]._popup._content).toBe('Sweden: 1');
      expect(worldMap.circles[1]._popup._content).toBe('Ireland: 2');
    });
  });

  describe('when units option is set', () => {
    beforeEach(() => {
      ctrl.data = new DataBuilder()
        .withCountryAndValue('SE', 1)
        .withCountryAndValue('IE', 2)
        .withDataRange(1, 2, 1)
        .build();
      ctrl.panel.circleMinSize = '2';
      ctrl.panel.circleMaxSize = '10';
      ctrl.panel.unitSingular = 'error';
      ctrl.panel.unitPlural = 'errors';
      worldMap.drawCircles();
    });

    it('should create a circle popup using the singular unit in the label', () => {
      expect(worldMap.circles[0]._popup._content).toBe('Sweden: 1 error');
    });

    it('should create a circle popup using the plural unit in the label', () => {
      expect(worldMap.circles[1]._popup._content).toBe('Ireland: 2 errors');
    });
  });

  describe('when the data has three points', () => {
    beforeEach(() => {
      ctrl.data = new DataBuilder()
        .withCountryAndValue('SE', 1)
        .withCountryAndValue('IE', 2)
        .withCountryAndValue('US', 3)
        .withDataRange(1, 3, 2)
        .withThresholdValues([2])
        .build();
      ctrl.panel.circleMinSize = '2';
      ctrl.panel.circleMaxSize = '10';
      worldMap.drawCircles();
    });

    it('should draw three circles on the map', () => {
      expect(worldMap.circles.length).toBe(3);
    });

    it('should create a circle with min circle size for smallest value size', () => {
      expect(worldMap.circles[0].options.radius).toBe(2);
    });

    it('should create a circle with circle size 6 for mid value size', () => {
      expect(worldMap.circles[1].options.radius).toBe(6);
    });

    it('should create a circle with max circle size for largest value size', () => {
      expect(worldMap.circles[2].options.radius).toBe(10);
    });

    it('should set red color on values under threshold', () => {
      expect(worldMap.circles[0].options.color).toBe('red');
    });

    it('should set blue color on values equal to or over threshold', () => {
      expect(worldMap.circles[1].options.color).toBe('blue');
      expect(worldMap.circles[2].options.color).toBe('blue');
    });

    it('should create three circle popups with the data point values', () => {
      expect(worldMap.circles[0]._popup._content).toBe('Sweden: 1');
      expect(worldMap.circles[1]._popup._content).toBe('Ireland: 2');
      expect(worldMap.circles[2]._popup._content).toBe('United States: 3');
    });
  });

  describe('when the data has empty values and hideEmpty is true', () => {
    beforeEach(() => {
      ctrl.data = new DataBuilder()
        .withCountryAndValue('SE', 1)
        .withCountryAndValue('IE', 2)
        .withCountryAndValue('US', null)
        .withDataRange(1, 3, 2)
        .withThresholdValues([2])
        .build();
      ctrl.panel.hideEmpty = true;
      worldMap.drawCircles();
    });

    it('should draw three circles on the map', () => {
      expect(worldMap.circles.length).toBe(2);
    });
  });

  describe('when the data has empty values and hideEmpty is true', () => {
    beforeEach(() => {
      ctrl.data = new DataBuilder()
        .withCountryAndValue('SE', 1)
        .withCountryAndValue('IE', 2)
        .withCountryAndValue('US', 0)
        .withDataRange(1, 3, 2)
        .withThresholdValues([2])
        .build();
      ctrl.panel.hideZero = true;
      worldMap.drawCircles();
    });

    it('should draw three circles on the map', () => {
      expect(worldMap.circles.length).toBe(2);
    });
  });

  describe('when the data is updated but not locations', () => {
    beforeEach(() => {
      ctrl.panel.circleMinSize = '2';
      ctrl.panel.circleMaxSize = '10';

      ctrl.data = new DataBuilder()
        .withCountryAndValue('SE', 1)
        .withCountryAndValue('IE', 2)
        .withCountryAndValue('US', 3)
        .withDataRange(1, 3, 2)
        .withThresholdValues([2])
        .build();

      worldMap.drawCircles();

      ctrl.data = new DataBuilder()
        .withCountryAndValue('SE', 3)
        .withCountryAndValue('IE', 2)
        .withCountryAndValue('US', 1)
        .withDataRange(1, 3, 2)
        .withThresholdValues([2])
        .build();

      worldMap.drawCircles();
    });

    it('should create three circle popups with updated data', () => {
      expect(worldMap.circles[0]._popup._content).toBe('Sweden: 3');
      expect(worldMap.circles[1]._popup._content).toBe('Ireland: 2');
      expect(worldMap.circles[2]._popup._content).toBe('United States: 1');
    });

    it('should set red color on values under threshold', () => {
      expect(worldMap.circles[2].options.color).toBe('red');
    });

    it('should set blue color on values equal to or over threshold', () => {
      expect(worldMap.circles[0].options.color).toBe('blue');
      expect(worldMap.circles[1].options.color).toBe('blue');
    });
  });

  describe('when the number of locations changes', () => {
    beforeEach(() => {
      ctrl.panel.circleMinSize = '2';
      ctrl.panel.circleMaxSize = '10';

      ctrl.data = new DataBuilder()
        .withCountryAndValue('SE', 1)
        .withCountryAndValue('IE', 2)
        .withCountryAndValue('US', 3)
        .withDataRange(1, 3, 2)
        .withThresholdValues([2])
        .build();

      worldMap.drawCircles();

      ctrl.data = new DataBuilder()
        .withCountryAndValue('SE', 2)
        .withDataRange(1, 1, 0)
        .withThresholdValues([2])
        .build();

      worldMap.drawCircles();
    });

    it('should create one circle popups with updated data', () => {
      expect(worldMap.circles[0]._popup._content).toBe('Sweden: 2');
    });

    it('should set blue color on values equal to or over threshold', () => {
      expect(worldMap.circles[0].options.color).toBe('blue');
    });
  });

  describe('when one threshold is set', () => {
    beforeEach(() => {
      ctrl.data = new DataBuilder().withThresholdValues([2]).build();
      worldMap.createLegend();
    });

    it('should create a legend with two legend values', () => {
      expect(worldMap.legend).toBeDefined();
      expect(worldMap.legend._div.outerHTML).toBe(
        '<div class="info legend leaflet-control">' +
          '<div class="legend-item">' +
          '<i style="background:red"></i> &lt; 2</div><div class="legend-item"><i style="background:blue"></i> 2+</div>' +
          '</div>'
      );
    });
  });

  describe('when legend removed', () => {
    beforeEach(() => {
      ctrl.data = new DataBuilder().withThresholdValues([2]).build();
      worldMap.createLegend();
      worldMap.removeLegend();
    });

    it('should remove the legend from the worldmap', () => {
      expect(worldMap.legend).toBe(null);
    });
  });

  describe('when two thresholds are set', () => {
    beforeEach(() => {
      ctrl.data = new DataBuilder().withThresholdValues([2, 4]).build();
      worldMap.createLegend();
    });

    it('should create a legend with three legend values', () => {
      expect(worldMap.legend).toBeDefined();
      expect(worldMap.legend._div.outerHTML).toBe(
        '<div class="info legend leaflet-control"><div class="legend-item">' +
          '<i style="background:red"></i> &lt; 2</div><div class="legend-item"><i style="background:blue"></i> 2–4</div>' +
          '<div class="legend-item"><i style="background:green"></i> 4+</div></div>'
      );
    });
  });

  describe('when three thresholds are set', () => {
    beforeEach(() => {
      ctrl.data = new DataBuilder().withThresholdValues([2, 4, 6]).build();
      worldMap.createLegend();
    });

    it('should create a legend with four legend values', () => {
      expect(worldMap.legend).toBeDefined();
      expect(worldMap.legend._div.outerHTML).toBe(
        '<div class="info legend leaflet-control"><div class="legend-item">' +
          '<i style="background:red"></i> &lt; 2</div><div class="legend-item"><i style="background:blue"></i> 2–4</div>' +
          '<div class="legend-item"><i style="background:green"></i> 4–6</div>' +
          '<div class="legend-item"><i style="background:undefined"></i> 6+</div></div>'
      );
    });
  });

  describe('when the legend should be displayed out-of-band', () => {
    /*
     * Optimizations for small maps
     *
     * In order to test the `createMap()` method,
     * we need to pass a half-configured `WorldMap`
     * instance into the test cases.
     *
     * We are testing the "legendContainerSelector" and "showAttribution"
     * options here to proof they actually toggle the visibility
     * of the respective control elements.
     *
     * See also https://community.hiveeyes.org/t/grafana-worldmap-panel-ng/1824/3
     */
    beforeEach(() => {
      ctrl.data = new DataBuilder().withThresholdValues([2, 4, 6]).build();
      ctrl.panel.legendContainerSelector = '.shared-map-legend';
      document.body.insertAdjacentHTML('afterbegin', '<div class="shared-map-legend"></div>');
      worldMap.createLegend();
    });

    it('we should find the respective element at the appropriate place in the DOM', () => {
      expect(worldMap.legend).toBeDefined();
      expect($('.shared-map-legend')[0].innerHTML).toBe(
        '<div class="info legend leaflet-control"><div class="legend-item">' +
          '<i style="background:red"></i> &lt; 2</div><div class="legend-item"><i style="background:blue"></i> 2–4</div>' +
          '<div class="legend-item"><i style="background:green"></i> 4–6</div>' +
          '<div class="legend-item"><i style="background:undefined"></i> 6+</div></div>'
      );
    });
  });

  describe('when the data has two points at the same spot', () => {
    beforeEach(() => {
      ctrl.data = new DataBuilder()
        .withCountryAndValue('SE', 1)
        .withCountryAndValue('SE', 2)
        .build();
      worldMap.drawCircles();
    });

    it('should draw just one circle on the map', () => {
      expect(worldMap.circles.length).toBe(1);
    });

    it('should create a single circle popup with both data point values', () => {
      expect(worldMap.circles[0]._popup._content).toBe('Sweden: 1\nSweden: 2');
    });
  });

  describe('when the data is updated with two points at the same spot', () => {
    beforeEach(() => {
      ctrl.data = new DataBuilder()
        .withCountryAndValue('SE', 1)
        .withCountryAndValue('IE', 1)
        .build();
      worldMap.drawCircles();

      ctrl.data = new DataBuilder()
        .withCountryAndValue('SE', 1)
        .withCountryAndValue('IE', 1)
        .withCountryAndValue('SE', 2)
        .build();
      worldMap.drawCircles();
    });

    it('should draw just one circle on the map', () => {
      expect(worldMap.circles.length).toBe(2);
    });

    it('should create a single circle popup with both data point values', () => {
      expect(worldMap.circles[0]._popup._content).toBe('Sweden: 1\nSweden: 2');
    });
  });
});

describe('WorldmapFoundation', () => {
  /*
   * In order to individually configure the map before the `createMap()`
   * method will be invoked, we need to pass a half-configured `WorldMap`
   * instance into the test cases.
   *
   * We are testing the "showZoomControl" and "showAttribution"
   * options here to proof they actually toggle the visibility
   * of the respective control elements. These have been introduced
   * to optimize Worldmap for small maps.
   *
   * See also https://community.hiveeyes.org/t/grafana-worldmap-panel-ng/1824/3
   */

  let worldMap;
  let ctrl;

  beforeEach(() => {
    worldMap = createBasicMap();
    ctrl = worldMap.ctrl;
  });

  afterEach(() => {
    const fixture: HTMLElement = document.getElementById('fixture')!;
    document.body.removeChild(fixture);
  });

  describe('when a Worldmap is created with default parameters', () => {
    beforeEach(() => {
      worldMap.createMap();
    });

    it('all control elements should be present', () => {
      expect(document.getElementsByClassName('leaflet-container')[0]).toBeDefined();
      expect(document.getElementsByClassName('leaflet-control-zoom')[0]).toBeDefined();
      expect(document.getElementsByClassName('leaflet-control-attribution')[0]).toBeDefined();
    });
  });

  describe('when a Worldmap is created with showZoomControl disabled', () => {
    beforeEach(() => {
      ctrl.panel.showZoomControl = false;
      worldMap.createMap();
    });

    it('the element should not be present in DOM', () => {
      expect(document.getElementsByClassName('leaflet-control-zoom')[0]).toBeUndefined();
    });
  });

  describe('when a Worldmap is created with showAttribution disabled', () => {
    beforeEach(() => {
      ctrl.panel.showAttribution = false;
      worldMap.createMap();
    });

    it('the element should not be present in DOM', () => {
      expect(document.getElementsByClassName('leaflet-control-attribution')[0]).toBeUndefined();
    });
  });
});

function setupInteractionMocks() {
  // Setup interaction mock for "window.location.assign".
  // https://remarkablemark.org/blog/2018/11/17/mock-window-location/
  Object.defineProperty(window.location, 'assign', {
    configurable: true,
  });
  window.location.assign = jest.fn();

  // Setup interaction mock for "window.open".
  Object.defineProperty(window, 'open', {
    configurable: true,
  });
  window.open = jest.fn();
}

describe('ClickthroughLinks', () => {
  /*
   * These tests proof that "clickthrough links" work.
   *
   * See also https://community.hiveeyes.org/t/developing-grafana-worldmap-ng/1824/13
   */

  let worldMap;
  let ctrl;

  // https://github.com/grafana/grafana/blob/v6.5.2/public/app/plugins/datasource/loki/datasource.test.ts#L28-L31
  // https://github.com/grafana/grafana/blob/v6.5.2/public/app/features/templating/template_srv.ts#L261
  const variableRegex = /\$(\w+)|\[\[([\s\S]+?)(?::(\w+))?\]\]|\${(\w+)(?:\.([^:^\}]+))?(?::(\w+))?}/g;
  const templateSrvMock = ({
    getAdhocFilters: (): any[] => [],
    replace: (target: any, scopedVars?: any, format?: any) => {
      return target.replace(variableRegex, (match, var1, var2, fmt2, var3, fieldPath, fmt3) => {
        const variableName = var1 || var2 || var3;
        if (scopedVars[variableName]) {
          const value = scopedVars[variableName].value;
          if (value !== null && value !== undefined) {
            return value;
          }
        }
      });
    },
  } as unknown) as TemplateSrv;

  beforeEach(() => {
    worldMap = createBasicMap();
    ctrl = worldMap.ctrl;
    //ctrl.loadSettings();
  });

  afterEach(() => {
    const fixture: HTMLElement = document.getElementById('fixture')!;
    document.body.removeChild(fixture);
  });

  describe('when a Worldmap is created with clickthrough-links enabled', () => {
    beforeEach(() => {
      // Create map.
      ctrl.panel.clickthroughUrl = 'http://foo.bar';
      ctrl.settings = new PluginSettings(ctrl.panel, templateSrvMock, {});
      worldMap.createMap();

      // Load data and draw circles.
      ctrl.data = new DataBuilder().withCountryAndValue('SE', 1).build();
      worldMap.drawCircles();
    });

    it('should have registered a second click event', () => {
      expect(worldMap.circles.length).toBe(1);
      expect(worldMap.circles[0]._events.click.length).toBe(2);
    });

    it('should do its job when actually clicked', () => {
      // Prepare interaction with window object.
      setupInteractionMocks();

      // Capture interaction.
      worldMap.circles[0].fire('click');
      expect(window.location.assign).toHaveBeenCalledWith('http://foo.bar');
    });
  });

  describe('when a Worldmap is created with clickthrough-links enabled to another window', () => {
    beforeEach(() => {
      // Create map.
      ctrl.panel.clickthroughUrl = 'http://foo.bar';
      ctrl.panel.clickthroughOptions = { windowName: 'test' };
      ctrl.settings = new PluginSettings(ctrl.panel, templateSrvMock, {});
      worldMap.createMap();

      // Load data and draw circles.
      ctrl.data = new DataBuilder().withCountryAndValue('SE', 1).build();
      worldMap.drawCircles();
    });

    it('should have registered a second click event', () => {
      expect(worldMap.circles.length).toBe(1);
      expect(worldMap.circles[0]._events.click.length).toBe(2);
    });

    it('should do its job when actually clicked', () => {
      // Prepare interaction with window object.
      setupInteractionMocks();

      // Capture interaction.
      worldMap.circles[0].fire('click');
      expect(window.open).toHaveBeenCalledWith('http://foo.bar', 'test');
    });
  });

  describe('when using fields with clickthrough-links on table data', () => {
    beforeEach(() => {
      // Create map.
      ctrl.panel.clickthroughUrl = 'http://foo.bar/?foo=$__field_foo&value=$value';

      ctrl.panel.tableQueryOptions = {
        queryType: 'coordinates',
        latitudeField: 'latitude',
        longitudeField: 'longitude',
        metricField: 'metric',
        labelField: 'name',
        labelLocationKeyField: 'key',
        linkField: null,
      };

      // Load settings and create map.
      ctrl.settings = new PluginSettings(ctrl.panel, templateSrvMock, {});
      worldMap.createMap();

      // Define fixture.
      const tableData = [
        [
          {
            key: 'SE',
            name: 'Sweden',
            latitude: 60,
            longitude: 18,
            metric: 123.456,

            foo: '42.42',
            bar: 42.42,
          },
          {
            key: 'IE',
            name: 'Ireland',
            latitude: 53,
            longitude: 8,
            metric: 45.678,

            foo: '43.43',
            bar: 43.43,
          },
        ],
      ];

      // Apply data as table format.
      const dataFormatter = new DataFormatter(ctrl);
      const data: any[] = [];
      dataFormatter.setTableValues(tableData, data);
      data.thresholds = [];

      // Draw circles.
      ctrl.data = data;
      worldMap.drawCircles();
    });

    it('the fields within transformed data should interpolate well into clickthrough links', () => {
      // Prepare interaction with window object.
      setupInteractionMocks();

      // Capture interaction.
      worldMap.circles[0].fire('click');
      expect(window.location.assign).toHaveBeenCalledWith('http://foo.bar/?foo=42.42&value=123.456');
    });
  });
});
