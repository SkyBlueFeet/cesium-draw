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

## Usage

`npm`

```bash
npm i cesium-plugins-draw --save //或 yarn add cesium-plugins-draw
```

## Example

```js
Cesium.Ion.defaultAccessToken = '你的IonToken'
const viewer = new Cesium.Viewer('cesium-container', {
  terrainProvider: Cesium.createWorldTerrain()
})

const drawer = new cesiumDraw({
  viewer,
  terrain: false,
  action: (EventType, moveMent) => {
    console.log(EventType, moveMent)
  }
})

// 画面
drawer.start({
  type: 'POLYGON',
  oneInstance: false
})
```
