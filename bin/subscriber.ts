/*
 * @author: SkyBlue
 * @LastEditors: SkyBlue
 * @Date: 2020-09-25 09:38:05
 * @LastEditTime: 2020-10-09 10:57:20
 * @Gitee: https://gitee.com/skybluefeet
 * @Github: https://github.com/SkyBlueFeet
 */
import {
  Viewer,
  ScreenSpaceEventType,
  ScreenSpaceEventHandler,
  Entity
} from 'cesium'
import { uniqueId } from '@bin/utils/random'
import { Movement } from '@bin/typings/Event'

export type ListenCallback<T extends Entity> = (
  movement: Movement,
  substance: T
) => void

export type ExternalListenCallback = (movement: Movement) => void

// const eventType = ;

export type EventType =
  | 'LEFT_DOWN'
  | 'LEFT_UP'
  | 'LEFT_CLICK'
  | 'LEFT_DOUBLE_CLICK'
  | 'RIGHT_DOWN'
  | 'RIGHT_UP'
  | 'RIGHT_CLICK'
  | 'MIDDLE_DOWN'
  | 'MIDDLE_UP'
  | 'MIDDLE_CLICK'
  | 'MOUSE_MOVE'
  | 'WHEEL'
  | 'PINCH_START'
  | 'PINCH_MOVE'
  | 'PINCH_END'

type EventCollection = Record<EventType, Map<string, ListenCallback<Entity>>>

type ExternalEventCollection = Record<
  EventType,
  Map<string, ListenCallback<Entity>>
>

export default class Subscriber {
  private viewer: Viewer

  private handler: ScreenSpaceEventHandler

  private eventCollection: EventCollection = Object.create(null)

  private externalEventCollection: ExternalEventCollection = Object.create(null)

  private readonly eventTypeList: EventType[] = [
    'LEFT_DOWN',
    'LEFT_UP',
    'LEFT_CLICK',
    'LEFT_DOUBLE_CLICK',
    'RIGHT_DOWN',
    'RIGHT_UP',
    'RIGHT_CLICK',
    'MIDDLE_DOWN',
    'MIDDLE_UP',
    'MIDDLE_CLICK',
    'MOUSE_MOVE',
    'WHEEL',
    'PINCH_START',
    'PINCH_MOVE',
    'PINCH_END'
  ]

  private isDestroy: boolean

  constructor(viewer: Viewer, element?: HTMLCanvasElement) {
    this.viewer = viewer
    this.handler = new ScreenSpaceEventHandler(element || this.viewer.canvas)
    this.isDestroy = false
    this.initListener()
  }

  private initListener(): void {
    this.eventTypeList.forEach(type => {
      this.eventCollection[type] = new Map()
      this.externalEventCollection[type] = new Map()
    })
  }

  private eventRegister(eventType: EventType): void {
    if (this.isDestroy) return
    const eventCollection = this.eventCollection[eventType]
    const externalEventCollection = this.externalEventCollection[eventType]
    this.handler.setInputAction((movement: Movement) => {
      if (externalEventCollection.size > 0) {
        const iterator = externalEventCollection.values()
        let val = iterator.next()
        while (!val.done) {
          val.value(movement)
          val = iterator.next()
        }
      }

      if (this.isDestroy) return

      if (movement.position) {
        const entity: Entity = this.viewer.scene.pick(movement.position)?.id
        if (
          entity &&
          eventCollection.has(entity.id) &&
          typeof eventCollection.get(entity.id) === 'function'
        ) {
          eventCollection.get(entity.id)(movement, entity)
        }
      }
    }, ScreenSpaceEventType[eventType])
  }

  /**
   * @description 为Entity添加监听事件
   *
   * @event
   *
   * @param {Function} callback 需要相应的事件
   *
   * @param {EventType} eventType 事件类型
   */
  add<T extends Entity>(
    substances: T | T[],
    callback: ListenCallback<T>,
    eventType: EventType
  ): void {
    if (this.isDestroy) return

    if (
      this.eventCollection[eventType].size === 0 &&
      this.externalEventCollection[eventType].size === 0
    )
      this.eventRegister(eventType)

    substances = Array.isArray(substances) ? substances : [substances]

    for (const substance of substances) {
      this.eventCollection[eventType].set(substance.id, callback)
    }
  }

  /**
   * @description 添加特定事件，与add不同在于该事件不会过滤Substance
   * @param callback 事件处理函数
   * @param eventType 事件类型
   * @return {string} Event Id  事件移除时需要提供事件ID
   */
  addExternal(callback: ExternalListenCallback, eventType: EventType): string {
    if (this.isDestroy) return

    if (
      this.eventCollection[eventType].size === 0 &&
      this.externalEventCollection[eventType].size === 0
    )
      this.eventRegister(eventType)

    const eId = uniqueId()
    this.externalEventCollection[eventType].set(eId, callback)
    return eId
  }

  /**
   *@description 移除指定Substance的相应事件
   * @param substances 需要移除事件的Substance
   * @param eventType 需要移除的时间类型
   */
  remove<T extends Entity>(substances: T | T[], eventType: EventType): void {
    if (this.isDestroy) return

    substances = Array.isArray(substances) ? substances : [substances]
    for (const substance of substances) {
      if (this.eventCollection[eventType].has(substance.id)) {
        this.eventCollection[eventType].delete(substance.id)
      }
    }
  }

  removeExternal(ids: string | string[], eventType?: EventType): void {
    if (this.isDestroy) return

    ids = Array.isArray(ids) ? ids : [ids]

    for (const id of ids) {
      const type = eventType || this.searchExternal(id)
      if (this.externalEventCollection[type].has(id)) {
        this.externalEventCollection[type].delete(id)
      }
    }
  }

  private searchExternal(id: string): EventType {
    if (this.isDestroy) return

    const types: EventType[] = Object.keys(this.externalEventCollection) as any

    for (const type of types) {
      const events = this.externalEventCollection[type]
      if (events.has(id)) return type
    }
    return undefined
  }

  static removeNative(viewer: Viewer, eventType: EventType): void {
    viewer.screenSpaceEventHandler.removeInputAction(
      this.convertCesiumEventType(eventType)
    )
  }

  static convertCesiumEventType(
    subscriberEventType: EventType
  ): ScreenSpaceEventType {
    return ScreenSpaceEventType[subscriberEventType]
  }

  destroy(): void {
    this.isDestroy = true
    this.externalEventCollection = undefined
    this.eventCollection = undefined
    this.viewer = undefined
    this.handler.destroy()

    // 销毁方法
    this.add = undefined
    this.addExternal = undefined
    this.remove = undefined
    this.removeExternal = undefined
    this.destroy = undefined
  }
}
