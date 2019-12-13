import WorldMap from "../src/worldmap";

export function createBasicMap() {
  const fixture = '<div id="fixture" class="mapcontainer"></div>';
  document.body.insertAdjacentHTML('afterbegin', fixture);

  let ctrl = {
    panel: {
      center: {
        mapCenterLatitude: 0,
        mapCenterLongitude: 0,
        initialZoom: 1,
      },
      colors: ['red', 'blue', 'green'],
      circleOptions: {},
      showZoomControl: true,
      showAttribution: true,
    },
    tileServer: 'CartoDB Positron',
  };

  // This mimics the `ctrl.panel` proxying established
  // by `PluginSettings` to make the tests happy.
  // Todo: Don't worry, this will go away.
  ctrl.settings = ctrl.panel;

  const worldMap = new WorldMap(ctrl, document.getElementsByClassName('mapcontainer')[0]);

  return worldMap;

}
