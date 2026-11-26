
import * as THREE from "three";

export function createCamera() {
  const camera = new THREE.PerspectiveCamera(
    50, 1, 0.1, 1000
  );

  camera.position.set(6, 5, 8);
  camera.lookAt(0, 0, 0);

  return camera;
}
