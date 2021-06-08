import { EventArgs } from '@bin/typings/Event'
import { Cartesian3, defined, Entity } from 'cesium'
import BasicGraphices, { LifeCycle } from '@bin/base'

export default class Point extends BasicGraphices implements LifeCycle {
  dropPoint(event: EventArgs): void {
    const earthPosition = this.pointer.pickCartesian3(event.position)

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
    const point = Object.assign({}, this.options)
    return new Entity({ position, point })
  }
}
