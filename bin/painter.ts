import * as Cesium from "cesium";
import { Entity } from "cesium";

interface DrawOption {
  viewer: Cesium.Viewer;
  terrain?: boolean;
}

export default class Painter {
  _viewer: Cesium.Viewer;
  _terrain: boolean;

  _activeShapePoints: Cesium.Cartesian3[] = [];

  _dynamicShapeEntity: Entity;

  _breakPointEntities: Entity[] = [];

  constructor(options: DrawOption) {
    this._viewer = options.viewer;
    this._terrain = options.terrain;
  }

  addView(entity: Entity | Entity.ConstructorOptions): Cesium.Entity {
    return this._viewer.entities.add(entity);
  }

  createPoint(worldPosition: Cesium.Cartesian3): Cesium.Entity {
    return new Entity({
      position: worldPosition,
      point: {
        color: Cesium.Color.WHITE,
        pixelSize: 5,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
      }
    });
  }

  calcPositions(position: Cesium.Cartesian2): Cesium.Cartesian3 {
    // We use `viewer.scene.pickPosition` here instead of `viewer.camera.pickEllipsoid` so that
    // we get the correct point when mousing over terrain.
    return this._terrain
      ? this._viewer.scene.pickPosition(position)
      : this._viewer.camera.pickEllipsoid(position);
  }

  reset(): void {
    this._viewer.entities.remove(this._dynamicShapeEntity);

    this._dynamicShapeEntity = undefined;

    while (this._breakPointEntities.length) {
      this._viewer.entities.remove(this._breakPointEntities.pop());
    }

    this._activeShapePoints = [];
    // this._activePoint = Cesium.Cartesian3.ZERO;
  }
}
