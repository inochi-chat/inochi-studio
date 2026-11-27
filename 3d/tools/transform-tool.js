
import * as THREE from "three";
import { TransformControls } from "three/addons/controls/TransformControls.js";

export function createTransformTool(
  camera,
  renderer,
  scene,
  orbit,
  objectLock,
  objectGroup
) {
  const transform = new TransformControls(
    camera,
    renderer.domElement
  );

  scene.add(transform.getHelper());

  let multiGroup = null;
  let originalParents = new Map();

  transform.addEventListener("dragging-changed", event => {
    orbit.enabled = !event.value;
  });

  // 自分自身と親グループのロックを確認
  function isLocked(object) {
    if (!object) return false;

    let current = object;

    while (current && current !== scene) {
      if (objectLock?.isLocked(current)) {
        return true;
      }

      if (
        objectGroup?.isGroup(current) &&
        objectGroup.isGroupLocked(current)
      ) {
        return true;
      }

      current = current.parent;
    }

    return false;
  }

  // 複数選択グループを解除
  function clearMultiGroup() {
    if (!multiGroup) return;

    transform.detach();

    for (const [object, parent] of originalParents) {
      if (parent) {
        parent.attach(object);
      } else {
        scene.attach(object);
      }
    }

    scene.remove(multiGroup);

    multiGroup = null;
    originalParents.clear();
  }

  // 通常の単体選択
  function attach(object) {
    clearMultiGroup();

    if (!object || isLocked(object)) {
      transform.detach();
      return;
    }

    transform.attach(object);
  }

  // 複数オブジェクトをまとめて接続
  function attachMultiple(objects) {
    clearMultiGroup();
    transform.detach();

    const selected = objects.filter(object =>
      object && !isLocked(object)
    );

    if (selected.length === 0) return;

    const selectedSet = new Set(selected);

    const topLevelObjects = selected.filter(object => {
      let parent = object.parent;

      while (parent && parent !== scene) {
        if (selectedSet.has(parent)) {
          return false;
        }

        parent = parent.parent;
      }

      return true;
    });

    if (topLevelObjects.length === 0) return;

    scene.updateMatrixWorld(true);

    const center = new THREE.Vector3();

    for (const object of topLevelObjects) {
      const worldPosition = new THREE.Vector3();
      object.getWorldPosition(worldPosition);
      center.add(worldPosition);
    }

    center.divideScalar(topLevelObjects.length);

    multiGroup = new THREE.Group();
    multiGroup.position.copy(center);
    scene.add(multiGroup);

    for (const object of topLevelObjects) {
      originalParents.set(object, object.parent);
      multiGroup.attach(object);
    }

    transform.attach(multiGroup);
  }

  return {
    attach,
    attachMultiple,

    detach() {
      clearMultiGroup();
      transform.detach();
    },

    setMode(mode) {
      transform.setMode(mode);
    },

    get dragging() {
      return transform.dragging;
    },

    addEventListener(type, callback) {
      transform.addEventListener(type, callback);
    }
  };
}
