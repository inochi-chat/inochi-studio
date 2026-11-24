
import * as THREE from "three";

export function createObjectManager(scene) {
  const objects = [];

  let selectedObject = null;
  let objectCounter = 0;

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

  function remove(object) {
    if (!object) return;

    const index = objects.indexOf(object);
    if (index === -1) return;

    scene.remove(object);

    object.geometry.dispose();

    if (Array.isArray(object.material)) {
      object.material.forEach((material) => material.dispose());
    } else {
      object.material.dispose();
    }

    objects.splice(index, 1);

    if (selectedObject === object) {
      selectedObject = null;
    }
  }

  function select(object) {
    if (object && !objects.includes(object)) return;

    selectedObject = object || null;
  }

  return {
    add,
    remove,
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
    }
  };
}
