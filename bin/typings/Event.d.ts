import { Cartesian2 } from 'cesium'

export interface EventArgs {
  position?: Cartesian2
  endPosition?: Cartesian2
  startPosition?: Cartesian2
  [name: string]: any
}
