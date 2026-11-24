
import * as THREE from "three";

export function createObjectSelection({
  camera,
  renderer,
  objectManager,
  transform,
  onSelect
}) {
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  function selectAtPointer(event) {
    if (transform.dragging) return;

    const rect = renderer.domElement.getBoundingClientRect();

    if (!rect.width || !rect.height) return;

    pointer.x =
      ((event.clientX - rect.left) / rect.width) * 2 - 1;

    pointer.y =
      -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);

    const hits = raycaster.intersectObjects(
      objectManager.getAll(),
      false
    );

    if (hits.length > 0) {
      onSelect(hits[0].object);
    } else {
      onSelect(null);
    }
  }

  renderer.domElement.addEventListener(
    "pointerdown",
    selectAtPointer
  );

  return {
    dispose() {
      renderer.domElement.removeEventListener(
        "pointerdown",
        selectAtPointer
      );
    }
  };
}
