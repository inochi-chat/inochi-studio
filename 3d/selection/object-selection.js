
import * as THREE from "three";

export function createObjectSelection({
  camera,
  renderer,
  objectManager,
  transform,
  objectLock,
  onSelect,
  multiSelectionController
}) {
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  function selectAtPointer(event) {
    if (transform.dragging) return;

    const rect = renderer.domElement.getBoundingClientRect();

    if (!rect.width || !rect.height) return;

    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);

    const managedObjects = objectManager.getAll();
    const hits = raycaster.intersectObjects(managedObjects, true);

    const selectedHit = hits.find(hit =>
      managedObjects.includes(hit.object) &&
      !objectLock?.isLocked(hit.object)
    );

    const object = selectedHit?.object ?? null;

    if (multiSelectionController) {
      const additive =
        event.shiftKey ||
        event.ctrlKey ||
        event.metaKey;

      if (additive) {
        if (object) {
          multiSelectionController.toggle(object);
        }
      } else {
        multiSelectionController.select(object, false);
      }

      const selected = multiSelectionController.getSelected();
      onSelect(selected.length ? selected[0] : null);
      return;
    }

    if (object) {
      onSelect(object);
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
