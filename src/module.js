import {WorldmapCtrl} from './worldmap_ctrl';
import {loadPluginCss} from 'app/plugins/sdk';

loadPluginCss({
  dark: 'plugins/grafana-worldmap-panel/css/worldmap.dark.css',
  light: 'plugins/grafana-worldmap-panel/css/worldmap.light.css'
});

export {
  WorldmapCtrl as PanelCtrl
};
