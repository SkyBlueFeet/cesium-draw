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

- Cesium 框架 实现 画点、折线、多边形面、圆、长方形等平面图形
- 封装了绘制函数并放开了绘制操作的事件回调
- 分别定义绘制时和绘制后的样式,可以通过函数拦截下绘制完成的图形

## Description

个人随手作品.仅供各位道友参考实现,没有经过严格的测试,不建议用于生产环境

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

/**
 * @desc 绘制事件,定义执行绘制的事件类型
 * @todo 为了防止产生侵入性bug，请在配置前确认相关事件是否可用，不再默认移除原生事件
 */
declare type OperationType = {
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

declare type Status = 'INIT' | 'START' | 'PAUSE' | 'DESTROY'

declare type OverrideEntityFunc = (
  this: Drawer,
  action: EventType,
  entity: Entity
) => Entity | void

interface DrawOption {
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

declare type StartOption = {
  /**
   * @desc 勾画类型 目前支持 Polygon、Line、Point、Circle、Rectangle
   * @default false
   */
  type: 'POLYGON' | 'POLYLINE' | 'POINT' | 'CIRCLE' | 'RECTANGLE'
  /**
   * 是否只勾画一次，如果设为true，则在第一勾画结束时执行Drawer#pause
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
   * @desc 动态勾画没有确定图形时的图形配置，类型与options选项相同,会与DrawOption.dynamicGraphicsOptions合并
   */
  dynamicOptions?: object
}
```

## Notification

如果有使用地形数据的话,请开启 DrawOption 的 terrain 选项,否则会出现选点与位置不匹配的情况

## Example

请查看 [`__test__/index.html`](https://github.com/SkyBlueFeet/cesium-draw/blob/main/__test__/index.html)

## Reference

[Drawing on Terrain](https://sandcastle.cesium.com/?src=Drawing%20on%20Terrain.html)

## LICENSE

MIT
