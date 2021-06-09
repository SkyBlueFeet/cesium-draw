<!--
 * @author: SkyBlue
 * @LastEditors: SkyBlue
 * @Date: 2020-10-06 19:13:41
 * @LastEditTime: 2020-10-07 00:56:48
 * @Gitee: https://gitee.com/skybluefeet
 * @Github: https://github.com/SkyBlueFeet
-->

# cesium-plugins-draw

## Feature

- 通过 Cesium 实现 画点、折线、多边形面、圆、长方形等平面图形

## Install

```bash
npm i cesium-plugins-draw --save //或 yarn add cesium-plugins-draw
```

## Usage

```ts
import CesiumDraw from 'cesium-plugins-draw'

Cesium.Ion.defaultAccessToken = '你的IonToken'

const viewer = new Cesium.Viewer('cesium-container', {})

const drawer = new CesiumDraw({
  /** DrawOption **/
})

// 开始绘制图形
drawer.start(
  {
    /** StartOption **/
  },
  // 实体重写函数，如果函数没有返回一个Entity实例，则不会添加到视图中
  overrideFunc
)

// 暂停绘制
drawer.pause()
//销毁绘制对象
drawer.destroy()
```

`声明`

```ts
declare type OverrideEntityFunc = (
  this: Drawer,
  action: EventType,
  entity: Entity
) => Entity | void

declare type StartOption = {
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

class Drawer {
  get status(): Status
  get isDestroy(): boolean
  constructor(options: DrawOption)

  /**
   * @desc 绘制函数,
   * @param config 绘制配置，可以通过定义options直接改写结果而不再填第二个参数
   * @param overrideFunc Entity 重写函数，用于重写绘制结果，如果 overrideFunc返回一个Entity,则将该Entity添加到Viewer中，否则结束函数无操作
   * @returns
   */
  start(config: StartOption, overrideFunc?: OverrideEntityFunc): void

  /**
   * @desc 暂停绘制
   * */
  pause(): void
  /**
   * @desc 销毁绘制对象
   *
   * */
  destroy(): void
}
```

## Example
