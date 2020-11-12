import * as Cesium from 'cesium'
import { Movement } from '@bin/typings/Event'
import BasicGraphices from '@bin/base'
import merge from 'lodash.merge'
export default class Line extends BasicGraphices {
  dropPoint(event: Movement): void {
    this._dropPoint(event, this.createShape.bind(this))
  }

  playOff(): void {
    this._playOff(this.createShape.bind(this))
  }

  createShape(
    positions: Cesium.Cartesian3[] | Cesium.CallbackProperty,
    isDynamic = false
  ): Cesium.Entity {
    const polyline: Cesium.PolylineGraphics.ConstructorOptions = merge(
      {},
      isDynamic && !this.sameStyle ? this.dynamicOptions : this.options,
      { positions }
    )

    return new Cesium.Entity({ polyline })
  }
}
