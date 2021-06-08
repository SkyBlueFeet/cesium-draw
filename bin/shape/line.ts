import * as Cesium from 'cesium'
import { EventArgs } from '@bin/typings/Event'
import BasicGraphices from '@bin/base'
export default class Line extends BasicGraphices {
  dropPoint(event: EventArgs): void {
    this._dropPoint(event, this.createShape.bind(this))
  }

  playOff(): void {
    this._playOff(this.createShape.bind(this))
  }

  createShape(
    positions: Cesium.Cartesian3[] | Cesium.CallbackProperty,
    isDynamic = false
  ): Cesium.Entity {
    const polyline: Cesium.PolylineGraphics.ConstructorOptions = Object.assign(
      {},
      isDynamic && !this.sameStyle ? this.dynamicOptions : this.options,
      { positions }
    )

    return new Cesium.Entity({ polyline })
  }
}
