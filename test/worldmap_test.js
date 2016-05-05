import WorldMap from 'src/worldmap';

describe('when a Worldmap is created', () => {
  let worldMap;

  beforeEach(() => {
    const fixture = '<div class="mapcontainer"></div>';
    document.body.insertAdjacentHTML('afterbegin', fixture);

    const ctrl = {
      panel: {
        mapCenterLatitude: 0,
        mapCenterLongitude: 0,
        initialZoom: 1
      },
      tileServer: 'CartoDB Positron'
    };
    worldMap = new WorldMap(ctrl, document.getElementsByClassName('mapcontainer')[0]);
  });

  it('should add Leaflet to the map div', () => {
    expect(document.getElementsByClassName('leaflet-container')[0]).to.not.be(null);
  });
});