import Cesium, { Cartesian3 } from 'cesium'

export type hierarchyHandler = (
  hierarchy: Cesium.Cartesian3[] | Cesium.CallbackProperty | Cartesian3
) => Cesium.Entity.ConstructorOptions
