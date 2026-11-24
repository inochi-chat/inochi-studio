
import * as THREE from "three";

export function createObjectManager(scene) {
  const objects = [];

  let selectedObject = null;
  let objectCounter = 0;

  // オブジェクト追加
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

  // 一時的にシーンから外す
  function detach(object) {
    if (!object) return;

    const index = objects.indexOf(object);
    if (index === -1) return;

    scene.remove(object);
    objects.splice(index, 1);

    if (selectedObject === object) {
      selectedObject = null;
    }
  }

  // オブジェクトを復元
  function restore(object, index = objects.length) {
    if (!object || objects.includes(object)) return;

    const safeIndex = Math.max(
      0,
      Math.min(index, objects.length)
    );

    objects.splice(safeIndex, 0, object);
    scene.add(object);
  }

  // 完全削除・メモリ解放
  function dispose(object) {
    if (!object) return;

    if (objects.includes(object)) {
      detach(object);
    } else {
      scene.remove(object);
    }

    if (object.geometry) {
      object.geometry.dispose();
    }

    if (Array.isArray(object.material)) {
      object.material.forEach((material) => {
        material.dispose();
      });
    } else if (object.material) {
      object.material.dispose();
    }

    if (selectedObject === object) {
      selectedObject = null;
    }
  }

  // 従来の削除機能
  function remove(object) {
    dispose(object);
  }

  // 選択
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
