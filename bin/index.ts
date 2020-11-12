/* eslint-disable no-use-before-define */
/* eslint-disable @typescript-eslint/no-use-before-define */
import {
  Entity,
  Viewer,
  PointGraphics,
  PolylineGraphics,
  PolygonGraphics,
  Color,
  Cartesian3,
  Matrix4,
  EllipseGraphics,
  RectangleGraphics
} from 'cesium'

import Subscriber, { EventType } from '@bin/subscriber'
import { Movement } from '@bin/typings/Event'
import Painter from '@bin/painter'
import Polygon from '@bin/shape/polygon'
import Line from '@bin/shape/line'
import Point from '@bin/shape/point'
import merge from 'lodash.merge'
import Circle from '@bin/shape/circle'
import Rectangle from '@bin/shape/rectangle'

type OverrideEntities = (
  this: Draw,
  action: EventType,
  entity: Entity
) => Entity | void

export type Keyboard = {
  START?: EventType
  MOVING?: EventType
  END?: EventType
  DESTROY?: EventType
}

export type DrawCallback = (entity: Entity) => void

export type ActionCallback = (
  this: Draw,
  action: EventType,
  move: Movement
) => void

type Status = 'INIT' | 'START' | 'PAUSE' | 'DESTROY'

export interface DrawOption {
  viewer: Viewer
  terrain?: boolean
  keyboard?: Keyboard
  dynamicGraphicsOptions?: {
    POINT?: PointGraphics.ConstructorOptions
    LINE?: PolylineGraphics.ConstructorOptions
    POLYGON?: PolygonGraphics.ConstructorOptions
    CIRCLE?: EllipseGraphics.ConstructorOptions
    RECTANGLE?: RectangleGraphics.ConstructorOptions
  }
  action?: ActionCallback
  sameStyle?: boolean
}

type StartOption = {
  type: 'POLYGON' | 'LINE' | 'POINT' | 'CIRCLE' | 'RECTANGLE'
  once?: boolean
  oneInstance?: boolean
  options?: object
  dynamicOptions?: object
}

type Optional<T> = {
  [U in keyof T]?: T[U] extends object ? Optional<T[U]> : T[U]
}

const defaultOptions: Optional<DrawOption> = {
  terrain: false,
  keyboard: {
    START: 'LEFT_CLICK',
    MOVING: 'MOUSE_MOVE',
    END: 'RIGHT_CLICK',
    DESTROY: 'MIDDLE_CLICK'
  },
  dynamicGraphicsOptions: {
    LINE: {
      clampToGround: true,
      width: 4,
      material: Color.WHITE.withAlpha(0.4)
    },
    POLYGON: { material: Color.WHITE.withAlpha(0.4) },
    POINT: { color: Color.WHITE.withAlpha(0.4), pixelSize: 50 },
    RECTANGLE: { material: Color.WHITE.withAlpha(0.4) },
    CIRCLE: { material: Color.WHITE.withAlpha(0.4), outline: true }
  },
  sameStyle: true
}

export default class Draw {
  private _viewer: Viewer
  private _type: StartOption['type']
  private _terrain: boolean
  private _subscriber: Subscriber

  private _status: Status

  private _painter: Painter

  private _events: string[] = []

  private _typeClass: Line | Polygon | Point | Rectangle | Circle

  private _option: DrawOption

  private $Instance: Entity

  private _dynamicGraphicsOptions: DrawOption['dynamicGraphicsOptions']

  private dropPoint: (move: Movement) => void
  private moving: (move: Movement) => void
  private playOff: (move: Movement) => void

  private _keyboard: Keyboard

  private _action: ActionCallback

  private _sameStyle: boolean

  get status(): Status {
    return this._status
  }

  get isDestroy(): boolean {
    return this._status === 'DESTROY'
  }

  constructor(options: DrawOption) {
    if (!options.viewer) throw new Error('请输入Viewer对象！')

    this._option = merge({}, defaultOptions, options)
    this._keyboard = this._option.keyboard

    this._viewer = this._option.viewer
    this._terrain = this._option.terrain

    this._action = this._option.action

    this._dynamicGraphicsOptions = this._option.dynamicGraphicsOptions

    if (this._terrain && !this._viewer.scene.pickPositionSupported) {
      console.warn('This browser does not support pickPosition.')
      this._terrain = false
    }

    // this.initPainter();

    this._subscriber = new Subscriber(this._viewer)

    this._status = 'INIT'

    Object.keys(this._option.keyboard).forEach(key =>
      Subscriber.removeNative(this._viewer, this._option.keyboard[key])
    )

    // console.log(picker);

    // Zoom in to an area with mountains
    this.setCamera()

    this._subscriber.addExternal(() => {
      this.destroy()
    }, this._keyboard.DESTROY)
  }

