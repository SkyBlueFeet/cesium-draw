/* eslint-disable no-use-before-define */
/* eslint-disable @typescript-eslint/no-use-before-define */
import {
  Entity,
  Viewer,
  PointGraphics,
  PolylineGraphics,
  PolygonGraphics,
  Color,
  EllipseGraphics,
  RectangleGraphics,
  defaultValue,
  clone
} from 'cesium'

import Subscriber, { EventType } from '@bin/subscriber'
import { EventArgs } from '@bin/typings/Event'
import Painter from '@bin/painter'
import Polygon from '@bin/shape/polygon'
import Line from '@bin/shape/line'
import Point from '@bin/shape/point'
import Circle from '@bin/shape/circle'
import Rectangle from '@bin/shape/rectangle'

type OverrideEntityFunc = (
  this: Drawer,
  action: EventType,
  entity: Entity
) => Entity | void

/**
 * @todo 为了防止产生侵入性bug，请在配置前确认相关事件是否可用，不再默认移除原生事件
 */
export type OperationType = {
  /**
   * @desc 勾画开始事件
   * @type EventType
   * @default LEFT_CLICK
   */
  START?: EventType
  /**
   * @desc 勾画移动事件
   * @type EventType
   * @default MOUSE_MOVE
   */
  MOVING?: EventType
  /**
   * @desc 勾画结束事件
   * @type EventType
   * @default RIGHT_CLICK
   */
  END?: EventType

  /**
   * @desc 勾画销毁事件
   * @type EventType
   * @default MIDDLE_CLICK
   */
  DESTROY?: EventType
}

export type DrawerCallback = (entity: Entity) => void

/**
 * @desc 操作回调
 * @param action 事件名
 * @param move 事件参数
 */
export type ActionCallback = (
  this: Drawer,
  action: EventType,
  move: EventArgs
) => void

type Status = 'INIT' | 'START' | 'PAUSE' | 'DESTROY'

export interface DrawOption {
  /**
   * @desc 勾画的视图
   */
  viewer: Viewer

  /**
   * @desc 是否使用地形，当开启时需要浏览器支持地形选取功能，如果不支持将会被关闭
   */
  terrain?: boolean

  /**
   * @desc  操作方式
   */
  operateType?: OperationType

  dynamicGraphicsOptions?: {
    POINT?: PointGraphics.ConstructorOptions
    POLYLINE?: PolylineGraphics.ConstructorOptions
    POLYGON?: PolygonGraphics.ConstructorOptions
    CIRCLE?: EllipseGraphics.ConstructorOptions
    RECTANGLE?: RectangleGraphics.ConstructorOptions
  }
  action?: ActionCallback
  sameStyle?: boolean
}

type StartOption = {
  /**
   * @desc 勾画类型 目前支持 Polygon、Line、Point、Circle、Rectangle
   * @default false
   */
  type: 'POLYGON' | 'POLYLINE' | 'POINT' | 'CIRCLE' | 'RECTANGLE'

  /**
   * 是否只勾画一次，如果设为true，则在第一勾画结束时停止
   * @default undefined
   */
  once?: boolean
  /**
   * @desc 是否使用单例模式，如果开启，当勾画第二个图形时会销毁第一个图形
   */
  oneInstance?: boolean

  /**
   * @desc 勾画的Entity选项，如Point对应#PointGraphics.ConstructorOptions
   */
  options?: object

  /**
   * @desc 动态勾画没有确定图形时的图形配置，类型与options选项相同
   */
  dynamicOptions?: object
}

type Optional<T> = {
  [U in keyof T]?: T[U] extends object ? Optional<T[U]> : T[U]
}

