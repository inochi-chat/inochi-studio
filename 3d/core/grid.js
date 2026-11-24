
import * as THREE from "three";

export function createGrid(scene) {
  const grid = new THREE.GridHelper(
    20, 20, 0x8877cc, 0x39334f
  );

  scene.add(grid);
  scene.add(new THREE.AxesHelper(2));
}
