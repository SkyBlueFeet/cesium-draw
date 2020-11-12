import BasicGraphices, { LifeCycle } from '@bin/base'
import { Movement } from '@bin/typings/Event'
import { CallbackProperty, Entity, Cartesian3, JulianDate } from 'cesium'

import merge from 'lodash.merge'

export default class Circle extends BasicGraphices implements LifeCycle {
  dropPoint(move: Movement): void {
    this._dropPoint(move, this.createShape.bind(this))
  }

  playOff(): void {
    this._playOff(this.createShape.bind(this))
  }

  createShape(
    hierarchy: Cartesian3[] | CallbackProperty,
    isDynamic = false
  ): Entity {
    const target: Cartesian3[] = Array.isArray(hierarchy)
      ? hierarchy
      : hierarchy.getValue(JulianDate.now())

    const ellipse = merge(
      {},
      isDynamic && !this.sameStyle ? this.dynamicOptions : this.options,
      {
        semiMinorAxis: new CallbackProperty(function() {
          // 半径 两点间距离
          const radius = Math.sqrt(
            Math.pow(target[0].x - target[target.length - 1].x, 2) +
              Math.pow(target[0].y - target[target.length - 1].y, 2)
          )
          return radius || radius + 1
        }, false),
        semiMajorAxis: new CallbackProperty(function() {
          const radius = Math.sqrt(
            Math.pow(target[0].x - target[target.length - 1].x, 2) +
              Math.pow(target[0].y - target[target.length - 1].y, 2)
          )
          return radius || radius + 1
        }, false)
      }
    )

    const position = this.pointer._activeShapePoints[0]

    return new Entity({ position, ellipse })
  }
}