  initPainter(
    config: StartOption,
    extraOptions?: object,
    dynamicOptions?: object
  ): void {
    const painterOptions = { viewer: this._viewer, terrain: this._terrain }

    this._painter = new Painter(painterOptions)

    this._type = config.type

    this._sameStyle = this._option.sameStyle

    const $flag = this._sameStyle
      ? false
      : merge({}, this._dynamicGraphicsOptions[this._type], dynamicOptions)

    const $options = extraOptions

    if (this._type === 'POLYGON') {
      this._typeClass = new Polygon(this._painter, $options, $flag)
    } else if (this._type === 'LINE') {
      this._typeClass = new Line(this._painter, $options, $flag)
    } else if (this._type === 'POINT') {
      this._typeClass = new Point(this._painter, $options)
    } else if (this._type === 'CIRCLE') {
      this._typeClass = new Circle(this._painter, $options, $flag)
    } else if (this._type === 'RECTANGLE') {
      this._typeClass = new Rectangle(this._painter, $options, $flag)
    } else {
      throw new Error(`the type '${this._type}' is not support`)
    }

    this.dropPoint = this._typeClass.dropPoint
    this.moving = this._typeClass.moving
    this.playOff = this._typeClass.playOff
  }

  start(config: StartOption, override?: OverrideEntities): void {
    this.initPainter(config, config.options, config.dynamicOptions)

    // this._typeClass.options = merge({}, options, this._typeClass.options);

    if (this._status === 'START') return

    this._status = 'START'

    let isStartDrow = false

    const startId = this._subscriber.addExternal(move => {
      isStartDrow = true

      this.dropPoint.call(this._typeClass, move)

      if (this._action) this._action(this._keyboard.START, move)

      // 如果是点，则此时执行点的结束绘制操作
      if (this._type !== 'POINT') return

      this.complete(override, config.once, config.oneInstance)

      isStartDrow = false
    }, this._keyboard.START)

    const moveId = this._subscriber.addExternal(move => {
      if (!isStartDrow) return

      this.moving.call(this._typeClass, move)

      // ActionCallback
      if (this._action) this._action('MOUSE_MOVE', move)
    }, 'MOUSE_MOVE')
    // Redraw the shape so it's not dynamic and remove the dynamic shape.

    const endId = this._subscriber.addExternal(move => {
      if (!isStartDrow) return

      // 结束绘制，确定实体
      this.playOff.call(this._typeClass, move)

      // ActionCallback
      if (this._action) this._action(this._keyboard.END, move)

      if (this._type === 'POINT') return

      this.complete(override, config.once, config.oneInstance)

      isStartDrow = false
    }, this._option.keyboard.END)

    this._events.push(startId, moveId, endId)
  }

  private setCamera(): void {
    this._viewer.camera.lookAt(
      Cartesian3.fromDegrees(-122.2058, 46.1955, 1000.0),
      new Cartesian3(5000.0, 5000.0, 5000.0)
    )
    this._viewer.camera.lookAtTransform(Matrix4.IDENTITY)
  }

  private complete(
    override: OverrideEntities,
    once: boolean,
    oneInstance: boolean
  ): void {
    // 如果是线和面，则此时将实例添加到Viewer中
    once && this.pause()

    if (oneInstance && this.$Instance) {
      this._viewer.entities.remove(this.$Instance)
    }

    if (typeof override === 'function') {
      this.$Instance = override.call(
        this,
        this._keyboard.END,
        this._typeClass.result
      )
    } else {
      this.$Instance = this._typeClass.result
    }

    if (this.$Instance) this._viewer.entities.add(this.$Instance)
  }

  pause(): void {
    this._status = 'PAUSE'
    this._subscriber.removeExternal(this._events)
    this._events = []
  }

  destroy(): void {
    this._status = 'DESTROY'
    this._subscriber.destroy()

    this._viewer = undefined
    this._type = undefined
    this._terrain = undefined
    this.pause = undefined
    this.start = undefined
    this.destroy = undefined
  }
}
