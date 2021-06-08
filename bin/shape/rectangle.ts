import {
  Entity,
  CallbackProperty,
  Cartesian3,
  Rectangle as CesiumRectangle,
  JulianDate
} from 'cesium'
import BasicGraphices, { LifeCycle } from '@bin/base'
import { EventArgs } from '@bin/typings/Event'

export default class Rectangle extends BasicGraphices implements LifeCycle {
  dropPoint(move: EventArgs): void {
    this._dropPoint(move, this.createShape.bind(this))
  }

  playOff(): void {
    this._playOff(this.createShape.bind(this))
  }

  createShape(
    hierarchy: Cartesian3[] | CallbackProperty,
    isDynamic = false
  ): Entity {
    const target = Array.isArray(hierarchy)
      ? hierarchy
      : hierarchy.getValue(JulianDate.now())

    const rectangle = Object.assign(
      {},
      isDynamic && !this.sameStyle ? this.dynamicOptions : this.options,
      {
        coordinates: new CallbackProperty(function() {
          const obj = CesiumRectangle.fromCartesianArray(target)
          return obj
        }, false)
      }
    )

    return new Entity({ rectangle })
  }
}