const defaultOptions: Optional<DrawOption> = {
  terrain: false,
  operateType: {
    START: 'LEFT_CLICK',
    MOVING: 'MOUSE_MOVE',
    END: 'RIGHT_CLICK',
    DESTROY: 'MIDDLE_CLICK'
  },

  /**
   * 图形勾画时的Entity样式
   */
  dynamicGraphicsOptions: {
    POLYLINE: {
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

export default class Drawer {
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

  private _dropPoint: (move: EventArgs) => void
  private _moving: (move: EventArgs) => void
  private _playOff: (move: EventArgs) => void

  /**
   * @desc 操作方式
   */
  private _operateType: OperationType

  /**
   *
   */
  private _startOptions: StartOption

  private _oneInstance: boolean

  private _once: boolean

  /**
   * @desc 动作回调
   */
  private _action: ActionCallback

  private _sameStyle: boolean

  get status(): Status {
    return this._status
  }

  get isDestroy(): boolean {
    return this._status === 'DESTROY'
  }

  constructor(options: DrawOption) {
    this._option = defaultValue(options, {})

    if (!options.viewer) throw new Error('请输入Viewer对象！')

    // 设置操作方式
    this._operateType = defaultValue(this._option.operateType, {})

    this._operateType = Object.assign(
      defaultOptions.operateType,
      this._operateType
    )

    this._viewer = this._option.viewer
    this._terrain = defaultValue(this._option.terrain, defaultOptions.terrain)

    this._action = this._option.action

    this._dynamicGraphicsOptions = defaultValue(
      this._option.dynamicGraphicsOptions,
      defaultOptions.dynamicGraphicsOptions
    )

    if (this._terrain && !this._viewer.scene.pickPositionSupported) {
      console.warn(
        '浏览器不支持 pickPosition属性，无法在有地形的情况下正确选点'
      )
      this._terrain = false
    }

    this._subscriber = new Subscriber(this._viewer)

    this._status = 'INIT'
    // 为了防止产生侵入性bug，请在使用前确认相关事件是否可用，不再默认移除原生事件
    // Object.keys(this._option.keyboard).forEach(key =>
    //   Subscriber.removeNative(this._viewer, this._option.keyboard[key])
    // )

    this._subscriber.addExternal(() => {
      this.destroy()
    }, this._operateType.DESTROY)
  }

  /**
   * @param extraOptions
   * @param dynamicOptions
   */
  private _initPainter(extraOptions?: object, dynamicOptions?: object): void {
    const painterOptions = { viewer: this._viewer, terrain: this._terrain }

    this._painter = new Painter(painterOptions)

    this._sameStyle = this._option.sameStyle

    const $flag: any = this._sameStyle
      ? false
      : Object.assign(
          {},
          this._dynamicGraphicsOptions[this._type],
          dynamicOptions
        )

    if (this._type === 'POLYGON') {
      this._typeClass = new Polygon(this._painter, extraOptions, $flag)
    } else if (this._type === 'POLYLINE') {
      this._typeClass = new Line(this._painter, extraOptions, $flag)
    } else if (this._type === 'POINT') {
      this._typeClass = new Point(this._painter, extraOptions)
    } else if (this._type === 'CIRCLE') {
      this._typeClass = new Circle(this._painter, extraOptions, $flag)
    } else if (this._type === 'RECTANGLE') {
      this._typeClass = new Rectangle(this._painter, extraOptions, $flag)
    }

    this._dropPoint = this._typeClass.dropPoint.bind(this._typeClass)
    this._moving = this._typeClass.moving.bind(this._typeClass)
    this._playOff = this._typeClass.playOff.bind(this._typeClass)
  }

  /**
   * @desc 绘制函数,
   * @param config 绘制配置，可以通过定义options直接改写结果而不再填第二个参数
   * @param overrideFunc Entity 重写函数，用于重写绘制结果，如果 overrideFunc返回一个Entity,则将该Entity添加到Viewer中，否则结束函数无操作
   * @returns
   */
  start(config: StartOption, overrideFunc?: OverrideEntityFunc): void {
    overrideFunc = defaultValue(
      overrideFunc,
      (action: EventType, entity: Entity) => entity
    )

    config = defaultValue(config, {})
    config.options = defaultValue(config.options, {})
    config.dynamicOptions = defaultValue(config.dynamicOptions, {})

    this._once = defaultValue(config.once, false)
    this._oneInstance = defaultValue(config.oneInstance, false)

    if (!this._isSupport(config.type)) {
      throw new Error(`the type '${config.type}' is not support`)
    }

    this._type = config.type

    this._initPainter(clone(config.options), clone(config.dynamicOptions))

    if (this._status === 'START') return

    this._status = 'START'

    /**
     * @desc 是否开始绘制
     */
    let isStartDrow = false

    const startId = this._subscriber.addExternal(move => {
      isStartDrow = true

      this._dropPoint(move)

      if (this._action) this._action(this._operateType.START, move)

      // 如果是点，则此时执行点的结束绘制操作
      if (this._type !== 'POINT') return

      this._complete(overrideFunc)

      isStartDrow = false
    }, this._operateType.START)

    const moveId = this._subscriber.addExternal(move => {
      if (!isStartDrow) return

      this._moving(move)

      // ActionCallback
      if (this._action) this._action(this._operateType.MOVING, move)
    }, this._operateType.MOVING)
    // Redraw the shape so it's not dynamic and remove the dynamic shape.

    const endId = this._subscriber.addExternal(move => {
      if (!isStartDrow) return

      // 结束绘制，确定实体
      this._playOff(move)

      // ActionCallback
      if (this._action) this._action(this._operateType.END, move)

      if (this._type === 'POINT') return

      this._complete(overrideFunc)

      isStartDrow = false
    }, this._operateType.END)

    this._events = [startId, moveId, endId]
  }

  private _complete(override: OverrideEntityFunc): void {
    // 如果是线和面，则此时将实例添加到Viewer中
    this._once && this.pause()

    if (this._oneInstance && this.$Instance) {
      this._viewer.entities.remove(this.$Instance)
    }

    this.$Instance = override.call(
      this,
      this._operateType.END,
      this._typeClass.result
    )

    if (this.$Instance instanceof Entity)
      this._viewer.entities.add(this.$Instance)
  }

  private _isSupport(type: string) {
    return ['POLYGON', 'POLYLINE', 'POINT', 'CIRCLE', 'RECTANGLE'].includes(
      type
    )
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
