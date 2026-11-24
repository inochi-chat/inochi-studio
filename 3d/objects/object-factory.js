
import * as THREE from "three";

/**
 * 立方体の形状を作成
 */
export function createCubeGeometry() {
  return new THREE.BoxGeometry(1, 1, 1);
}

/**
 * 球の形状を作成
 */
export function createSphereGeometry() {
  return new THREE.SphereGeometry(0.7, 32, 24);
}

/**
 * 円柱の形状を作成
 */
export function createCylinderGeometry() {
  return new THREE.CylinderGeometry(
    0.6,
    0.6,
    1.5,
    32
  );
}

/**
 * 種類を指定して形状を作成
 */
export function createGeometry(type) {
  switch (type) {
    case "cube":
      return createCubeGeometry();

    case "sphere":
      return createSphereGeometry();

    case "cylinder":
      return createCylinderGeometry();

    default:
      console.warn("未対応のオブジェクトタイプ:", type);
      return null;
  }
}
