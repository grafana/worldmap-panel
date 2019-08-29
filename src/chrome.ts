import WorldmapCtrl from './worldmap_ctrl';
import * as _ from 'lodash';
import $ from 'jquery';

export class WorldmapChrome {
  settings: any;

  constructor(private ctrl: WorldmapCtrl) {
    this.settings = ctrl.settings;
  }

  updatePanelCorner(messages) {
    // Display multiple messages in panel corner.
    // Todo: Investigate whether it would be better to override `getInfoContent()` right away.
    // Todo: How to open the tooltip right away?

    if (_.isEmpty(messages)) {
      return;
    }
    const tooltipMessage = messages.join('\n');

    const _this = this;
    this.ctrl.$scope.$apply(() => {
      _this.ctrl.error = tooltipMessage;

      // Colorize the tooltip corner in a different color to indicate its not a native exception.
      // .panel-info-corner-inner » border-left-color
      const color = 'orange';
      _this.ctrl.$element.find('.panel-info-corner-inner').css({ 'border-left-color': color });

      // Failed attempt to colorize the drop content.
      // .drop-content » background-color + border-color
      //_this.ctrl.$element.find('.drop-content').css({'background-color': color, 'border-color': color});

      // Failed attempt to open the tooltip drop content right away.
      /*
      if (false) {
        const cornerInfoElem = _this.ctrl.$element.find('.panel-info-corner');
        console.log('cornerInfoElem:', cornerInfoElem);
        const drop = new Drop({target: cornerInfoElem[0]});
        //drop.open();
        drop.trigger('open');
      }
      */
    });
  }

  removeEscapeKeyBinding() {
    /*
     * Prevent navigation
     * - https://github.com/grafana/grafana/issues/11636
     * - https://github.com/grafana/grafana/issues/13706
     *
     * Embed entire dashboard
     * - https://github.com/grafana/grafana/issues/4757
     * - https://github.com/grafana/grafana/issues/10979
     * - https://github.com/grafana/grafana/issues/13493
     *
     * References
     * - https://github.com/grafana/grafana/blob/v6.1.6/public/app/core/services/keybindingSrv.ts
     * - https://github.com/grafana/grafana/blob/v6.1.6/public/app/plugins/datasource/grafana-azure-monitor-datasource/editor/query_field.tsx
     * - https://github.com/daq-tools/grafanimate/blob/0.5.5/grafanimate/grafana-studio.js
     *
     */
    this.getKeybindingSrv().unbind('esc', 'keydown');
  }

  restoreEscapeKeyBinding() {
    this.getKeybindingSrv().setupGlobal();
  }

  getKeybindingSrv() {
    const app = window['angular'].element('grafana-app');
    return app.injector().get('keybindingSrv');
  }

  removeTimePickerNav() {
    $('.gf-timepicker-nav').hide();
  }

  restoreTimePickerNav() {
    $('.gf-timepicker-nav').show();
  }
}
