import { Movement } from '@bin/typings/Event'
import { Cartesian3, defined, Entity } from 'cesium'
import BasicGraphices, { LifeCycle } from '@bin/base'
import merge from 'lodash.merge'
export default class Point extends BasicGraphices implements LifeCycle {
  dropPoint(event: Movement): void {
    const earthPosition = this.pointer.calcPositions(event.position)

    if (defined(earthPosition))
      this.result = this.createDynamicShape(earthPosition)
  }

  moving(): void {
    return undefined
  }

  playOff(): void {
    this.pointer.reset()
    return undefined
  }

  createDynamicShape(position: Cartesian3): Entity {
    console.log(this.options)
    const point = merge({}, this.options)
    return new Entity({ position, point })
  }
}
