
import * as THREE from "three";

export function createLighting(scene) {
  const ambient = new THREE.AmbientLight(
    0xffffff, 1.5
  );
  scene.add(ambient);

  const directional = new THREE.DirectionalLight(
    0xffffff, 2
  );

  directional.position.set(5, 10, 7);
  directional.castShadow = true;
  scene.add(directional);
}
