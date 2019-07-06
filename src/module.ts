/* eslint import/no-extraneous-dependencies: 0 */
import {loadPluginCss} from 'grafana/app/plugins/sdk';
import WorldmapCtrl from './worldmap_ctrl';

loadPluginCss({
  dark: 'plugins/grafana-worldmap-panel/styles/dark.css',
  light: 'plugins/grafana-worldmap-panel/styles/light.css',
});

export {
  WorldmapCtrl as PanelCtrl
};
