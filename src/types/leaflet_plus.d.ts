import 'leaflet';
import { DivOverlay, DivOverlayOptions } from 'leaflet';

declare module 'leaflet' {
  /**
   * Merge some additional declarations into Leaflet.
   *
   * https://www.typescriptlang.org/docs/handbook/declaration-merging.html
   *
   */
  export interface PopupOptions extends DivOverlayOptions {
    // @option autoWidth: Boolean = true
    // Set it to `false` if you don't want to compute
    // and set the width of a opened popup automatically.
    autoWidth?: boolean;
  }
  export interface Popup extends DivOverlay {
    _contentNode: HTMLElement;
    _container: HTMLElement;
    _containerWidth: number;
    _initLayout(): void;
    _updateLayout(): void;
  }
}
