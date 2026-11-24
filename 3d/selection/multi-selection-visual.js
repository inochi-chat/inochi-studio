
import * as THREE from "three";

export function createMultiSelectionVisual() {
  const helpers = new Map();

  function add(object) {
    if (!object || helpers.has(object)) return;

    const helper = new THREE.BoxHelper(object, 0x00ffff);
    helpers.set(object, helper);

    if (object.parent) {
      object.parent.add(helper);
    }
  }

  function remove(object) {
    const helper = helpers.get(object);
    if (!helper) return;

    helper.parent?.remove(helper);
    helper.geometry.dispose();
    helper.material.dispose();

    helpers.delete(object);
  }

  function clear() {
    for (const object of [...helpers.keys()]) {
      remove(object);
    }
  }

  function update() {
    for (const [object, helper] of helpers) {
      if (!object.parent) {
        remove(object);
        continue;
      }

      helper.update();
    }
  }

  return {
    add,
    remove,
    clear,
    update
  };
}
