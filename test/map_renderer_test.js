import MapRenderer from 'src/map_renderer';

describe('GrafanaApp', () => {
  let directive;

  beforeEach(() => {
    directive = new MapRenderer();
  });

  it('can set defaults', () => {
    expect(directive).to.not.be(null);
  });
});