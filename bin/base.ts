import { Entity, Cartesian3, CallbackProperty, defined } from 'cesium'
import Painter from '@bin/painter'
import { EventArgs } from '@bin/typings/Event'

export interface LifeCycle {
  dropPoint?(move: EventArgs): void
  moving?(move: EventArgs): void
  playOff?(move: EventArgs): void
  createShape?: Function
}

export default class BasicGraphices {
  result: Entity
  pointer: Painter
  _terrain: boolean
  options: object

  dynamicOptions: object = {}
  sameStyle: boolean

  constructor(painter: Painter, options: object = {}, flag?: object | true) {
    this.pointer = painter
    this._terrain = painter._terrain
    this.options = options

    this.dynamicOptions = typeof flag === 'object' ? flag : {}
    this.sameStyle = typeof flag === 'boolean' ? flag : false
  }

  protected _dropPoint(move: EventArgs, createShape: Function): void {
    const earthPosition = this.pointer.pickCartesian3(move.position)

    if (!defined(earthPosition)) return

    if (!this.pointer._activeShapePoints.length) {
      this.dynamicUpdate(earthPosition, createShape)
    }

    this.SetBreakpoint(earthPosition)
  }

  moving(event: EventArgs): void {
    this._moving(event)
  }

  protected _moving(event: EventArgs, createShape?: Function): void {
    const earthPosition = this.pointer.pickCartesian3(event.endPosition)
    if (defined(earthPosition)) {
      this.pointer._activeShapePoints.pop()
      this.pointer._activeShapePoints.push(earthPosition)
    }
  }

  protected _playOff(createShape: Function): void {
    this.pointer._activeShapePoints.pop()

    this.result = createShape(this.pointer._activeShapePoints)

    this.pointer.reset()
  }

  SetBreakpoint(earthPosition: Cartesian3): void {
    this.pointer._activeShapePoints.push(earthPosition)

    const $point = this.pointer.createPoint(earthPosition)

    this.pointer._breakPointEntities.push($point)

    this.pointer.addView($point)
  }

  dynamicUpdate(earthPosition: Cartesian3, createShape: Function): void {
    this.pointer._activeShapePoints.push(earthPosition)

    // 将动态绘制的图形加入Viewer
    const dynamicPositions = new CallbackProperty(() => {
      return this.pointer._activeShapePoints
    }, false)

    this.pointer._dynamicShapeEntity = createShape(dynamicPositions, true)
    this.pointer.addView(this.pointer._dynamicShapeEntity)
    return undefined
  }
}
