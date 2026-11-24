
import * as THREE from "three";

export function createObjectManager(scene) {
  const objects = [];

  let selectedObject = null;
  let objectCounter = 0;

  // 取り外したオブジェクトの親と順番を記録
  const detachedInfo = new Map();

  function add(geometry, type) {
    if (!geometry) return null;

    objectCounter++;

    const material = new THREE.MeshStandardMaterial({
      color: 0x9b83ff,
      roughness: 0.55,
      metalness: 0.05
    });

    const object = new THREE.Mesh(geometry, material);

    object.name = `${type}_${objectCounter}`;
    object.position.y = 0.5;
    object.castShadow = true;
    object.receiveShadow = true;

    scene.add(object);
    objects.push(object);

    return object;
  }

  function detach(object) {
    if (!object) return;

    const index = objects.indexOf(object);
    if (index === -1) return;

    detachedInfo.set(object, {
      parent: object.parent || scene,
      index
    });

    if (object.parent) {
      object.parent.remove(object);
    }

    objects.splice(index, 1);

    if (selectedObject === object) {
      selectedObject = null;
    }
  }

  function restore(object, index) {
    if (!object || objects.includes(object)) return;

    const info = detachedInfo.get(object);

    const safeIndex = Math.max(
      0,
      Math.min(
        index ?? info?.index ?? objects.length,
        objects.length
      )
    );

    objects.splice(safeIndex, 0, object);

    let parent = info?.parent || scene;

    // 親がシーンから切り離されている場合は
    // いったんシーン直下に戻す
    if (parent !== scene && !scene.getObjectById(parent.id)) {
      parent = scene;
    }

    parent.add(object);
    detachedInfo.delete(object);
  }

  function dispose(object) {
    if (!object) return;

    if (objects.includes(object)) {
      detach(object);
    } else if (object.parent) {
      object.parent.remove(object);
    }

    if (object.geometry) {
      object.geometry.dispose();
    }

    if (Array.isArray(object.material)) {
      object.material.forEach(material => material.dispose());
    } else if (object.material) {
      object.material.dispose();
    }

    if (selectedObject === object) {
      selectedObject = null;
    }
  }

  function remove(object) {
    dispose(object);
  }

  function select(object) {
    if (object && !objects.includes(object)) return;

    selectedObject = object || null;
  }

  return {
    add,
    remove,
    detach,
    restore,
    dispose,
    select,

    getAll() {
      return [...objects];
    },

    getSelected() {
      return selectedObject;
    },

    setSelected(object) {
      select(object);
    },

    getCount() {
      return objects.length;
    },

    getIndex(object) {
      return objects.indexOf(object);
    }
  };
}
